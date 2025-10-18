import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

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
}
