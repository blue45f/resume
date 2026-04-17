"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OpenAiCompatibleProvider", {
    enumerable: true,
    get: function() {
        return OpenAiCompatibleProvider;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let OpenAiCompatibleProvider = class OpenAiCompatibleProvider {
    get isAvailable() {
        return !!this.baseUrl;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.baseUrl) throw new Error('OPENAI_COMPATIBLE_URL not configured');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 4096,
                stream: false
            }),
            signal: AbortSignal.timeout(120000)
        });
        if (!response.ok) {
            throw new Error(`OpenAI-compatible API failed: ${response.status}`);
        }
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '';
        const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
        return {
            text,
            tokensUsed,
            model: this.model,
            provider: this.name
        };
    }
    async *generateStream(systemPrompt, userMessage) {
        if (!this.baseUrl) throw new Error('OPENAI_COMPATIBLE_URL not configured');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                max_tokens: 4096,
                stream: true
            }),
            signal: AbortSignal.timeout(120000)
        });
        if (!response.ok || !response.body) {
            throw new Error(`OpenAI-compatible streaming failed: ${response.status}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let totalTokens = 0;
        while(true){
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, {
                stream: true
            });
            const lines = chunk.split('\n').filter((line)=>line.startsWith('data: '));
            for (const line of lines){
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                        yield {
                            type: 'delta',
                            text: content
                        };
                    }
                    if (parsed.usage) {
                        totalTokens = (parsed.usage.prompt_tokens || 0) + (parsed.usage.completion_tokens || 0);
                    }
                } catch  {
                // Skip unparseable chunks
                }
            }
        }
        yield {
            type: 'done',
            tokensUsed: totalTokens,
            model: this.model,
            provider: this.name
        };
    }
    constructor(config){
        this.config = config;
        this.name = 'openai-compatible';
        this.logger = new _common.Logger(OpenAiCompatibleProvider.name);
        this.baseUrl = this.config.get('OPENAI_COMPATIBLE_URL');
        this.apiKey = this.config.get('OPENAI_COMPATIBLE_KEY');
        this.model = this.config.get('OPENAI_COMPATIBLE_MODEL') || 'llama3';
        if (this.baseUrl) {
            this.logger.log(`OpenAI-compatible provider initialized: ${this.baseUrl} (model: ${this.model})`);
        }
    }
};
OpenAiCompatibleProvider = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], OpenAiCompatibleProvider);
