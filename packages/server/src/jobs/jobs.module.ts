import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobUrlParserService } from './job-url-parser.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, LlmModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService, JobUrlParserService],
  exports: [JobUrlParserService],
})
export class JobsModule {}
