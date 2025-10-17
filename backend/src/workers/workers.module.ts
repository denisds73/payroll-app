import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [WorkersController],
  providers: [WorkersService],
  imports: [PrismaModule],
})
export class WorkersModule {}
