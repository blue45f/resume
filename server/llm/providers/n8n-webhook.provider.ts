import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';

/**
 * n8n Webhook Provider
 *
 * n8n 워크플로우를 통해 무료/저렴한 LLM을 호출합니다.
 * n8n에서 다양한 모델(Ollama, HuggingFace, Google Gemini 무료 등)을
 * 워크플로우로 연결하여 비용을 최소화합니다.
 *
 * n8n webhook 엔드포인트 설정:
 * - N8N_WEBHOOK_URL: n8n webhook trigger URL
 * - 요청: POST { systemPrompt, userMessage }
 * - 응답: { text, tokensUsed?, model? }
 */
@Injectable()
export class N8nWebhookProvider implements LlmProvider {
  readonly name = 'n8n';
  private readonly webhookUrl: string | undefined;
  private readonly logger = new Logger(N8nWebhookProvider.name);

  constructor(private config: ConfigService) {
    this.webhookUrl = this.config.get<string>('N8N_WEBHOOK_URL');
    if (this.webhookUrl) {
      this.logger.log(`n8n provider initialized: ${this.webhookUrl}`);
    }
  }

  get isAvailable(): boolean {
    return !!this.webhookUrl;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.webhookUrl) throw new Error('N8N_WEBHOOK_URL not configured');

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, userMessage }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      text: data.text || data.output || '',
      tokensUsed: data.tokensUsed || 0,
      model: data.model || 'n8n-workflow',
      provider: this.name,
    };
  }

  async *generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk> {
    // n8n webhook은 기본적으로 스트리밍을 지원하지 않으므로
    // 전체 응답을 받은 후 청크로 나누어 전달
    const result = await this.generate(systemPrompt, userMessage);

    // Simulate streaming by splitting into chunks
    const chunkSize = 50;
    for (let i = 0; i < result.text.length; i += chunkSize) {
      yield {
        type: 'delta',
        text: result.text.slice(i, i + chunkSize),
      };
    }

    yield {
      type: 'done',
      tokensUsed: result.tokensUsed,
      model: result.model,
      provider: this.name,
    };
  }
}
