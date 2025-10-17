import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAttendanceDto {
  @IsInt()
  workerId: number;

  @IsDateString()
  date: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsNumber()
  @IsOptional()
  @Min(0)
  otUnits?: number;

  @IsOptional()
  note?: string;
}
