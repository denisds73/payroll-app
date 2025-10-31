import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SharedModule } from '../shared/shared.module';
import { AdvancesController } from './advances.controller';
import { AdvancesService } from './advances.service';

@Module({
  providers: [AdvancesService],
  controllers: [AdvancesController],
  imports: [PrismaModule, SharedModule],
  exports: [AdvancesService],
})
export class AdvancesModule {}
