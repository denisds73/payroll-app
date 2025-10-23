import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SalaryLockService } from 'src/shared/salary-lock.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private salaryLock: SalaryLockService,
  ) {}

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async create(dto: CreateExpenseDto) {
    const { workerId, amount, typeId, note, date } = dto;

    const worker = await this.prisma.worker.findUnique({ where: { id: workerId } });

    if (!worker) throw new NotFoundException('Worker not found');
    if (!worker.isActive) throw new BadRequestException('Cannot add expense for inactive worker');

    const expenseDate = new Date(`${date}T00:00:00Z`);
    if (expenseDate > this.startOfToday()) {
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

  async findAll(params?: {
    workerId?: number;
    month?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { workerId, month, startDate, endDate } = params || {};

    const where: any = {};

    if (workerId) where.workerId = workerId;

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = new Date(year, monthPart - 1, 1);
      const end = new Date(year, monthPart, 1);
      where.date = { gte: start, lt: end };
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = new Date(`${startDate}T00:00:00`);
      }
      if (endDate) {
        const end = new Date(`${endDate}T00:00:00`);
        end.setDate(end.getDate() + 1);
        where.date.lt = end;
      }
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      include: {
        worker: true,
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
      const newDate = new Date(`${dto.date}T00:00:00Z`);
      if (newDate > this.startOfToday()) {
        throw new BadRequestException('Expense date cannot be in the future');
      }
    }

    if (dto.typeId) {
      const type = await this.prisma.expense.findUnique({ where: { id: dto.typeId } });
      if (!type) throw new NotFoundException('Expense type not found');
    }

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
      data: {
        amount: dto.amount ?? expense.amount,
        note: dto.note ?? expense.note,
        typeId: dto.typeId ?? expense.typeId,
        date: dto.date ? new Date(`${dto.date}T00:00:00Z`) : expense.date,
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
