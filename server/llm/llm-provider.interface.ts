export interface LlmResponse {
  text: string;
  tokensUsed: number;
  model: string;
  provider: string;
}

export interface LlmStreamChunk {
  type: 'delta' | 'done' | 'error';
  text?: string;
  id?: string;
  tokensUsed?: number;
  model?: string;
  provider?: string;
  message?: string;
  createdAt?: string;
}

export interface LlmProvider {
  readonly name: string;
  readonly isAvailable: boolean;

  generate(
    systemPrompt: string,
    userMessage: string,
  ): Promise<LlmResponse>;

  generateStream(
    systemPrompt: string,
    userMessage: string,
  ): AsyncGenerator<LlmStreamChunk>;
}
