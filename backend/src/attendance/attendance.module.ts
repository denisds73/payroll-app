import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
