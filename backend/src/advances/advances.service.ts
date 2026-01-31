import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateService } from 'src/shared/date.service';
import { SalaryLockService } from 'src/shared/salary-lock.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { FilterAdvancesDto } from './dto/filter-advances.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';

@Injectable()
export class AdvancesService {
  constructor(
    private prisma: PrismaService,
    private dateService: DateService,
    private salaryLock: SalaryLockService,
  ) {}

  async create(dto: CreateAdvanceDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id: dto.workerId } });

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    if (!worker.isActive) {
      throw new BadRequestException('Cannot give advance to an inactive worker');
    }

    const advanceDate = this.dateService.parseDate(dto.date);
    if (advanceDate > this.dateService.startOfToday()) {
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

  async findAll(params?: FilterAdvancesDto) {
    const { workerId, startDate, endDate, month } = params || {};

    const where: Prisma.AdvanceWhereInput = {};

    if (workerId) {
      where.workerId = workerId;
    }

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = this.dateService.startOfMonth(year, monthPart);
      const end = this.dateService.startOfMonth(year, monthPart + 1);
      where.date = { gte: start, lt: end };
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = this.dateService.parseDate(startDate);
      }
      if (endDate) {
        const end = this.dateService.parseDate(endDate);
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

    await this.salaryLock.assertNotLocked(advance.workerId, advance.date, 'advance');

    if (dto.date) {
      const newDate = this.dateService.parseDate(dto.date);
      if (newDate > this.dateService.startOfToday()) {
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

    await this.salaryLock.assertNotLocked(advance.workerId, advance.date, 'advance');

    await this.prisma.advance.delete({
      where: { id },
    });

    return {
      message: `Advance of ₹${advance.amount} for ${advance.worker.name} deleted successfully`,
      data: advance,
    };
  }

  async getWorkerTotal(workerId: number, startDate?: string, endDate?: string) {
    const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    const where: Prisma.AdvanceWhereInput = {};

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(`${startDate}T00:00:00Z`);
      }

      if (endDate) {
        const end = new Date(`${endDate}T00:00:00Z`);
        end.setDate(end.getDate() + 1);
        where.date.lt = end;
      }
    }

    const result = await this.prisma.advance.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return {
      workerId,
      workerName: worker.name,
      totalAdvances: result._sum.amount || 0,
      startDate: startDate || null,
      endDate: endDate || null,
    };
  }

  async getWorkersWithLatestAdvance() {
    const workerIds = await this.prisma.advance.findMany({
      select: { workerId: true },
      distinct: ['workerId'],
    });

    const workersWithLatestAdvance = await Promise.all(
      workerIds.map(async ({ workerId }) => {
        const latestAdvance = await this.prisma.advance.findFirst({
          where: { workerId },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          include: {
            worker: {
              select: { name: true },
            },
          },
        });

        return latestAdvance;
      }),
    );

    const result = workersWithLatestAdvance
      .filter((adv) => adv !== null)
      .map((adv) => ({
        workerId: adv.workerId,
        workerName: adv.worker.name,
        lastAdvanceId: adv.id,
        lastAdvanceDate: adv.date,
        lastAdvanceAmount: adv.amount,
        lastAdvanceReason: adv.reason,
      }))
      .sort((a, b) => {
        return b.lastAdvanceDate.getTime() - a.lastAdvanceDate.getTime();
      });

    return result;
  }

  async getById(id: number) {
    const advance = await this.prisma.advance.findUnique({
      where: { id },
    });

    return advance;
  }
}
