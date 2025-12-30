import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAdvanceDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
