import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than zero' })
  @Max(10000000, { message: 'Amount must be at most ₹1,00,00,000' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Date must be a valid date in YYYY-MM-DD format' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Note must be at most 500 characters' })
  note?: string;

  @IsOptional()
  @IsNumber()
  typeId?: number;
}

