"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AnthropicProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
let AnthropicProvider = AnthropicProvider_1 = class AnthropicProvider {
    config;
    name = 'anthropic';
    client = null;
    logger = new common_1.Logger(AnthropicProvider_1.name);
    model;
    constructor(config) {
        this.config = config;
        const apiKey = this.config.get('ANTHROPIC_API_KEY');
        this.model = this.config.get('ANTHROPIC_MODEL') || 'claude-sonnet-4-20250514';
        if (apiKey) {
            this.client = new sdk_1.default({ apiKey });
            this.logger.log('Anthropic provider initialized');
        }
    }
    get isAvailable() {
        return this.client !== null;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.client)
            throw new Error('Anthropic API key not configured');
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
        return { text, tokensUsed, model: this.model, provider: this.name };
    }
    async *generateStream(systemPrompt, userMessage) {
        if (!this.client)
            throw new Error('Anthropic API key not configured');
        const stream = this.client.messages.stream({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        });
        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield { type: 'delta', text: event.delta.text };
            }
        }
        const finalMessage = await stream.finalMessage();
        const tokensUsed = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0);
        yield {
            type: 'done',
            tokensUsed,
            model: this.model,
            provider: this.name,
        };
    }
};
exports.AnthropicProvider = AnthropicProvider;
exports.AnthropicProvider = AnthropicProvider = AnthropicProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AnthropicProvider);
