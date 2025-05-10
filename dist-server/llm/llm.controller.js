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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const rxjs_1 = require("rxjs");
const llm_service_1 = require("./llm.service");
const transform_resume_dto_1 = require("./dto/transform-resume.dto");
let LlmController = class LlmController {
    llmService;
    constructor(llmService) {
        this.llmService = llmService;
    }
    transform(resumeId, dto) {
        return this.llmService.transform(resumeId, dto);
    }
    transformStream(resumeId, dto) {
        return new rxjs_1.Observable((subscriber) => {
            const timeout = setTimeout(() => {
                subscriber.next({
                    data: JSON.stringify({ type: 'error', message: '스트리밍 타임아웃 (60초)' }),
                });
                subscriber.complete();
            }, 60000);
            (async () => {
                try {
                    for await (const chunk of this.llmService.transformStream(resumeId, dto)) {
                        subscriber.next({ data: JSON.stringify(chunk) });
                    }
                }
                catch (error) {
                    subscriber.next({
                        data: JSON.stringify({ type: 'error', message: error.message }),
                    });
                }
                finally {
                    clearTimeout(timeout);
                    subscriber.complete();
                }
            })();
        });
    }
    getHistory(resumeId) {
        return this.llmService.getTransformationHistory(resumeId);
    }
    getProviders() {
        return this.llmService.getAvailableProviders();
    }
    getUsage() {
        return this.llmService.getUsageStats();
    }
};
exports.LlmController = LlmController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'LLM으로 이력서 양식 변환' }),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transform_resume_dto_1.TransformResumeDto]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "transform", null);
__decorate([
    (0, common_1.Post)('stream'),
    (0, swagger_1.ApiOperation)({ summary: 'LLM 양식 변환 (스트리밍)' }),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    (0, common_1.Sse)(),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transform_resume_dto_1.TransformResumeDto]),
    __metadata("design:returntype", rxjs_1.Observable)
], LlmController.prototype, "transformStream", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'LLM 변환 이력 조회' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: '사용 가능한 LLM 프로바이더 목록' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('usage'),
    (0, swagger_1.ApiOperation)({ summary: 'LLM 사용량 통계' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "getUsage", null);
exports.LlmController = LlmController = __decorate([
    (0, swagger_1.ApiTags)('llm'),
    (0, common_1.Controller)('resumes/:resumeId/transform'),
    __metadata("design:paramtypes", [llm_service_1.LlmService])
], LlmController);
