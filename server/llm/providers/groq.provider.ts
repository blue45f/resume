import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';

/**
 * Groq Provider (무료)
 *
 * 무료 티어: 30 RPM, 14,400 RPD, Llama 3.3 70B
 * API Key: https://console.groq.com/keys
 *
 * 환경변수:
 * - GROQ_API_KEY: Groq API Key
 * - GROQ_MODEL: 모델 (기본: llama-3.3-70b-versatile)
 */
@Injectable()
export class GroqProvider implements LlmProvider {
  readonly name = 'groq';
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly logger = new Logger(GroqProvider.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY');
    this.model = this.config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile';
    if (this.apiKey) {
      this.logger.log(`Groq provider initialized (model: ${this.model})`);
    }
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY not configured');

    const body = JSON.stringify({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 4096,
      stream: false,
    });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body,
          signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => '');
          if ((res.status === 429 || res.status >= 500) && attempt < 2) {
            this.logger.warn(`Groq ${res.status}, retry ${attempt + 1}/2`);
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(`Groq API error: ${res.status} ${err.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);

        return { text, tokensUsed, model: this.model, provider: this.name };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < 2 && lastError.name !== 'AbortError') {
          this.logger.warn(`Groq error, retry ${attempt + 1}/2: ${lastError.message}`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError || new Error('Groq: max retries exceeded');
  }

  async *generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY not configured');

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 4096,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Groq stream error: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let totalTokens = 0;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
        try {
          const data = JSON.parse(line.slice(6));
          const content = data.choices?.[0]?.delta?.content;
          if (content) yield { type: 'delta', text: content };
          if (data.x_groq?.usage) {
            totalTokens = (data.x_groq.usage.prompt_tokens || 0) +
                          (data.x_groq.usage.completion_tokens || 0);
          }
        } catch { /* skip */ }
      }
    }

    yield { type: 'done', tokensUsed: totalTokens, model: this.model, provider: this.name };
  }
}
