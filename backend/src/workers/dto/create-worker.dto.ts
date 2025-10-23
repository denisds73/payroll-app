import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  wage: number;

  @IsNumber()
  @IsOptional()
  otRate?: number;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
