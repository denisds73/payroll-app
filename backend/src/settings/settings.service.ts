import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async create(createSettingDto: CreateSettingDto) {
    return this.prisma.systemSetting.create({
      data: createSettingDto,
    });
  }

  async findAll() {
    return this.prisma.systemSetting.findMany();
  }

  async findOne(key: string) {
    return this.prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: updateSettingDto,
      create: {
        key,
        value: updateSettingDto.value || '',
        description: updateSettingDto.description,
      },
    });
  }

  async remove(key: string) {
    return this.prisma.systemSetting.delete({
      where: { key },
    });
  }
}
