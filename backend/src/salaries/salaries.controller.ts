import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { FilterSalariesDto } from './dto/filter-salaries.dto';
import { IssueSalaryDto } from './dto/issue-salary.dto';
import { SalariesService } from './salaries.service';

@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Get('debug/:workerId')
  async debugSalary(@Param('workerId', ParseIntPipe) workerId: number) {
    return this.salariesService.debugSalary(workerId);
  }

  @Get('calculate/:workerId')
  async calculateSalary(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('payDate') payDate?: string,
  ) {
    console.log('📊 Controller received:', { workerId, payDate });
    return this.salariesService.calculateSalary(workerId, payDate);
  }

  @Get('pending')
  async getPendingSalaries() {
    return this.salariesService.getPendingSalaries();
  }

  @Get('worker/:workerId')
  async getWorkerSalaries(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query() filter: FilterSalariesDto,
  ) {
    return this.salariesService.getWorkerSalaries(workerId, filter);
  }

  @Post(':workerId')
  async createSalary(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query('payDate') payDate?: string,
  ) {
    console.log('💾 Controller received:', { workerId, payDate });
    return this.salariesService.createSalary(workerId, payDate);
  }

  @Post(':id/issue')
  async issueSalary(@Param('id', ParseIntPipe) id: number, @Body() data: IssueSalaryDto) {
    return this.salariesService.issueSalary(id, data.amount, data.paymentProof);
  }
}
