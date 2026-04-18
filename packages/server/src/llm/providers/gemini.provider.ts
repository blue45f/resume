import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';

/**
 * Google Gemini Provider (무료)
 *
 * 무료 티어: 15 RPM, 100만 토큰/일, Gemini 2.0 Flash
 * API Key: https://aistudio.google.com/apikey
 *
 * 환경변수:
 * - GEMINI_API_KEY: Google AI Studio API Key
 * - GEMINI_MODEL: 모델 (기본: gemini-2.0-flash)
 */
@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    if (this.apiKey) {
      this.logger.log(`Gemini provider initialized (model: ${this.model})`);
    }
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 4096 },
    });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(60000),
        });

        if (!res.ok) {
          const err = await res.text().catch(() => '');
          if ((res.status === 429 || res.status >= 500) && attempt < 2) {
            this.logger.warn(`Gemini ${res.status}, retry ${attempt + 1}/2`);
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(`Gemini API error: ${res.status} ${err.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const usage = data.usageMetadata || {};
        const tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

        return { text, tokensUsed, model: this.model, provider: this.name };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < 2 && lastError.name !== 'AbortError') {
          this.logger.warn(`Gemini error, retry ${attempt + 1}/2: ${lastError.message}`);
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError || new Error('Gemini: max retries exceeded');
  }

  async *generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Gemini stream error: ${res.status}`);
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
        if (!line.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            yield { type: 'delta', text };
          }
          if (data.usageMetadata) {
            totalTokens =
              (data.usageMetadata.promptTokenCount || 0) +
              (data.usageMetadata.candidatesTokenCount || 0);
          }
        } catch {
          /* skip */
        }
      }
    }

    yield { type: 'done', tokensUsed: totalTokens, model: this.model, provider: this.name };
  }
}
