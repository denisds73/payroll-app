import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SalaryLockService {
  constructor(private prisma: PrismaService) {}

  async isLocked(workerId: number, date: Date): Promise<boolean> {
    const lockedSalary = await this.prisma.salary.findFirst({
      where: {
        workerId,
        status: { in: ['PAID', 'PARTIAL'] },
        cycleStart: { lte: date },
        cycleEnd: { gt: date },
      },
    });

    return !!lockedSalary;
  }

  async assertNotLocked(workerId: number, date: Date, context?: string) {
    const locked = await this.isLocked(workerId, date);
    if (locked) {
      const label = context ? `${context} ` : '';
      throw new BadRequestException(
        `Cannot modify or delete ${label}record in a finalized (Paid or Partial) salary cycle`,
      );
    }
  }
}
