import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, SalaryStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterSalariesDto } from './dto/filter-salaries.dto';

@Injectable()
export class SalariesService {
  constructor(private prisma: PrismaService) {}

  private async calculateSalaryData(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker) throw new BadRequestException('Worker not found');

    const lastSalary = await this.prisma.salary.findFirst({
      where: { workerId },
      orderBy: { cycleEnd: 'desc' },
    });

    const cycleStart = lastSalary
      ? new Date(lastSalary.cycleEnd.getTime() + 86400000)
      : worker.joinedAt;
    const cycleEnd = new Date();

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { workerId, date: { gte: cycleStart, lte: cycleEnd } },
    });

    if (attendanceRecords.length === 0)
      throw new BadRequestException('No attendance found for this period');

    let totalDays = 0;
    let totalOtUnits = 0;

    for (const record of attendanceRecords) {
      if (record.status === 'PRESENT') totalDays += 1;
      if (record.status === 'HALF') totalDays += 0.5;
      totalOtUnits += record.otUnits ?? 0;
    }

    const basePay = totalDays * worker.wage;
    const otPay = totalOtUnits * worker.otRate;
    const grossPay = basePay + otPay;

    // Get advances including any shortfall advance from previous cycle
    const advanceResult = await this.prisma.advance.aggregate({
      _sum: { amount: true },
      where: {
        workerId,
        OR: [
          // Regular advances within the cycle
          { date: { gte: cycleStart, lte: cycleEnd } },
          // Shortfall advance from previous cycle end
          {
            AND: [
              { date: lastSalary ? lastSalary.cycleEnd : cycleStart },
              { reason: { startsWith: 'Auto advance: salary shortfall' } },
            ],
          },
        ],
      },
    });

    const expenseResult = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: { workerId, date: { gte: cycleStart, lte: cycleEnd } },
    });

    const totalAdvance = advanceResult._sum.amount ?? 0;
    const totalExpense = expenseResult._sum.amount ?? 0;

    const netPay = grossPay - totalAdvance - totalExpense;

    const result = await this.prisma.$transaction(async (tx) => {
      if (netPay < 0) {
        const shortfall = Math.abs(netPay);

        await tx.advance.create({
          data: {
            workerId,
            date: cycleEnd,
            amount: shortfall,
            reason: `Auto advance: salary shortfall for cycle ${cycleStart.toISOString().split('T')[0]} to ${cycleEnd.toISOString().split('T')[0]}`,
          },
        });
      }

      const salaryNet = netPay < 0 ? 0 : netPay;

      const salary = await tx.salary.create({
        data: {
          workerId,
          cycleStart,
          cycleEnd,
          basePay,
          otPay,
          grossPay,
          totalAdvance,
          totalExpense,
          netPay: salaryNet,
          totalPaid: 0,
          status: SalaryStatus.PENDING,
        },
      });

      return {
        salary,
        breakdown: {
          totalDays,
          totalOtUnits,
          basePay,
          otPay,
          grossPay,
          totalAdvance,
          totalExpense,
          netPay,
        },
      };
    });

    return result;
  }

  async calculateSalary(workerId: number) {
    const result = await this.calculateSalaryData(workerId);
    return result.breakdown;
  }

  async createSalary(workerId: number) {
    const result = await this.calculateSalaryData(workerId);
    return result.salary;
  }

  async getWorkerSalaries(workerId: number, filter: FilterSalariesDto = {}) {
    const where: Prisma.SalaryWhereInput = { workerId };

    if (filter.startDate) {
      where.cycleStart = { gte: new Date(filter.startDate) };
    }

    if (filter.endDate) {
      where.cycleEnd = { lte: new Date(filter.endDate) };
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const salaries = await this.prisma.salary.findMany({
      where,
      orderBy: { cycleEnd: 'desc' },
      include: {
        worker: {
          select: {
            name: true,
            wage: true,
            otRate: true,
          },
        },
      },
    });

    return salaries;
  }

  async getPendingSalaries() {
    return this.prisma.salary.findMany({
      where: {
        status: {
          in: [SalaryStatus.PENDING, SalaryStatus.PARTIAL],
        },
      },
      include: {
        worker: {
          select: {
            name: true,
            wage: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { cycleEnd: 'desc' }],
    });
  }

  async issueSalary(salaryId: number, amount: number, paymentProof?: string) {
    const salary = await this.prisma.salary.findUnique({
      where: { id: salaryId },
      include: { worker: true },
    });

    if (!salary) {
      throw new BadRequestException('Salary record not found');
    }

    if (salary.status === SalaryStatus.PAID) {
      throw new BadRequestException('Salary is already fully paid');
    }

    const remainingAmount = salary.netPay - salary.totalPaid;
    if (amount > remainingAmount) {
      throw new BadRequestException(`Cannot pay more than remaining amount: ${remainingAmount}`);
    }

    const newTotalPaid = salary.totalPaid + amount;
    const newStatus = newTotalPaid === salary.netPay ? SalaryStatus.PAID : SalaryStatus.PARTIAL;

    // Update salary and worker balance in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedSalary = await tx.salary.update({
        where: { id: salaryId },
        data: {
          totalPaid: newTotalPaid,
          status: newStatus,
          issuedAt: new Date(),
          paymentProof: paymentProof || null,
        },
      });

      // Update worker balance
      await tx.worker.update({
        where: { id: salary.workerId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      return updatedSalary;
    });

    return result;
  }
}
