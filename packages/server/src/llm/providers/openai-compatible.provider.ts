import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';

/**
 * OpenAI Compatible Provider
 *
 * OpenAI API 호환 엔드포인트를 지원합니다.
 * 다음과 같은 무료/저렴한 서비스에 사용 가능:
 * - Ollama (로컬, 무료)
 * - LM Studio (로컬, 무료)
 * - Groq (무료 티어)
 * - Together AI (저렴)
 * - OpenRouter (다양한 무료 모델)
 *
 * 환경변수:
 * - OPENAI_COMPATIBLE_URL: API base URL (예: http://localhost:11434/v1)
 * - OPENAI_COMPATIBLE_KEY: API key (선택)
 * - OPENAI_COMPATIBLE_MODEL: 모델 이름 (예: llama3, gemma2)
 */
@Injectable()
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name = 'openai-compatible';
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly logger = new Logger(OpenAiCompatibleProvider.name);

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('OPENAI_COMPATIBLE_URL');
    this.apiKey = this.config.get<string>('OPENAI_COMPATIBLE_KEY');
    this.model = this.config.get<string>('OPENAI_COMPATIBLE_MODEL') || 'llama3';
    if (this.baseUrl) {
      this.logger.log(
        `OpenAI-compatible provider initialized: ${this.baseUrl} (model: ${this.model})`,
      );
    }
  }

  get isAvailable(): boolean {
    return !!this.baseUrl;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.baseUrl) throw new Error('OPENAI_COMPATIBLE_URL not configured');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

    return { text, tokensUsed, model: this.model, provider: this.name };
  }

  async *generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk> {
    if (!this.baseUrl) throw new Error('OPENAI_COMPATIBLE_URL not configured');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4096,
        stream: true,
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI-compatible streaming failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield { type: 'delta', text: content };
          }
          if (parsed.usage) {
            totalTokens = (parsed.usage.prompt_tokens || 0) + (parsed.usage.completion_tokens || 0);
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }

    yield {
      type: 'done',
      tokensUsed: totalTokens,
      model: this.model,
      provider: this.name,
    };
  }
}
