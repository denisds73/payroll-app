import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { IsMonthString } from 'src/shared/validators/is-month-string.validator';

export class FilterAttendanceDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsMonthString()
  month?: string;
}
