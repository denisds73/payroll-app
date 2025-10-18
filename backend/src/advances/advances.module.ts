import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdvancesController } from './advances.controller';
import { AdvancesService } from './advances.service';

@Module({
  providers: [AdvancesService],
  controllers: [AdvancesController],
  imports: [PrismaModule],
  exports: [AdvancesService],
})
export class AdvancesModule {}
