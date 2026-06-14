import { Module } from '@nestjs/common'

import { LlmModule } from '../llm/llm.module'
import { PrismaModule } from '../prisma/prisma.module'

import { JobInterviewQuestionsAdminController } from './job-interview-questions-admin.controller'
import { JobInterviewQuestionsController } from './job-interview-questions.controller'
import { JobInterviewQuestionsService } from './job-interview-questions.service'

@Module({
  imports: [PrismaModule, LlmModule],
  controllers: [JobInterviewQuestionsAdminController, JobInterviewQuestionsController],
  providers: [JobInterviewQuestionsService],
})
export class JobInterviewQuestionsModule {}
