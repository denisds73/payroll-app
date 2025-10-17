import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateAdvanceDto {
  @IsNumber()
  workerId: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  reason?: string;
}
