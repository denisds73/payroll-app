import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAttendanceCto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private startOfToday(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  async create(dto: CreateAttendanceDto) {
    const worker = await this.prisma.worker.findUnique({
      where: { id: dto.workerId },
    });

    if (!worker) {
      throw new BadRequestException('Worker not found');
    }

    const date = new Date(dto.date + 'T00:00:00');

    if (date > this.startOfToday()) {
      throw new BadRequestException(
        'Attendance can not be marked for future date',
      );
    }

    try {
      return await this.prisma.attendance.create({
        data: {
          workerId: dto.workerId,
          date,
          status: dto.status,
          otUnits: dto.otUnits ?? 0,
          note: dto.note,
        },
        include: {
          worker: true,
        },
      });
    } catch (error) {
      if (error.code == 'P2002') {
        throw new ConflictException(
          'Attendance for this worker on this date already exists',
        );
      }
      throw error;
    }
  }

  async findAll(params?: { workerId?: number; date?: string; month?: string }) {
    const { workerId, date, month } = params || {};

    const where: any = {};

    if (workerId) where.workerId = workerId;

    if (month) {
      const [year, monthPart] = month.split('-').map(Number);
      const start = new Date(year, monthPart - 1, 1);
      const end = new Date(year, monthPart, 1);
      where.date = { gte: start, lt: end };
    }

    if (date) {
      const localDate = new Date(date + 'T00:00:00');
      const nextDate = new Date(localDate);
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

  async update(id: number, dto: UpdateAttendanceCto) {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      throw new BadRequestException('Attendance record not found');
    }

    if (dto.date) {
      const newDate = new Date(dto.date + 'T00:00:00');
      if (newDate > this.startOfToday()) {
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
