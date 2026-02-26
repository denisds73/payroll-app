import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  
  async getPaidPeriods(workerId: number) {

    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
      select: { id: true, name: true }, 
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }


    const paidSalaries = await this.prisma.salary.findMany({
      where: {
        workerId,
        status: {
          in: [SalaryStatus.PAID, SalaryStatus.PARTIAL],
        },
      },
      select: {
        id: true,
        cycleStart: true,
        cycleEnd: true,
        status: true,
        totalPaid: true,
        netPay: true,
      },
      orderBy: {
        cycleStart: 'desc', 
      },
    });


    const periods = paidSalaries.map((salary) => ({
      id: salary.id,
      startDate: salary.cycleStart.toISOString().split('T')[0],
      endDate: salary.cycleEnd.toISOString().split('T')[0], 
      isPaid: true,
      isPartial: salary.status === SalaryStatus.PARTIAL,
      paidAmount: salary.totalPaid,
      remainingAmount: salary.netPay - salary.totalPaid,
    }));

    return {
      workerId,
      workerName: worker.name,
      periods,
      count: periods.length,
    };
  }

  private async calculateBreakdown(
    workerId: number,
    payDate?: Date,
    throwOnInvalidDate = true,
  ) {
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

    const cycleEnd = payDate || this.dateService.startOfToday();

    // Calculate unlinked advances first to support same-day post-salary display
    const advanceResult = await this.prisma.advance.aggregate({
      _sum: { amount: true },
      where: {
        workerId,
        salaryId: null,
        date: { lte: this.dateService.endOfDay(cycleEnd) },
      },
    });
    const totalAdvance = advanceResult?._sum?.amount ?? 0;

    let unpaidBalance = await this.getUnpaidBalance(workerId);
    let openingBalance = !lastSalary ? (worker.openingBalance ?? 0) : 0;

    if (cycleEnd < cycleStart) {
      if (throwOnInvalidDate) {
        throw new BadRequestException(
          `Pay date cannot be before cycle start date (${cycleStart.toISOString().split('T')[0]})`,
        );
      }

      // Even if cycle hasn't started, unlinked advances are valid debts
      return {
        cycleStart,
        cycleEnd,
        totalDays: 0,
        totalOtUnits: 0,
        basePay: 0,
        otPay: 0,
        grossPay: 0,
        totalAdvance,
        totalExpense: 0,
        unpaidBalance,
        openingBalance,
        netPay: -totalAdvance + openingBalance,
      };
    }

    console.log('Cycle calculation:', {
      workerId,
      cycleStart,
      cycleEnd,
      isRetroactive: !!payDate,
    });

    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEnd },
      },
      select: {
        status: true,
        otUnits: true,
        wageAtTime: true,
        otRateAtTime: true,
      },
    });

    console.log('Found attendance records:', attendanceRecords.length);

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

    const expenseResult = await this.prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEnd },
      },
    });

    const totalExpense = expenseResult._sum.amount ?? 0;

    // Include opening balance only for the first cycle (no salary history)
    openingBalance = !lastSalary ? (worker.openingBalance ?? 0) : 0;

    const netPay = grossPay - totalAdvance - totalExpense + openingBalance;

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
      unpaidBalance,
      openingBalance,
      netPay,
    };
  }

  async calculateSalary(workerId: number, payDate?: string) {
    const parsedDate = payDate ? this.dateService.parseDate(payDate) : undefined;
    const breakdown = await this.calculateBreakdown(workerId, parsedDate, false);
    const carryForward = await this.getUnpaidBalance(workerId);

    return {
      ...breakdown,
      carryForward, // Unpaid from previous PARTIAL salaries
      totalNetPayable: breakdown.netPay + carryForward, // Combined amount
    };
  }

  async createSalary(workerId: number, payDate?: string) {
    const parsedDate = payDate ? this.dateService.parseDate(payDate) : undefined;
    const breakdown = await this.calculateBreakdown(workerId, parsedDate);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Identify all unlinked advances up to this cycle end
      // We do this BEFORE potentially creating a shortfall auto-advance
      const unlinkedAdvances = await tx.advance.findMany({
        where: {
          workerId,
          salaryId: null,
          date: { lte: this.dateService.endOfDay(breakdown.cycleEnd) },
        },
        select: { id: true },
      });
      const unlinkedIds = unlinkedAdvances.map((a) => a.id);

      // 2. Handle shortfall if net pay is negative
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

      // 3. Create the salary record
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
          unpaidBalance: breakdown.unpaidBalance || 0,
        },
      });

      // 4. Link the the advances that were included in the breakdown
      if (unlinkedIds.length > 0) {
        await tx.advance.updateMany({
          where: {
            id: { in: unlinkedIds },
          },
          data: {
            salaryId: salary.id,
          },
        });
      }

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
        payments: {
            orderBy: { date: 'desc' }
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

  private async getUnpaidBalance(workerId: number): Promise<number> {
    const partialSalaries = await this.prisma.salary.findMany({
      where: {
        workerId,
        status: {
          in: [SalaryStatus.PENDING, SalaryStatus.PARTIAL],
        },
      },
      select: {
        netPay: true,
        totalPaid: true,
      },
    });

    const unpaidBalance = partialSalaries.reduce(
      (sum, salary) => sum + (salary.netPay - salary.totalPaid),
      0,
    );

    return unpaidBalance;
  }

  async getPendingPartialSalaries(workerId: number) {
    return this.prisma.salary.findMany({
      where: {
        workerId,
        status: {
          in: [SalaryStatus.PENDING, SalaryStatus.PARTIAL],
        },
      },
      select: {
        id: true,
        cycleStart: true,
        cycleEnd: true,
        netPay: true,
        totalPaid: true,
      },
      orderBy: { cycleEnd: 'asc' },
    });
  }

  async issueSalary(salaryId: number, amount: number, paymentProof?: string, signature?: string) {
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
          signature: signature || null,
        },
        include: { payments: true }
      });
      
      await tx.salaryPayment.create({
          data: {
              salaryId: salaryId,
              amount: amount,
              date: new Date(),
              proof: paymentProof
          }
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
    const cycleEnd = this.dateService.startOfToday();

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

  async findOne(id: number) {
  const salary = await this.prisma.salary.findUnique({
    where: { id },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          phone: true,
          wage: true,
          otRate: true,
          joinedAt: true,
          isActive: true,
        },
      },
      payments: {
          orderBy: { date: 'desc' }
      },
    },
  });

  if (!salary) {
    throw new NotFoundException(`Salary with ID ${id} not found`);
  }

  return salary;
}
}
