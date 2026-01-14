import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Worker } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
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

    return this.prisma.worker.update({
      where: { id },
      data: {
        isActive: false,
        inactiveFrom: effectiveDate,
      },
    });
  }

  async activateWorker(id: number): Promise<Worker> {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    if (worker.isActive) {
      throw new BadRequestException('Worker is already active');
    }

    return this.prisma.worker.update({
      where: { id },
      data: {
        isActive: true,
        inactiveFrom: null,
      },
    });
  }
}
