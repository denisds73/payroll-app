import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAdvanceDto {
  @IsNumber()
  workerId: number;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than  0' })
  amount: number;

  @IsDateString({}, { message: 'Date must be a string in YYYY-MM-DD format' })
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
