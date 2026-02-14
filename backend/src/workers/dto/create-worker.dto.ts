import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWorkerDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, { message: 'Phone must be exactly 10 digits' })
  phone?: string;

  @IsNumber()
  @Min(1, { message: 'Daily wage must be at least ₹1' })
  @Max(100000, { message: 'Daily wage must be at most ₹1,00,000' })
  wage: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'OT rate cannot be negative' })
  @Max(100000, { message: 'OT rate must be at most ₹1,00,000' })
  otRate?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Joined date must be a valid date in YYYY-MM-DD format' })
  joinedAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
