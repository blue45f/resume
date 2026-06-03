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
/**
 * Safety settings — résumé/cover-letter text (career stories, military service,
 * health/medical roles, etc.) can falsely trip Gemini's default harm filters and
 * return an empty candidate. We relax thresholds to BLOCK_NONE for this
 * professional-document use case so legitimate content is not silently dropped.
 */
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly name = 'gemini';
  private readonly apiKey: string | undefined;
  private readonly model: string;
  /** Optional secondary model to retry once with on persistent server errors. */
  private readonly fallbackModel: string | undefined;
  private readonly timeoutMs: number;
  private readonly maxOutputTokens: number;
  private readonly logger = new Logger(GeminiProvider.name);

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    // Optional fallback model (e.g. gemini-1.5-flash) tried once if the primary
    // model keeps failing — keeps AI available during a model-specific outage.
    this.fallbackModel = this.config.get<string>('GEMINI_FALLBACK_MODEL') || undefined;
    this.timeoutMs = Number(this.config.get('GEMINI_TIMEOUT_MS')) || 60000;
    this.maxOutputTokens = Number(this.config.get('GEMINI_MAX_OUTPUT_TOKENS')) || 4096;
    if (this.apiKey) {
      this.logger.log(
        `Gemini provider initialized (model: ${this.model}${
          this.fallbackModel ? `, fallback: ${this.fallbackModel}` : ''
        })`,
      );
    }
  }

  get isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmResponse> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY not configured');

    try {
      return await this.generateOnce(this.model, systemPrompt, userMessage);
    } catch (primaryError) {
      // Model-level fallback: if a secondary model is configured, try it once.
      if (this.fallbackModel && this.fallbackModel !== this.model) {
        this.logger.warn(
          `Gemini primary model '${this.model}' failed, trying fallback '${this.fallbackModel}'`,
        );
        return await this.generateOnce(this.fallbackModel, systemPrompt, userMessage);
      }
      throw primaryError;
    }
  }

  /** One model attempt, with exponential backoff retries on 429/5xx/transient errors. */
  private async generateOnce(
    model: string,
    systemPrompt: string,
    userMessage: string,
  ): Promise<LlmResponse> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const body = JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: { maxOutputTokens: this.maxOutputTokens },
    });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(this.timeoutMs),
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
        // Surface safety/recitation blocks as retryable errors instead of
        // returning empty text (which would silently produce a broken result).
        if (!text) {
          const reason =
            data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || 'EMPTY';
          throw new Error(`Gemini returned no text (finishReason: ${reason})`);
        }
        const usage = data.usageMetadata || {};
        const tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);

        return { text, tokensUsed, model, provider: this.name };
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

  /**
   * Vision: 이미지 → 텍스트 추출 (이력서 사진, 스캔본, 명함 등).
   * imageBuffer 는 base64 로 변환되어 inline_data 로 전송. 5MB 이내 권장.
   */
  async extractImageText(imageBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.apiKey) throw new Error('GEMINI_API_KEY not configured');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: '이 이미지의 모든 한국어/영어 텍스트를 원본 그대로(레이아웃 무시) 추출해줘. 이력서/명함/스캔본 가능. 텍스트 외 설명 금지.',
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBuffer.toString('base64'),
              },
            },
          ],
        },
      ],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: { maxOutputTokens: this.maxOutputTokens },
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`Gemini Vision error: ${res.status} ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        safetySettings: SAFETY_SETTINGS,
        generationConfig: { maxOutputTokens: this.maxOutputTokens },
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
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
