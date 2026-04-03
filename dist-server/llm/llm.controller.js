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
const usage_service_1 = require("../health/usage.service");
let LlmController = class LlmController {
    llmService;
    usageService;
    constructor(llmService, usageService) {
        this.llmService = llmService;
        this.usageService = usageService;
    }
    async transform(resumeId, dto, req) {
        if (req.user?.id) {
            await this.usageService.checkAndLog(req.user.id, 'ai_transform');
        }
        return this.llmService.transform(resumeId, dto);
    }
    transformStream(resumeId, dto) {
        return new rxjs_1.Observable((subscriber) => {
            let isAlive = true;
            let generator = null;
            const cleanup = () => {
                isAlive = false;
                if (generator?.return)
                    generator.return(undefined).catch(() => { });
            };
            const timeout = setTimeout(() => {
                if (isAlive) {
                    subscriber.next({
                        data: JSON.stringify({ type: 'error', message: '스트리밍 타임아웃 (60초)' }),
                    });
                    cleanup();
                    subscriber.complete();
                }
            }, 60000);
            (async () => {
                try {
                    generator = this.llmService.transformStream(resumeId, dto);
                    for await (const chunk of generator) {
                        if (!isAlive)
                            break;
                        subscriber.next({ data: JSON.stringify(chunk) });
                    }
                }
                catch (error) {
                    if (isAlive) {
                        subscriber.next({
                            data: JSON.stringify({ type: 'error', message: error.message }),
                        });
                    }
                }
                finally {
                    clearTimeout(timeout);
                    cleanup();
                    subscriber.complete();
                }
            })();
            return () => {
                clearTimeout(timeout);
                cleanup();
            };
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
    analyzeFeedback(resumeId, provider) {
        return this.llmService.analyzeFeedback(resumeId, provider);
    }
    analyzeJobMatch(resumeId, jobDescription, provider) {
        return this.llmService.analyzeJobMatch(resumeId, jobDescription, provider);
    }
    generateInterview(resumeId, jobRole, provider) {
        return this.llmService.generateInterviewQuestions(resumeId, jobRole, provider);
    }
    inlineAssist(text, type, provider) {
        return this.llmService.inlineAssist(text, type, provider);
    }
};
exports.LlmController = LlmController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'LLM으로 이력서 양식 변환' }),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transform_resume_dto_1.TransformResumeDto, Object]),
    __metadata("design:returntype", Promise)
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
__decorate([
    (0, common_1.Post)('feedback'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 이력서 피드백 (점수 + 강점 + 개선점)' }),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "analyzeFeedback", null);
__decorate([
    (0, common_1.Post)('job-match'),
    (0, swagger_1.ApiOperation)({ summary: 'AI JD 매칭 분석' }),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)('jobDescription')),
    __param(2, (0, common_1.Body)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "analyzeJobMatch", null);
__decorate([
    (0, common_1.Post)('interview'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 면접 질문 생성' }),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)('jobRole')),
    __param(2, (0, common_1.Body)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "generateInterview", null);
__decorate([
    (0, common_1.Post)('inline-assist'),
    (0, swagger_1.ApiOperation)({ summary: 'AI 인라인 문장 개선' }),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('type')),
    __param(2, (0, common_1.Body)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LlmController.prototype, "inlineAssist", null);
exports.LlmController = LlmController = __decorate([
    (0, swagger_1.ApiTags)('llm'),
    (0, common_1.Controller)('resumes/:resumeId/transform'),
    __metadata("design:paramtypes", [llm_service_1.LlmService,
        usage_service_1.UsageService])
], LlmController);
