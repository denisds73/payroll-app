import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

@Module({
  providers: [ExpensesService],
  controllers: [ExpensesController],
})
export class ExpensesModule {}
