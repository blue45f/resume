"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AnthropicProvider", {
    enumerable: true,
    get: function() {
        return AnthropicProvider;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _sdk = /*#__PURE__*/ _interop_require_default(require("@anthropic-ai/sdk"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AnthropicProvider = class AnthropicProvider {
    get isAvailable() {
        return this.client !== null;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.client) throw new Error('Anthropic API key not configured');
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });
        const text = response.content[0].type === 'text' ? response.content[0].text : '';
        const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0);
        return {
            text,
            tokensUsed,
            model: this.model,
            provider: this.name
        };
    }
    async *generateStream(systemPrompt, userMessage) {
        if (!this.client) throw new Error('Anthropic API key not configured');
        const stream = this.client.messages.stream({
            model: this.model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });
        for await (const event of stream){
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield {
                    type: 'delta',
                    text: event.delta.text
                };
            }
        }
        const finalMessage = await stream.finalMessage();
        const tokensUsed = (finalMessage.usage?.input_tokens ?? 0) + (finalMessage.usage?.output_tokens ?? 0);
        yield {
            type: 'done',
            tokensUsed,
            model: this.model,
            provider: this.name
        };
    }
    constructor(config){
        this.config = config;
        this.name = 'anthropic';
        this.client = null;
        this.logger = new _common.Logger(AnthropicProvider.name);
        const apiKey = this.config.get('ANTHROPIC_API_KEY');
        this.model = this.config.get('ANTHROPIC_MODEL') || 'claude-opus-4-6';
        if (apiKey) {
            this.client = new _sdk.default({
                apiKey
            });
            this.logger.log('Anthropic provider initialized');
        }
    }
};
AnthropicProvider = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AnthropicProvider);
