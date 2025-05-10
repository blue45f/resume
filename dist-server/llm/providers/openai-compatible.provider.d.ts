import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';
export declare class OpenAiCompatibleProvider implements LlmProvider {
    private config;
    readonly name = "openai-compatible";
    private readonly baseUrl;
    private readonly apiKey;
    private readonly model;
    private readonly logger;
    constructor(config: ConfigService);
    get isAvailable(): boolean;
    generate(systemPrompt: string, userMessage: string): Promise<LlmResponse>;
    generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk>;
}
