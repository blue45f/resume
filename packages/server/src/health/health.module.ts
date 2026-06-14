import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { PrismaModule } from '../prisma/prisma.module'

import { AdminStatsService } from './admin-stats.service'
import { HealthController } from './health.controller'
import { UsageService } from './usage.service'

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [HealthController],
  providers: [AdminStatsService, UsageService],
  exports: [UsageService],
})
export class HealthModule {}
