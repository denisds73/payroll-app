import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getDatabasePath } from '../utils/path.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const dbPath = getDatabasePath();
    const normalizedPath = dbPath.replace(/\\/g, '/');
    super({
      datasources: {
        db: {
          url: `file:${normalizedPath}`,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
