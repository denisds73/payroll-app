import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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
  @IsString()
  @MaxLength(500, { message: 'Note must be at most 500 characters' })
  note?: string;
}

