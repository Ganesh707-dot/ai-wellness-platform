import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      return;
    }
    try {
      await this.$connect();
    } catch (error) {
      console.warn('Prisma connect failed — API will run in degraded mode:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
