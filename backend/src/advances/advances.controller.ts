import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

@Controller('advances')
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  create(@Body() dto: CreateAdvanceDto) {
    return this.advancesService.create(dto);
  }

  @Get()
  findAll(
    @Query('workerId') workerId?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.advancesService.findAll({
      workerId: workerId ? +workerId : undefined,
      month,
      startDate,
      endDate,
    });
  }

  // @Delete(':id')
  // this.delete(@Param('id', ParseIntPipe) id: number){
  //   return this.advancesService.remove(id);
  // }
}
