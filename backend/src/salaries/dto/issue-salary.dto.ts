import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class IssueSalaryDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  paymentProof?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
