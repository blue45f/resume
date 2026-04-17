"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "N8nWebhookProvider", {
    enumerable: true,
    get: function() {
        return N8nWebhookProvider;
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
let N8nWebhookProvider = class N8nWebhookProvider {
    get isAvailable() {
        return !!this.webhookUrl;
    }
    async generate(systemPrompt, userMessage) {
        if (!this.webhookUrl) throw new Error('N8N_WEBHOOK_URL not configured');
        const response = await fetch(this.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                systemPrompt,
                userMessage
            }),
            signal: AbortSignal.timeout(60000)
        });
        if (!response.ok) {
            throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return {
            text: data.text || data.output || '',
            tokensUsed: data.tokensUsed || 0,
            model: data.model || 'n8n-workflow',
            provider: this.name
        };
    }
    async *generateStream(systemPrompt, userMessage) {
        // n8n webhook은 기본적으로 스트리밍을 지원하지 않으므로
        // 전체 응답을 받은 후 청크로 나누어 전달
        const result = await this.generate(systemPrompt, userMessage);
        // Simulate streaming by splitting into chunks
        const chunkSize = 50;
        for(let i = 0; i < result.text.length; i += chunkSize){
            yield {
                type: 'delta',
                text: result.text.slice(i, i + chunkSize)
            };
        }
        yield {
            type: 'done',
            tokensUsed: result.tokensUsed,
            model: result.model,
            provider: this.name
        };
    }
    constructor(config){
        this.config = config;
        this.name = 'n8n';
        this.logger = new _common.Logger(N8nWebhookProvider.name);
        this.webhookUrl = this.config.get('N8N_WEBHOOK_URL');
        if (this.webhookUrl) {
            this.logger.log(`n8n provider initialized: ${this.webhookUrl}`);
        }
    }
};
N8nWebhookProvider = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], N8nWebhookProvider);
