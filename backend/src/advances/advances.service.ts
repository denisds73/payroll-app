import { BadRequestException, Injectable } from '@nestjs/common';
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

    const advanceDate = new Date(`${dto.date}T00:00:00`);
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
}
