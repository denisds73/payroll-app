import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateWorkerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits' })
  phone?: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Daily wage must be at least ₹1' })
  @Max(100000, { message: 'Daily wage must be at most ₹1,00,000' })
  wage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'OT rate cannot be negative' })
  @Max(100000, { message: 'OT rate must be at most ₹1,00,000' })
  otRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'Wage effective date must be a valid date in YYYY-MM-DD format' })
  wageEffectiveDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'OT rate effective date must be a valid date in YYYY-MM-DD format' })
  otRateEffectiveDate?: string;

  @IsOptional()
  @IsNumber()
  openingBalance?: number;
}

