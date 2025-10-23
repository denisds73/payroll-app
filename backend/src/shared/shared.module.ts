import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SalaryLockService } from './salary-lock.service';

@Module({
  imports: [PrismaModule],
  providers: [SalaryLockService],
  exports: [SalaryLockService],
})
export class SharedModule {}
