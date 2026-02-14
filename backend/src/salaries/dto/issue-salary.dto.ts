import { IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength } from 'class-validator';

export class IssueSalaryDto {
  @IsNumber()
  @IsPositive()
  @Max(10000000, { message: 'Amount must be at most ₹1,00,00,000' })
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Payment proof must be at most 500 characters' })
  paymentProof?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}

