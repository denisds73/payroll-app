import { Module } from '@nestjs/common';
import { AdvancesController } from './advances.controller';
import { AdvancesService } from './advances.service';

@Module({
  providers: [AdvancesService],
  controllers: [AdvancesController],
})
export class AdvancesModule {}
