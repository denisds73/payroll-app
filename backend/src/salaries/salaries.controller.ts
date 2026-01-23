import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { FilterSalariesDto } from './dto/filter-salaries.dto';
import { IssueSalaryDto } from './dto/issue-salary.dto';
import { SalariesService } from './salaries.service';

@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  @Get('paid-periods')
  async getPaidPeriods(@Query('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId query parameter is required');
    }

    const workerIdNum = parseInt(workerId, 10);

    if (Number.isNaN(workerIdNum)) {
      throw new BadRequestException('Invalid workerId');
    }

    return this.salariesService.getPaidPeriods(workerIdNum);
  }

  @Get('pending')
  async getPendingSalaries() {
    return this.salariesService.getPendingSalaries();
  }

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

  @Get('worker/:workerId/partial')
  async getPendingPartialSalaries(@Param('workerId', ParseIntPipe) workerId: number) {
    return this.salariesService.getPendingPartialSalaries(workerId);
  }

  @Get('worker/:workerId')
  async getWorkerSalaries(
    @Param('workerId', ParseIntPipe) workerId: number,
    @Query() filter: FilterSalariesDto,
  ) {
    return this.salariesService.getWorkerSalaries(workerId, filter);
  }

  @Get(':id')
  async getSalary(@Param('id', ParseIntPipe) id: number) {
    return this.salariesService.findOne(id);
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
