import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.worker.findMany();
  }

  create(data: CreateWorkerDto) {
    const { joinedAt, ...rest } = data;
    return this.prisma.worker.create({
      data: {
        ...rest,
        joinedAt: joinedAt ? new Date(`${joinedAt}T00:00:00Z`) : undefined,
      },
    });
  }

  async update(id: number, data: UpdateWorkerDto) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`worker with ID ${id} not found`);
    }

    return this.prisma.worker.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const worker = await this.prisma.worker.findUnique({ where: { id } });

    if (!worker) {
      throw new NotFoundException(`worker with ID ${id} not found`);
    }

    return this.prisma.worker.delete({ where: { id } });
  }
}
