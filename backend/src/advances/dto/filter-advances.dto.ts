import { IsDateString, IsNumber, IsOptional } from 'class-validator';
import { IsMonthString } from 'src/shared/validators/is-month-string.validator';

export class FilterAdvancesDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsMonthString()
  month?: string;
}
