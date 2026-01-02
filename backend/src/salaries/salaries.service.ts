import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, SalaryStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateService } from '../shared/date.service';
import { FilterSalariesDto } from './dto/filter-salaries.dto';

@Injectable()
export class SalariesService {
  constructor(
    private prisma: PrismaService,
    private dateService: DateService,
  ) {}

  // NEW: Pure calculation function (no database writes)
  private async calculateBreakdown(workerId: number) {
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
    const cycleEnd = this.dateService.startOfToday();

    console.log('Cycle calculation:', { workerId, cycleStart, cycleEnd });

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { workerId, date: { gte: cycleStart, lte: cycleEnd } },
      select: {
        status: true,
        otUnits: true,
        wageAtTime: true,
        otRateAtTime: true,
      },
    });

    console.log('Found attendance records:', attendanceRecords.length);

    if (attendanceRecords.length === 0)
      throw new BadRequestException('No attendance found for this period');

    // Calculate pay
    let basePay = 0;
    let otPay = 0;
    let totalDays = 0;
    let totalOtUnits = 0;

    for (const record of attendanceRecords) {
      if (record.status === 'PRESENT') {
        basePay += record.wageAtTime;
        totalDays += 1;
      } else if (record.status === 'HALF') {
        basePay += record.wageAtTime * 0.5;
        totalDays += 0.5;
      }

      const otUnits = record.otUnits ?? 0;
      otPay += otUnits * record.otRateAtTime;
      totalOtUnits += otUnits;
    }

    const grossPay = basePay + otPay;

    // Calculate deductions
    const advanceResult = await this.prisma.advance.aggregate({
      _sum: { amount: true },
      where: {
        workerId,
        OR: [
          { date: { gte: cycleStart, lte: cycleEnd } },
          {
            AND: [
              { date: lastSalary ? lastSalary.cycleEnd : cycleStart },
              {
                reason: {
                  startsWith: 'Auto advance: salary shortfall',
                },
              },
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

    return {
      cycleStart,
      cycleEnd,
      totalDays,
      totalOtUnits,
      basePay,
      otPay,
      grossPay,
      totalAdvance,
      totalExpense,
      netPay,
    };
  }

  // Calculate salary (NO database writes - just preview)
  async calculateSalary(workerId: number) {
    return this.calculateBreakdown(workerId);
  }

  // Create salary (writes to database)
  async createSalary(workerId: number) {
    const breakdown = await this.calculateBreakdown(workerId);

    // Now create the salary record
    const result = await this.prisma.$transaction(async (tx) => {
      // If net pay is negative, create auto-advance
      if (breakdown.netPay < 0) {
        const shortfall = Math.abs(breakdown.netPay);

        await tx.advance.create({
          data: {
            workerId,
            date: breakdown.cycleEnd,
            amount: shortfall,
            reason: `Auto advance: salary shortfall for cycle ${
              breakdown.cycleStart.toISOString().split('T')[0]
            } to ${breakdown.cycleEnd.toISOString().split('T')[0]}`,
          },
        });
      }

      const salaryNet = breakdown.netPay < 0 ? 0 : breakdown.netPay;

      const salary = await tx.salary.create({
        data: {
          workerId,
          cycleStart: breakdown.cycleStart,
          cycleEnd: breakdown.cycleEnd,
          basePay: breakdown.basePay,
          otPay: breakdown.otPay,
          grossPay: breakdown.grossPay,
          totalAdvance: breakdown.totalAdvance,
          totalExpense: breakdown.totalExpense,
          netPay: salaryNet,
          totalPaid: 0,
          status: SalaryStatus.PENDING,
        },
      });

      return salary;
    });

    return result;
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

  async debugSalary(workerId: number) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
    });

    const lastSalary = await this.prisma.salary.findFirst({
      where: { workerId },
      orderBy: { cycleEnd: 'desc' },
    });

    const cycleStart = lastSalary
      ? new Date(lastSalary.cycleEnd.getTime() + 86400000)
      : worker?.joinedAt;
    const cycleEnd = new Date();

    const allAttendance = await this.prisma.attendance.findMany({
      where: { workerId },
      select: { date: true, status: true },
    });

    const filteredAttendance = await this.prisma.attendance.findMany({
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEnd },
      },
      select: { date: true, status: true },
    });

    return {
      workerId,
      workerJoinedAt: worker?.joinedAt,
      lastSalary: lastSalary || 'None',
      cycleStart: cycleStart,
      cycleEnd: cycleEnd,
      cycleStartISO: cycleStart?.toISOString(),
      cycleEndISO: cycleEnd.toISOString(),
      allAttendanceCount: allAttendance.length,
      allAttendanceDates: allAttendance.map((a) => a.date.toISOString()),
      filteredAttendanceCount: filteredAttendance.length,
      filteredAttendanceDates: filteredAttendance.map((a) => a.date.toISOString()),
    };
  }
}
