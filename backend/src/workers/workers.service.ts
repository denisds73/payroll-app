import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Worker } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivateWorkerDto } from './dto/activate-worker.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { DisableWorkerDto } from './dto/disable-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.worker.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async create(data: CreateWorkerDto) {
    const { joinedAt, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      const worker = await tx.worker.create({
        data: {
          ...rest,
          joinedAt: joinedAt ? new Date(`${joinedAt}T00:00:00Z`) : new Date(),
        },
      });

      await tx.wageHistory.create({
        data: {
          workerId: worker.id,
          wage: data.wage,
          otRate: data.otRate ?? 0,
          effectiveFrom: joinedAt ? new Date(`${joinedAt}T00:00:00Z`) : new Date(),
          reason: 'Initial wage',
        },
      });

      return worker;
    });
  }

  async update(id: number, dto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) throw new NotFoundException('Worker not found');

    const wageChanged = dto.wage !== undefined && dto.wage !== worker.wage;
    const otRateChanged = dto.otRate !== undefined && dto.otRate !== worker.otRate;

    if (wageChanged || otRateChanged) {
      const wageEffectiveDate = dto.wageEffectiveDate
        ? new Date(dto.wageEffectiveDate)
        : new Date();

      const otRateEffectiveDate = dto.otRateEffectiveDate
        ? new Date(dto.otRateEffectiveDate)
        : new Date();

      const earliestEffectiveDate =
        wageChanged && otRateChanged
          ? wageEffectiveDate < otRateEffectiveDate
            ? wageEffectiveDate
            : otRateEffectiveDate
          : wageChanged
            ? wageEffectiveDate
            : otRateEffectiveDate;

      const paidSalaries = await this.prisma.salary.findFirst({
        where: {
          workerId: id,
          cycleStart: {
            lte: earliestEffectiveDate,
          },
          cycleEnd: {
            gte: earliestEffectiveDate,
          },
        },
      });

      if (paidSalaries) {
        throw new BadRequestException(
          'Cannot change wage/OT rate for a period with paid salary. ' +
            'The effective date must be after the last paid salary cycle.',
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.wageHistory.create({
          data: {
            workerId: id,
            wage: dto.wage ?? worker.wage,
            otRate: dto.otRate ?? worker.otRate,
            effectiveFrom: earliestEffectiveDate,
            reason: 'Manual update',
          },
        });

        if (wageChanged) {
          await tx.attendance.updateMany({
            where: {
              workerId: id,
              date: {
                gte: wageEffectiveDate,
              },
            },
            data: {
              wageAtTime: dto.wage,
            },
          });
        }

        if (otRateChanged) {
          await tx.attendance.updateMany({
            where: {
              workerId: id,
              date: {
                gte: otRateEffectiveDate,
              },
            },
            data: {
              otRateAtTime: dto.otRate,
            },
          });
        }

        await tx.worker.update({
          where: { id },
          data: {
            ...(dto.name && { name: dto.name }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.wage !== undefined && { wage: dto.wage }),
            ...(dto.otRate !== undefined && { otRate: dto.otRate }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          },
        });
      });

      return this.prisma.worker.findUnique({ where: { id } });
    }

    return this.prisma.worker.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.wage !== undefined && { wage: dto.wage }),
        ...(dto.otRate !== undefined && { otRate: dto.otRate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: number) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.attendance.deleteMany({ where: { workerId: id } });
      await tx.advance.deleteMany({ where: { workerId: id } });
      await tx.expense.deleteMany({ where: { workerId: id } });
      await tx.salary.deleteMany({ where: { workerId: id } });
      await tx.wageHistory.deleteMany({ where: { workerId: id } });
      await tx.workerStatusHistory.deleteMany({ where: { workerId: id } });
      await tx.worker.delete({ where: { id } });
    });

    return {
      message: 'Worker and all related records deleted successfully',
      worker,
    };
  }

  async getWageAtDate(workerId: number, date: Date) {
    const wageHistory = await this.prisma.wageHistory.findFirst({
      where: {
        workerId,
        effectiveFrom: {
          lte: date,
        },
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (!wageHistory) {
      throw new BadRequestException(
        `No wage history found for worker ${workerId} on date ${date.toISOString()}`,
      );
    }

    return {
      wage: wageHistory.wage,
      otRate: wageHistory.otRate,
    };
  }

  async updateCurrentWage(id: number, wage: number, otRate: number, effectiveDate?: string | Date) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    const effectiveFrom = effectiveDate
      ? new Date(typeof effectiveDate === 'string' ? `${effectiveDate}T00:00:00Z` : effectiveDate)
      : new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.wageHistory.create({
        data: {
          workerId: id,
          wage,
          otRate,
          effectiveFrom,
          reason: 'Manual wage adjustment',
        },
      });

      return tx.worker.update({
        where: { id },
        data: { wage, otRate },
      });
    });
  }

  async getWorkerWithWageHistory(id: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        wageHistory: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    return worker;
  }

  async findAllWithCurrentWage() {
    return this.prisma.worker.findMany({
      include: {
        wageHistory: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async disableWorker(id: number, dto: DisableWorkerDto): Promise<Worker> {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    if (!worker.isActive) {
      throw new BadRequestException(
        `Worker is already inactive since ${worker.inactiveFrom?.toISOString().split('T')[0]}`,
      );
    }

    const effectiveDate = new Date(`${dto.effectiveFrom}T00:00:00Z`);

    if (effectiveDate < worker.joinedAt) {
      throw new BadRequestException(
        `Cannot disable worker before their join date (${worker.joinedAt.toISOString().split('T')[0]})`,
      );
    }

    const attendanceOnDate = await this.prisma.attendance.findFirst({
      where: {
        workerId: id,
        date: effectiveDate,
      },
    });

    if (attendanceOnDate) {
      throw new BadRequestException(
        `Cannot disable worker on ${dto.effectiveFrom} - attendance record exists. Please choose a different date.`,
      );
    }

    const expenseOnDate = await this.prisma.expense.findFirst({
      where: {
        workerId: id,
        date: effectiveDate,
      },
    });

    if (expenseOnDate) {
      throw new BadRequestException(
        `Cannot disable worker on ${dto.effectiveFrom} - expense record exists. Please choose a different date.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Update worker status
      const updatedWorker = await tx.worker.update({
        where: { id },
        data: {
          isActive: false,
          inactiveFrom: effectiveDate,
        },
      });

      // Create status history record
      await tx.workerStatusHistory.create({
        data: {
          workerId: id,
          isActive: false,
          effectiveFrom: effectiveDate,
          reason: 'Worker disabled by admin',
        },
      });

      return updatedWorker;
    });
  }

  async activateWorker(id: number, dto: ActivateWorkerDto): Promise<Worker> {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    if (worker.isActive) {
      throw new BadRequestException('Worker is already active');
    }

    const effectiveDate = new Date(`${dto.effectiveFrom}T00:00:00Z`);

    if (worker.inactiveFrom && effectiveDate < worker.inactiveFrom) {
      throw new BadRequestException(
        `Activation date cannot be before the worker was disabled (${worker.inactiveFrom.toISOString().split('T')[0]})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Update worker status
      const updatedWorker = await tx.worker.update({
        where: { id },
        data: {
          isActive: true,
          inactiveFrom: null,
        },
      });

      // Create status history record
      await tx.workerStatusHistory.create({
        data: {
          workerId: id,
          isActive: true,
          effectiveFrom: effectiveDate,
          reason: 'Worker activated by admin',
        },
      });

      return updatedWorker;
    });
  }

  async getBlockedDates(id: number): Promise<{ blockedDates: string[] }> {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    const attendanceDates = await this.prisma.attendance.findMany({
      where: { workerId: id },
      select: { date: true },
    });

    const expenseDates = await this.prisma.expense.findMany({
      where: { workerId: id },
      select: { date: true },
    });

    const paidSalaries = await this.prisma.salary.findMany({
      where: {
        workerId: id,
        status: { in: ['PAID', 'PARTIAL'] },
      },
      select: { cycleStart: true, cycleEnd: true },
    });

    const blockedDatesSet = new Set<string>();

    attendanceDates.forEach((record) => {
      blockedDatesSet.add(record.date.toISOString().split('T')[0]);
    });

    expenseDates.forEach((record) => {
      blockedDatesSet.add(record.date.toISOString().split('T')[0]);
    });

    paidSalaries.forEach((salary) => {
      const start = new Date(salary.cycleStart);
      const end = new Date(salary.cycleEnd);
      const current = new Date(start);

      while (current <= end) {
        blockedDatesSet.add(current.toISOString().split('T')[0]);
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });

    const blockedDates = Array.from(blockedDatesSet).sort();

    return { blockedDates };
  }

  async getInactivePeriods(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        isActive: true,
        inactiveFrom: true,
      },
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    const statusHistory = await this.prisma.workerStatusHistory.findMany({
      where: { workerId },
      orderBy: { effectiveFrom: 'asc' },
    });

    const periods: Array<{ startDate: string; endDate: string; reason: string }> = [];
    let inactivePeriodStart: Date | null = null;

    for (const record of statusHistory) {
      if (!record.isActive) {
        inactivePeriodStart = record.effectiveFrom;
      } else if (inactivePeriodStart) {
        const endDate = new Date(record.effectiveFrom.getTime() - 86400000);
        periods.push({
          startDate: inactivePeriodStart.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          reason: 'Worker was inactive during this period',
        });
        inactivePeriodStart = null;
      }
    }

    if (!worker.isActive && worker.inactiveFrom) {
      periods.push({
        startDate: worker.inactiveFrom.toISOString().split('T')[0],
        endDate: '9999-12-31',
        reason: 'Worker is currently inactive',
      });
    }

    return {
      workerId: worker.id,
      workerName: worker.name,
      isActive: worker.isActive,
      periods,
      count: periods.length,
    };
  }
}
