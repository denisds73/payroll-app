import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AdvancesModule } from './advances/advances.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttendanceModule } from './attendance/attendance.module';
import { BackupModule } from './backup/backup.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PrismaModule } from './prisma/prisma.module';
import { SalariesModule } from './salaries/salaries.module';
import { SettingsModule } from './settings/settings.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    WorkersModule,
    AttendanceModule,
    AdvancesModule,
    ExpensesModule,
    SalariesModule,
    SettingsModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
