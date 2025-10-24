import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsInt()
  workerId: number;

  @IsNumber()
  @Min(1, { message: 'amount must be greater than zero' })
  amount: number;

  @IsInt()
  typeId: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  date: string;
}
