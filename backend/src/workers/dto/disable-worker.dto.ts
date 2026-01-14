import { IsDateString, IsNotEmpty } from 'class-validator';

export class DisableWorkerDto {
  @IsNotEmpty({ message: 'Effective date is required' })
  @IsDateString({}, { message: 'Invalid date format. Use YYYY-MM-DD' })
  effectiveFrom: string;
}
