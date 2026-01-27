import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';

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

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdvanceDto) {
    return this.advancesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.advancesService.remove(id);
  }

  @Get('workers')
  getWorkersWithLatestAdvance() {
    return this.advancesService.getWorkersWithLatestAdvance();
  }

  @Get('worker/:id/total')
  async getWorkerTotal(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.advancesService.getWorkerTotal(id, startDate, endDate);
  }
}
