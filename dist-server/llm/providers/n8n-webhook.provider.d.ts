import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmResponse, LlmStreamChunk } from '../llm-provider.interface';
export declare class N8nWebhookProvider implements LlmProvider {
    private config;
    readonly name = "n8n";
    private readonly webhookUrl;
    private readonly logger;
    constructor(config: ConfigService);
    get isAvailable(): boolean;
    generate(systemPrompt: string, userMessage: string): Promise<LlmResponse>;
    generateStream(systemPrompt: string, userMessage: string): AsyncGenerator<LlmStreamChunk>;
}
