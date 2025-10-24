import { Module } from '@nestjs/common';
import { AdvancesModule } from './advances/advances.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PrismaModule } from './prisma/prisma.module';
import { SalariesModule } from './salaries/salaries.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    PrismaModule,
    WorkersModule,
    AttendanceModule,
    AdvancesModule,
    ExpensesModule,
    SalariesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
