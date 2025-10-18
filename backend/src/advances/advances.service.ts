import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';

@Injectable()
export class AdvancesService {
  constructor(private prisma: PrismaService) {}

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async create(dto: CreateAdvanceDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id: dto.workerId } });

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    if (!worker.isActive) {
      throw new BadRequestException('Cannot give advance to an inactive worker');
    }

    const advanceDate = new Date(`${dto.date}T00:00:00Z`);
    if (advanceDate > this.startOfToday()) {
      throw new BadRequestException('Advance date cannot be in the future');
    }

    return this.prisma.advance.create({
      data: {
        workerId: dto.workerId,
        date: advanceDate,
        amount: dto.amount,
        reason: dto.reason,
      },
      include: {
        worker: true,
      },
    });
  }

  async findAll(params?: {
    workerId?: number;
    startDate?: string;
    endDate?: string;
    month?: string;
  }) {
    const { workerId, startDate, endDate, month } = params || {};

    const where: any = {};

    if (workerId) {
      where.workerId = workerId;
    }

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = new Date(year, monthPart - 1, 1);
      const end = new Date(year, monthPart, 1);
      where.date = { gte: start, lt: end };
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(`${startDate}T00:00:00`);
      }
      if (endDate) {
        const end = new Date(`${endDate}T00:00:00`);
        end.setDate(end.getDate() + 1);
        where.date.lt = end;
      }
    }

    return this.prisma.advance.findMany({
      where,
      include: {
        worker: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async update(id: number, dto: UpdateAdvanceDto) {
    const advance = await this.prisma.advance.findUnique({ where: { id } });

    if (!advance) {
      throw new NotFoundException(`Advance with the id ${id} not found`);
    }

    if (dto.date) {
      const newDate = new Date(`${dto.date}T00:00:00Z`);
      if (newDate > this.startOfToday()) {
        throw new BadRequestException('Advance rate cannot be in the future');
      }
    }

    return this.prisma.advance.update({
      where: { id },
      data: {
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date && { date: new Date(`${dto.date}T00:00:00Z`) }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
      },
      include: {
        worker: true,
      },
    });
  }

  async remove(id: number) {
    const advance = await this.prisma.advance.findUnique({
      where: { id },
      include: {
        worker: true,
      },
    });

    if (!advance) {
      throw new NotFoundException(`Advance with id ${id} not found`);
    }

    await this.prisma.advance.delete({
      where: { id },
    });

    return {
      message: `Advance of ₹${advance.amount} for ${advance.worker.name} deleted successfully`,
      data: advance,
    };
  }
}
