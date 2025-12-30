import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  workerId?: number;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  typeId?: number;
}
