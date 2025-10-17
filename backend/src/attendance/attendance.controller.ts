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
import type { AttendanceService } from './attendance.service';
import type { CreateAttendanceDto } from './dto/create-attendance.dto';
import type { UpdateAttendanceCto } from './dto/update-attendance.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  create(@Body() dto: CreateAttendanceDto) {
    return this.attendanceService.create(dto);
  }

  @Get()
  findAll(
    @Query('workerId') workerId?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.findAll({
      workerId: workerId ? +workerId : undefined,
      date,
      month,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAttendanceCto) {
    return this.attendanceService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.attendanceService.remove(id);
  }
}
