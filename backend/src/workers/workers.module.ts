import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from 'src/shared/shared.module';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService],
  imports: [PrismaModule, SharedModule],
})
export class WorkersModule {}
