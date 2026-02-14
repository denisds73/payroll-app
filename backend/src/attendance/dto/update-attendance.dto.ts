import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateAttendanceDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'OT units cannot be negative' })
  otUnits?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note must be at most 500 characters' })
  note?: string;
}
