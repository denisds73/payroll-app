import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateAdvanceDto {
  @IsNumber()
  workerId: number;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than  0' })
  @Max(10000000, { message: 'Amount must be at most ₹1,00,00,000' })
  amount: number;

  @IsDateString({}, { message: 'Date must be a string in YYYY-MM-DD format' })
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must be at most 500 characters' })
  reason?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}

