import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkersModule } from './workers/workers.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, WorkersModule, AttendanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
