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
var GeminiProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let GeminiProvider = GeminiProvider_1 = class GeminiProvider {
    config;
    name = 'gemini';
    apiKey;
    model;
    logger = new common_1.Logger(GeminiProvider_1.name);
    constructor(config) {
        this.config = config;
        this.apiKey = this.config.get('GEMINI_API_KEY');
        this.model = this.config.get('GEMINI_MODEL') || 'gemini-2.0-flash';
        if (this.apiKey) {
            this.logger.log(`Gemini provider initialized (model: ${this.model})`);
        }
    }
    get isAvailable() {
        return !!this.apiKey;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.apiKey)
            throw new Error('GEMINI_API_KEY not configured');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
        const body = JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 4096 },
        });
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body,
                    signal: AbortSignal.timeout(60000),
                });
                if (!res.ok) {
                    const err = await res.text().catch(() => '');
                    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
                        this.logger.warn(`Gemini ${res.status}, retry ${attempt + 1}/2`);
                        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                        continue;
                    }
                    throw new Error(`Gemini API error: ${res.status} ${err.slice(0, 200)}`);
                }
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const usage = data.usageMetadata || {};
                const tokensUsed = (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0);
                return { text, tokensUsed, model: this.model, provider: this.name };
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt < 2 && lastError.name !== 'AbortError') {
                    this.logger.warn(`Gemini error, retry ${attempt + 1}/2: ${lastError.message}`);
                    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    continue;
                }
            }
        }
        throw lastError || new Error('Gemini: max retries exceeded');
    }
    async *generateStream(systemPrompt, userMessage) {
        if (!this.apiKey)
            throw new Error('GEMINI_API_KEY not configured');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 4096 },
            }),
            signal: AbortSignal.timeout(60000),
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
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        yield { type: 'delta', text };
                    }
                    if (data.usageMetadata) {
                        totalTokens = (data.usageMetadata.promptTokenCount || 0) +
                            (data.usageMetadata.candidatesTokenCount || 0);
                    }
                }
                catch { }
            }
        }
        yield { type: 'done', tokensUsed: totalTokens, model: this.model, provider: this.name };
    }
};
exports.GeminiProvider = GeminiProvider;
exports.GeminiProvider = GeminiProvider = GeminiProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GeminiProvider);
