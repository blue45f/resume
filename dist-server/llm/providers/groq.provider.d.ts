import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';
export declare class GroqProvider implements LlmProvider {
    private config;
    readonly name = "groq";
    private readonly apiKey;
    private readonly model;
    private readonly logger;
    constructor(config: ConfigService);
    get isAvailable(): boolean;
    generate(systemPrompt: string, userMessage: string): Promise<LlmResponse>;
    generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk>;
}
