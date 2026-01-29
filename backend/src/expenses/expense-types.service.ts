import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.expenseType.findMany();
  }

  async create(dto: { name: string }) {
    return this.prisma.expenseType.create({ data: { name: dto.name } });
  }

  async remove(id: number) {
    return this.prisma.expenseType.delete({ where: { id } });
  }
}
