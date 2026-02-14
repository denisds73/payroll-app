import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAdvanceDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  @Max(10000000, { message: 'Amount must be at most ₹1,00,00,000' })
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Reason must be at most 500 characters' })
  reason?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid date in YYYY-MM-DD format' })
  date?: string;
}

