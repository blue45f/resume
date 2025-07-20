import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';

@Injectable()
export class AnthropicProvider implements LlmProvider {
  readonly name = 'anthropic';
  private client: Anthropic | null = null;
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly model: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    this.model = this.config.get<string>('ANTHROPIC_MODEL') || 'claude-opus-4-6';
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log('Anthropic provider initialized');
    }
  }

  get isAvailable(): boolean {
    return this.client !== null;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.client) throw new Error('Anthropic API key not configured');

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);

    return { text, tokensUsed, model: this.model, provider: this.name };
  }

  async *generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk> {
    if (!this.client) throw new Error('Anthropic API key not configured');

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'delta', text: event.delta.text };
      }
    }

    const finalMessage = await stream.finalMessage();
    const tokensUsed = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0);

    yield {
      type: 'done',
      tokensUsed,
      model: this.model,
      provider: this.name,
    };
  }
}
