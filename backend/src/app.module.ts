import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkersModule } from './workers/workers.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdvancesModule } from './advances/advances.module';
import { ExpensesModule } from './expenses/expenses.module';
import { SalariesModule } from './salaries/salaries.module';

@Module({
  imports: [PrismaModule, WorkersModule, AttendanceModule, AdvancesModule, ExpensesModule, SalariesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
