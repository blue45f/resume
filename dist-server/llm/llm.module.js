"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LlmModule", {
    enumerable: true,
    get: function() {
        return LlmModule;
    }
});
const _common = require("@nestjs/common");
const _llmcontroller = require("./llm.controller");
const _autogeneratecontroller = require("./auto-generate.controller");
const _llmservice = require("./llm.service");
const _usageservice = require("../health/usage.service");
const _resumesmodule = require("../resumes/resumes.module");
const _prismamodule = require("../prisma/prisma.module");
const _anthropicprovider = require("./providers/anthropic.provider");
const _geminiprovider = require("./providers/gemini.provider");
const _groqprovider = require("./providers/groq.provider");
const _n8nwebhookprovider = require("./providers/n8n-webhook.provider");
const _openaicompatibleprovider = require("./providers/openai-compatible.provider");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let LlmModule = class LlmModule {
};
LlmModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _resumesmodule.ResumesModule,
            _prismamodule.PrismaModule
        ],
        controllers: [
            _llmcontroller.LlmController,
            _autogeneratecontroller.AutoGenerateController
        ],
        providers: [
            _llmservice.LlmService,
            _usageservice.UsageService,
            _anthropicprovider.AnthropicProvider,
            _geminiprovider.GeminiProvider,
            _groqprovider.GroqProvider,
            _n8nwebhookprovider.N8nWebhookProvider,
            _openaicompatibleprovider.OpenAiCompatibleProvider
        ],
        exports: [
            _llmservice.LlmService
        ]
    })
], LlmModule);
