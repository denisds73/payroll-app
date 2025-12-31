// expense-types.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
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
}
