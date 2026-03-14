import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Worker } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateService } from 'src/shared/date.service';
import { ActivateWorkerDto } from './dto/activate-worker.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { DisableWorkerDto } from './dto/disable-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    private prisma: PrismaService,
    private dateService: DateService,
  ) {}

  async findAll() {
    const workers = await this.prisma.worker.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const workersWithNetPayable = await Promise.all(
      workers.map(async (worker) => {
        const netPayable = await this.calculateNetPayable(worker.id, worker.joinedAt);
        return {
          ...worker,
          netPayable,
        };
      }),
    );

    return workersWithNetPayable;
  }

  private async calculateNetPayable(workerId: number, joinedAt: Date): Promise<number> {
    const lastSalary = await this.prisma.salary.findFirst({
      where: { workerId },
      orderBy: { cycleEnd: 'desc' },
    });

    const cycleStart = lastSalary ? new Date(lastSalary.cycleEnd.getTime() + 86400000) : joinedAt;

    const cycleEnd = this.dateService.startOfToday();

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

    let basePay = 0;
    let otPay = 0;

    for (const record of attendanceRecords) {
      if (record.status === 'PRESENT') {
        basePay += record.wageAtTime;
      } else if (record.status === 'HALF') {
        basePay += record.wageAtTime * 0.5;
      }
      const otUnits = record.otUnits ?? 0;
      otPay += otUnits * record.otRateAtTime;
    }

    const grossPay = basePay + otPay;

    const advanceResult = await this.prisma.advance.aggregate({
      _sum: { amount: true },
      where: {
        workerId,
        OR: [
          { date: { gte: cycleStart, lte: cycleEnd } },
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
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEnd },
      },
    });

    const totalAdvance = advanceResult._sum.amount ?? 0;
    const totalExpense = expenseResult._sum.amount ?? 0;


    const partialSalaries = await this.prisma.salary.findMany({
      where: {
        workerId,
        status: 'PARTIAL',
      },
      select: {
        netPay: true,
        totalPaid: true,
      },
    });

    const carryForwardBalance = partialSalaries.reduce(
      (sum, salary) => sum + (salary.netPay - salary.totalPaid),
      0,
    );

    // Include opening balance only for the first cycle (no salary history)
    let openingBalance = 0;
    if (!lastSalary) {
      const worker = await this.prisma.worker.findUnique({
        where: { id: workerId },
        select: { openingBalance: true },
      });
      openingBalance = worker?.openingBalance ?? 0;
    }

    return grossPay - totalAdvance - totalExpense + carryForwardBalance + openingBalance;
  }

  async findOne(id: number) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }
    return worker;
  }

  async create(data: CreateWorkerDto) {
    const { joinedAt, openingBalance, ...rest } = data;
    try {
      return await this.prisma.$transaction(async (tx) => {
        const worker = await tx.worker.create({
          data: {
            ...rest,
            openingBalance: openingBalance ?? 0,
            joinedAt: joinedAt
              ? joinedAt.includes('T')
                ? new Date(joinedAt)
                : new Date(`${joinedAt}T00:00:00Z`)
              : new Date(),
          },
        });

        await tx.wageHistory.create({
          data: {
            workerId: worker.id,
            wage: data.wage,
            otRate: data.otRate ?? 0,
            effectiveFrom: joinedAt
              ? joinedAt.includes('T')
                ? new Date(joinedAt)
                : new Date(`${joinedAt}T00:00:00Z`)
              : new Date(),
            reason: 'Initial wage',
          },
        });

        return worker;
      });
    } catch (error) {
       const fs = require('fs');
       fs.writeFileSync('backend_error.log', JSON.stringify({ message: error.message, stack: error.stack }, null, 2));
       throw error;
    }
  }

  async update(id: number, dto: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });
    if (!worker) throw new NotFoundException('Worker not found');

    console.log('📝 Worker update request:', {
      workerId: id,
      dto,
      currentWage: worker.wage,
      currentOtRate: worker.otRate,
    });

    const wageChanged = dto.wage !== undefined && dto.wage !== worker.wage;
    const otRateChanged = dto.otRate !== undefined && dto.otRate !== worker.otRate;

    console.log('📊 Change detection:', { wageChanged, otRateChanged });

    if (wageChanged || otRateChanged) {
      const wageEffectiveDate = dto.wageEffectiveDate
        ? this.dateService.parseDate(dto.wageEffectiveDate)
        : this.dateService.startOfToday();

      const otRateEffectiveDate = dto.otRateEffectiveDate
        ? this.dateService.parseDate(dto.otRateEffectiveDate)
        : this.dateService.startOfToday();

      console.log('📅 Effective dates:', {
        wageEffectiveDate: wageEffectiveDate.toISOString(),
        otRateEffectiveDate: otRateEffectiveDate.toISOString(),
      });

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
          const updateResult = await tx.attendance.updateMany({
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
          console.log('✅ Updated attendance wageAtTime:', {
            count: updateResult.count,
            newWage: dto.wage,
            fromDate: wageEffectiveDate.toISOString(),
          });
        }

        if (otRateChanged) {
          const updateResult = await tx.attendance.updateMany({
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

    // Validate openingBalance change - only allowed before first salary
    if (dto.openingBalance !== undefined) {
      const hasSalary = await this.prisma.salary.findFirst({
        where: { workerId: id },
      });
      if (hasSalary) {
        throw new BadRequestException(
          'Cannot change opening balance after a salary has been paid.',
        );
      }
    }

    return this.prisma.worker.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.wage !== undefined && { wage: dto.wage }),
        ...(dto.otRate !== undefined && { otRate: dto.otRate }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.openingBalance !== undefined && { openingBalance: dto.openingBalance }),
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

    // Check if worker is already inactive or has scheduled inactivation
    if (!worker.isActive) {
      throw new BadRequestException(
        `Worker is already inactive since ${worker.inactiveFrom?.toISOString().split('T')[0]}`,
      );
    }

    if (worker.inactiveFrom) {
      throw new BadRequestException(
        `Worker already has scheduled inactivation from ${worker.inactiveFrom.toISOString().split('T')[0]}`,
      );
    }

    const effectiveDate = new Date(`${dto.effectiveFrom}T00:00:00Z`);
    const today = this.dateService.startOfToday();

    const isFutureDate = effectiveDate > today;

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
      const updatedWorker = await tx.worker.update({
        where: { id },
        data: {
          isActive: isFutureDate ? true : false,
          inactiveFrom: effectiveDate,
        },
      });

      await tx.workerStatusHistory.create({
        data: {
          workerId: id,
          isActive: false,
          effectiveFrom: effectiveDate,
          reason: isFutureDate
            ? `Worker scheduled for inactivation on ${dto.effectiveFrom}`
            : 'Worker disabled by admin',
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

    const isCancellingScheduled = worker.isActive && worker.inactiveFrom !== null;

    if (worker.isActive && !worker.inactiveFrom) {
      throw new BadRequestException('Worker is already active');
    }

    const effectiveDate = new Date(`${dto.effectiveFrom}T00:00:00Z`);

    if (!isCancellingScheduled && worker.inactiveFrom && effectiveDate < worker.inactiveFrom) {
      throw new BadRequestException(
        `Activation date cannot be before the worker was disabled (${worker.inactiveFrom.toISOString().split('T')[0]})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWorker = await tx.worker.update({
        where: { id },
        data: {
          isActive: true,
          inactiveFrom: null,
        },
      });

      await tx.workerStatusHistory.create({
        data: {
          workerId: id,
          isActive: true,
          effectiveFrom: effectiveDate,
          reason: isCancellingScheduled
            ? 'Scheduled inactivation cancelled by admin'
            : 'Worker activated by admin',
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

  async getWeeklyReport(workerId: number, startDateStr?: string, endDateStr?: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${workerId} not found`);
    }

    let cycleStart: Date;
    let cycleEnd: Date;

    if (startDateStr && endDateStr) {
      cycleStart = new Date(startDateStr);
      cycleEnd = new Date(endDateStr);
    } else {
      const lastSalary = await this.prisma.salary.findFirst({
        where: { workerId },
        orderBy: { cycleEnd: 'desc' },
      });
      cycleStart = lastSalary ? new Date(lastSalary.cycleEnd.getTime() + 86400000) : worker.joinedAt;
      cycleEnd = this.dateService.startOfToday();
    }

    if (cycleStart > cycleEnd) {
      return [];
    }

    // Generate weeks
    let currentStart = new Date(cycleStart);
    // ensure time is 00:00:00 for consistency
    currentStart.setUTCHours(0, 0, 0, 0);

    const cycleEndUTCDay = new Date(cycleEnd);
    cycleEndUTCDay.setUTCHours(23, 59, 59, 999);

    const weeks: any[] = [];

    while (currentStart <= cycleEndUTCDay) {
      const dayOfWeek = currentStart.getUTCDay(); // 0 is Sunday, 6 is Saturday
      const daysUntilSaturday = 6 - dayOfWeek;
      
      const currentEnd = new Date(currentStart);
      currentEnd.setUTCDate(currentEnd.getUTCDate() + daysUntilSaturday);
      currentEnd.setUTCHours(23, 59, 59, 999);

      const effectiveEnd = currentEnd > cycleEndUTCDay ? new Date(cycleEndUTCDay) : currentEnd;

      weeks.push({
        startDate: new Date(currentStart),
        endDate: new Date(effectiveEnd),
        attendanceCount: 0,
        otUnits: 0,
        earning: 0,
        expenseFood: 0,
        expenseGeneral: 0,
        expenseOther: 0,
        expensesTotal: 0,
        netEarning: 0,
        attendances: [],
        expenses: []
      });

      currentStart = new Date(currentEnd);
      currentStart.setUTCDate(currentStart.getUTCDate() + 1);
      currentStart.setUTCHours(0, 0, 0, 0);
    }

    const attendances = await this.prisma.attendance.findMany({
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEndUTCDay }
      },
      orderBy: { date: 'asc' }
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        workerId,
        date: { gte: cycleStart, lte: cycleEndUTCDay }
      },
      include: { type: true },
      orderBy: { date: 'asc' }
    });

    for (const week of weeks) {
      const weekAttendances = attendances.filter(a => a.date >= week.startDate && a.date <= week.endDate);
      const weekExpenses = expenses.filter(e => e.date >= week.startDate && e.date <= week.endDate);
      
      let earning = 0;
      let otUnitsSum = 0;
      
      for (const a of weekAttendances) {
        let base = 0;
        if (a.status === 'PRESENT') base = a.wageAtTime;
        else if (a.status === 'HALF') base = a.wageAtTime * 0.5;
        
        const otPay = (a.otUnits || 0) * a.otRateAtTime;
        earning += base + otPay;
        otUnitsSum += (a.otUnits || 0);
      }
      
      let expenseFood = 0;
      let expenseGeneral = 0;
      let expenseOther = 0;
      
      for (const e of weekExpenses) {
        if (e.type.name === 'Food') {
          expenseFood += e.amount;
        } else if (e.type.name === 'Expenses') {
          expenseGeneral += e.amount;
        } else {
          expenseOther += e.amount;
        }
      }

      week.attendanceCount = weekAttendances.reduce((acc, a) => acc + (a.status === 'PRESENT' ? 1 : a.status === 'HALF' ? 0.5 : 0), 0);
      week.otUnits = otUnitsSum;
      week.earning = earning;
      week.expensesTotal = expenseGeneral + expenseFood;
      week.expenseFood = expenseFood;
      week.expenseGeneral = expenseGeneral;
      week.netEarning = earning - week.expensesTotal;

      week.attendances = weekAttendances.map(a => ({
        date: a.date.toISOString().split('T')[0],
        status: a.status,
        otUnits: a.otUnits
      }));
      week.expenses = weekExpenses.map(e => ({
        date: e.date.toISOString().split('T')[0],
        amount: e.amount,
        note: e.note,
        type: e.type.name
      }));
    }

    return weeks.map(w => ({
      startDate: w.startDate.toISOString().split('T')[0],
      endDate: w.endDate.toISOString().split('T')[0],
      attendanceCount: w.attendanceCount,
      otUnits: w.otUnits,
      earning: w.earning,
      expenseFood: w.expenseFood,
      expenseGeneral: w.expenseGeneral,
      expensesTotal: w.expensesTotal,
      netEarning: w.netEarning,
      attendances: w.attendances,
      expenses: w.expenses
    }));
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
