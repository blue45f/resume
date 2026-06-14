import { Module, forwardRef } from '@nestjs/common'

import { UsageService } from '../health/usage.service'
import { PrismaModule } from '../prisma/prisma.module'
import { ResumesModule } from '../resumes/resumes.module'

import { AutoGenerateController } from './auto-generate.controller'
import { FileTextExtractorService } from './file-text-extractor.service'
import { LlmController } from './llm.controller'
import { LlmService } from './llm.service'
import { AnthropicProvider } from './providers/anthropic.provider'
import { GeminiProvider } from './providers/gemini.provider'
import { GroqProvider } from './providers/groq.provider'
import { N8nWebhookProvider } from './providers/n8n-webhook.provider'
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider'

@Module({
  imports: [forwardRef(() => ResumesModule), PrismaModule],
  controllers: [LlmController, AutoGenerateController],
  providers: [
    LlmService,
    UsageService,
    FileTextExtractorService,
    AnthropicProvider,
    GeminiProvider,
    GroqProvider,
    N8nWebhookProvider,
    OpenAiCompatibleProvider,
  ],
  exports: [LlmService, FileTextExtractorService],
})
export class LlmModule {}
