import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateService } from 'src/shared/date.service';
import { SalaryLockService } from 'src/shared/salary-lock.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private dateService: DateService,
    private salaryLock: SalaryLockService,
  ) {}

  async create(dto: CreateAttendanceDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id: dto.workerId } });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    if (!worker.isActive) {
      throw new BadRequestException('Cannot mark attendance for inactive worker');
    }

    const date = this.dateService.parseDate(dto.date);
    if (date > this.dateService.startOfToday()) {
      throw new BadRequestException('Cannot mark attendance for future dates');
    }

    // Check for duplicate attendance
    const existing = await this.prisma.attendance.findFirst({
      where: {
        workerId: dto.workerId,
        date: date,
      },
    });

    if (existing) {
      throw new ConflictException('Attendance for this date already exists');
    }

    return this.prisma.attendance.create({
      data: {
        workerId: dto.workerId,
        date,
        status: dto.status,
        otUnits: dto.otUnits,
        note: dto.note,
      },
      include: {
        worker: true,
      },
    });
  }

  async findAll(params?: FilterAttendanceDto) {
    const { workerId, date, month } = params || {};

    const where: Prisma.AttendanceWhereInput = {};

    if (workerId) where.workerId = workerId;

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = this.dateService.startOfMonth(year, monthPart);
      const end = this.dateService.startOfMonth(year, monthPart + 1);
      where.date = { gte: start, lt: end };
    }

    if (date) {
      const localDate = this.dateService.parseDate(date);
      const nextDate = this.dateService.parseDate(date);
      nextDate.setDate(nextDate.getDate() + 1);
      where.date = { gte: localDate, lt: nextDate };
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        worker: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.attendance.findUnique({
      where: { id },
      include: { worker: true },
    });

    if (!record) {
      throw new BadRequestException('Attendance record not found');
    }

    return record;
  }

  async update(id: number, dto: UpdateAttendanceDto) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    await this.salaryLock.assertNotLocked(attendance.workerId, attendance.date, 'attendance');

    if (dto.date) {
      const newDate = this.dateService.parseDate(dto.date);
      if (newDate > this.dateService.startOfToday()) {
        throw new BadRequestException('Cannot update to a future date');
      }
    }

    return this.prisma.attendance.update({
      where: { id },
      data: dto,
      include: {
        worker: true,
      },
    });
  }

  async remove(id: number) {
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        id,
      },
      include: {
        worker: true,
      },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    await this.salaryLock.assertNotLocked(attendance.workerId, attendance.date, 'attendance');

    await this.prisma.attendance.delete({
      where: { id },
      include: { worker: true },
    });
    return {
      message: `Attendance for ${attendance.worker.name} on ${attendance.date.toDateString()} deleted successfully`,
      data: attendance,
    };
  }
}
