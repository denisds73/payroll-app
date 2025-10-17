import { Module } from '@nestjs/common';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';

@Module({
  providers: [SalariesService],
  controllers: [SalariesController],
})
export class SalariesModule {}
