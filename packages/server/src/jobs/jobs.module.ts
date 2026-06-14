import { Module } from '@nestjs/common'

import { LlmModule } from '../llm/llm.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'

import { JobUrlParserService } from './job-url-parser.service'
import { JobsController } from './jobs.controller'
import { JobsService } from './jobs.service'

@Module({
  imports: [PrismaModule, LlmModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService, JobUrlParserService],
  exports: [JobUrlParserService],
})
export class JobsModule {}
