import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';
export declare class AnthropicProvider implements LlmProvider {
    private config;
    readonly name = "anthropic";
    private client;
    private readonly logger;
    private readonly model;
    constructor(config: ConfigService);
    get isAvailable(): boolean;
    generate(systemPrompt: string, userMessage: string): Promise<LlmResponse>;
    generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk>;
}
