import { Body, Controller, Post } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { CreateAdvanceDto } from './dto/create-advance.dto';

@Controller('advances')
export class AdvancesController {
  constructor(private readonly advancesService: AdvancesService) {}

  @Post()
  create(@Body() dto: CreateAdvanceDto) {
    return this.advancesService.create(dto);
  }
}
