import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsNumber()
  wage?: number;

  @IsOptional()
  @IsNumber()
  otRate?: number;

  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
