import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsNumber()
  wage: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
