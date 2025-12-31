import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
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
      // Create worker
      const worker = await tx.worker.create({
        data: {
          ...rest,
          joinedAt: joinedAt ? new Date(`${joinedAt}T00:00:00Z`) : new Date(),
        },
      });

      // Create initial wage history
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

      // Check if any salaries have been paid that include the effective date
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
        // 1. Create wage history record
        await tx.wageHistory.create({
          data: {
            workerId: id,
            wage: dto.wage ?? worker.wage,
            otRate: dto.otRate ?? worker.otRate,
            effectiveFrom: earliestEffectiveDate,
            reason: 'Manual update',
          },
        });

        // 2. Update attendance records from wage effective date onwards
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

        // 3. Update attendance records from OT rate effective date onwards
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

        // 4. Update the worker record
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

    // If no wage/OT rate change, simple update
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

    // Delete all related records in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete attendance records
      await tx.attendance.deleteMany({ where: { workerId: id } });

      // Delete advances
      await tx.advance.deleteMany({ where: { workerId: id } });

      // Delete expenses
      await tx.expense.deleteMany({ where: { workerId: id } });

      // Delete salaries
      await tx.salary.deleteMany({ where: { workerId: id } });

      // Delete wage history (if exists)
      await tx.wageHistory.deleteMany({ where: { workerId: id } });

      // Finally delete the worker
      await tx.worker.delete({ where: { id } });
    });

    return {
      message: 'Worker and all related records deleted successfully',
      worker,
    };
  }

  // Helper method to get wage that was active on a specific date
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

  // Manual wage update with specific effective date (for admin use)
  async updateCurrentWage(id: number, wage: number, otRate: number, effectiveDate?: string | Date) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    const effectiveFrom = effectiveDate
      ? new Date(typeof effectiveDate === 'string' ? `${effectiveDate}T00:00:00Z` : effectiveDate)
      : new Date();

    return this.prisma.$transaction(async (tx) => {
      // Add wage history entry
      await tx.wageHistory.create({
        data: {
          workerId: id,
          wage,
          otRate,
          effectiveFrom,
          reason: 'Manual wage adjustment',
        },
      });

      // Update worker's current wage
      return tx.worker.update({
        where: { id },
        data: { wage, otRate },
      });
    });
  }

  // Get worker with complete wage history
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

  // Get all workers with their latest wage
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
}
