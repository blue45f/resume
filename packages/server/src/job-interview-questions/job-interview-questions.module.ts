import { Module } from '@nestjs/common';
import { JobInterviewQuestionsController } from './job-interview-questions.controller';
import { JobInterviewQuestionsService } from './job-interview-questions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, LlmModule],
  controllers: [JobInterviewQuestionsController],
  providers: [JobInterviewQuestionsService],
})
export class JobInterviewQuestionsModule {}
