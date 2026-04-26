import { Module, forwardRef } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [PrismaModule, forwardRef(() => LlmModule)],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
