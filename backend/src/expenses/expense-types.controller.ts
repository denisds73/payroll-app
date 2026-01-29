import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ExpenseTypesService } from './expense-types.service';

@Controller('expense-types')
export class ExpenseTypesController {
  constructor(private readonly expenseTypesService: ExpenseTypesService) {}

  @Get()
  findAll() {
    return this.expenseTypesService.findAll();
  }

  @Post()
  create(@Body() dto: { name: string }) {
    return this.expenseTypesService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expenseTypesService.remove(+id);
  }
}
