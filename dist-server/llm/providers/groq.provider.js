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
var GroqProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GroqProvider = GroqProvider_1 = class GroqProvider {
    config;
    name = 'groq';
    apiKey;
    model;
    logger = new common_1.Logger(GroqProvider_1.name);
    constructor(config) {
        this.config = config;
        this.apiKey = this.config.get('GROQ_API_KEY');
        this.model = this.config.get('GROQ_MODEL') || 'llama-3.3-70b-versatile';
        if (this.apiKey) {
            this.logger.log(`Groq provider initialized (model: ${this.model})`);
        }
    }
    get isAvailable() {
        return !!this.apiKey;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.apiKey)
            throw new Error('GROQ_API_KEY not configured');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 4096,
                stream: false,
            }),
            signal: AbortSignal.timeout(60000),
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Groq API error: ${res.status} ${err.slice(0, 200)}`);
        }
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
        return { text, tokensUsed, model: this.model, provider: this.name };
    }
    async *generateStream(systemPrompt, userMessage) {
        if (!this.apiKey)
            throw new Error('GROQ_API_KEY not configured');
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                max_tokens: 4096,
                stream: true,
            }),
            signal: AbortSignal.timeout(60000),
        });
        if (!res.ok || !res.body) {
            throw new Error(`Groq stream error: ${res.status}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let totalTokens = 0;
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.startsWith('data: ') || line === 'data: [DONE]')
                    continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    const content = data.choices?.[0]?.delta?.content;
                    if (content)
                        yield { type: 'delta', text: content };
                    if (data.x_groq?.usage) {
                        totalTokens = (data.x_groq.usage.prompt_tokens || 0) +
                            (data.x_groq.usage.completion_tokens || 0);
                    }
                }
                catch { }
            }
        }
        yield { type: 'done', tokensUsed: totalTokens, model: this.model, provider: this.name };
    }
};
exports.GroqProvider = GroqProvider;
exports.GroqProvider = GroqProvider = GroqProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GroqProvider);
