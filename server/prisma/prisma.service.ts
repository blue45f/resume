import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BeforeApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy, BeforeApplicationShutdown
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV !== 'production'
          ? [{ emit: 'event', level: 'query' }]
          : [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      this.$on('query' as never, (e: any) => {
        if (e.duration > 100) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }

    // Log connection pool warnings in production
    this.$on('warn' as never, (e: any) => {
      this.logger.warn(`Prisma warning: ${e.message}`);
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async beforeApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutting down (signal: ${signal}), closing database connections...`);
    if (this.isConnected) {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Database connections closed');
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.isConnected = false;
    }
  }
}
