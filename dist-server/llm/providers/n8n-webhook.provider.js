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
var N8nWebhookProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nWebhookProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let N8nWebhookProvider = N8nWebhookProvider_1 = class N8nWebhookProvider {
    config;
    name = 'n8n';
    webhookUrl;
    logger = new common_1.Logger(N8nWebhookProvider_1.name);
    constructor(config) {
        this.config = config;
        this.webhookUrl = this.config.get('N8N_WEBHOOK_URL');
        if (this.webhookUrl) {
            this.logger.log(`n8n provider initialized: ${this.webhookUrl}`);
        }
    }
    get isAvailable() {
        return !!this.webhookUrl;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.webhookUrl)
            throw new Error('N8N_WEBHOOK_URL not configured');
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt, userMessage }),
            signal: AbortSignal.timeout(60000),
        });
        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            text: data.text || data.output || '',
            tokensUsed: data.tokensUsed || 0,
            model: data.model || 'n8n-workflow',
            provider: this.name,
        };
    }
    async *generateStream(systemPrompt, userMessage) {
        const result = await this.generate(systemPrompt, userMessage);
        const chunkSize = 50;
        for (let i = 0; i < result.text.length; i += chunkSize) {
            yield {
                type: 'delta',
                text: result.text.slice(i, i + chunkSize),
            };
        }
        yield {
            type: 'done',
            tokensUsed: result.tokensUsed,
            model: result.model,
            provider: this.name,
        };
    }
};
exports.N8nWebhookProvider = N8nWebhookProvider;
exports.N8nWebhookProvider = N8nWebhookProvider = N8nWebhookProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], N8nWebhookProvider);
