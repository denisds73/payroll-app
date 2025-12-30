import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { SalariesController } from './salaries.controller';
import { SalariesService } from './salaries.service';

@Module({
  imports: [PrismaModule, SharedModule],
  providers: [SalariesService],
  controllers: [SalariesController],
})
export class SalariesModule {}
