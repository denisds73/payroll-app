import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateService } from 'src/shared/date.service';
import { SalaryLockService } from 'src/shared/salary-lock.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { FilterExpensesDto } from './dto/filter-expenses.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private salaryLock: SalaryLockService,
    private dateService: DateService,
  ) {}

  async create(dto: CreateExpenseDto) {
    const { workerId, amount, typeId, note, date } = dto;

    const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });

    if (!worker) throw new NotFoundException('Worker not found');
    if (!worker.isActive) throw new BadRequestException('Cannot add expense for inactive worker');

    const expenseDate = this.dateService.parseDate(date);

    // Check if worker has scheduled inactivation and the expense date falls on or after that date
    if (worker.inactiveFrom && expenseDate >= worker.inactiveFrom) {
      throw new BadRequestException(
        `Cannot add expense on or after worker's scheduled inactivation date (${worker.inactiveFrom.toISOString().split('T')[0]})`,
      );
    }

    if (expenseDate > this.dateService.startOfToday()) {
      throw new BadRequestException('Expense date cannot be in the future');
    }

    const type = await this.prisma.expenseType.findUnique({ where: { id: typeId } });

    if (!type) throw new NotFoundException('Expense type not found');

    const expense = await this.prisma.expense.create({
      data: {
        workerId,
        amount,
        date: expenseDate,
        note: note,
        typeId,
      },
      include: {
        worker: true,
        type: true,
      },
    });
    return expense;
  }

  async findAll(params?: FilterExpensesDto) {
    const { workerId, month, startDate, endDate } = params || {};

    const where: Prisma.ExpenseWhereInput = {};

    if (workerId) where.workerId = workerId;

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = this.dateService.startOfMonth(year, monthPart);
      const end = this.dateService.startOfMonth(year, monthPart + 1);
      where.date = { gte: start, lt: end };
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = this.dateService.parseDate(startDate);
      }
      if (endDate) {
        const end = this.dateService.parseDate(endDate);
        end.setDate(end.getDate() + 1);
        where.date.lt = end;
      }
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        worker: true,
        type: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return expenses;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.salaryLock.assertNotLocked(expense.workerId, expense.date, 'expense');

    if (dto.date) {
      const newDate = this.dateService.parseDate(dto.date);
      if (newDate > this.dateService.startOfToday()) {
        throw new BadRequestException('Expense date cannot be in the future');
      }
    }

    if (dto.typeId) {
      // ✅ Fixed: Check expenseType table instead of expense table
      const type = await this.prisma.expenseType.findUnique({ where: { id: dto.typeId } });
      if (!type) throw new NotFoundException('Expense type not found');
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount ?? expense.amount,
        note: dto.note ?? expense.note,
        typeId: dto.typeId ?? expense.typeId,
        date: dto.date ? this.dateService.parseDate(dto.date) : expense.date,
      },
      include: {
        worker: true,
        type: true,
      },
    });

    return updatedExpense;
  }

  async remove(id: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    await this.salaryLock.assertNotLocked(expense.workerId, expense.date, 'expense');

    const deletedExpense = await this.prisma.expense.delete({
      where: { id },
      include: {
        worker: true,
        type: true,
      },
    });

    return {
      message: 'Expense deleted successfully',
      expense: deletedExpense,
    };
  }
}
