import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DateService } from './date.service';
import { SalaryLockService } from './salary-lock.service';

@Module({
  imports: [PrismaModule],
  providers: [SalaryLockService, DateService],
  exports: [SalaryLockService, DateService],
})
export class SharedModule {}
