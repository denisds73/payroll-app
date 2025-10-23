import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { FilterSalariesDto } from './dto/filter-salaries.dto';
import { IssueSalaryDto } from './dto/issue-salary.dto';
import { SalariesService } from './salaries.service';

@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Get('calculate/:workerId')
  async calculateSalary(@Param('workerId', ParseIntPipe) workerId: number) {
    return this.salariesService.calculateSalary(workerId);
  }

  @Post(':workerId')
  async createSalary(@Param('workerId', ParseIntPipe) workerId: number) {
    return this.salariesService.createSalary(workerId);
  }

  @Get('worker/:workerId')
  async getWorkerSalaries(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query() filter: FilterSalariesDto,
  ) {
    return this.salariesService.getWorkerSalaries(workerId, filter);
  }

  @Get('pending')
  async getPendingSalaries() {
    return this.salariesService.getPendingSalaries();
  }

  @Post(':id/issue')
  async issueSalary(@Param('id', ParseIntPipe) id: number, @Body() data: IssueSalaryDto) {
    return this.salariesService.issueSalary(id, data.amount, data.paymentProof);
  }
}
