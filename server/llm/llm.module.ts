import { Module } from '@nestjs/common';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { ResumesModule } from '../resumes/resumes.module';
import { AnthropicProvider } from './providers/anthropic.provider';
import { N8nWebhookProvider } from './providers/n8n-webhook.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

@Module({
  imports: [ResumesModule],
  controllers: [LlmController],
  providers: [
    LlmService,
    AnthropicProvider,
    N8nWebhookProvider,
    OpenAiCompatibleProvider,
  ],
  exports: [LlmService],
})
export class LlmModule {}
