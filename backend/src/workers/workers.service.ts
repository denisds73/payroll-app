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

  async update(id: number, updateWorkerDto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if wage or OT rate is changing
      const wageChanged =
        updateWorkerDto.wage !== undefined && updateWorkerDto.wage !== worker.wage;

      const otRateChanged =
        updateWorkerDto.otRate !== undefined && updateWorkerDto.otRate !== worker.otRate;

      // If wage/OT rate changed, create wage history record
      if (wageChanged || otRateChanged) {
        await tx.wageHistory.create({
          data: {
            workerId: id,
            wage: updateWorkerDto.wage ?? worker.wage,
            otRate: updateWorkerDto.otRate ?? worker.otRate,
            effectiveFrom: new Date(),
            reason: 'Wage adjustment',
          },
        });
      }

      // Extract and convert joinedAt date
      const { joinedAt, ...rest } = updateWorkerDto;

      // Update worker with converted date
      return tx.worker.update({
        where: { id },
        data: {
          ...rest,
          ...(joinedAt && { joinedAt: new Date(`${joinedAt}T00:00:00Z`) }),
        },
      });
    });
  }

  async remove(id: number) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return this.prisma.worker.delete({ where: { id } });
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
