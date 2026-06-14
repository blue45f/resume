import { Module, forwardRef } from '@nestjs/common'

import { BillingModule } from '../billing/billing.module'
import { LlmModule } from '../llm/llm.module'
import { PrismaModule } from '../prisma/prisma.module'

import { InterviewController } from './interview.controller'
import { InterviewService } from './interview.service'

@Module({
  imports: [PrismaModule, forwardRef(() => LlmModule), BillingModule],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
