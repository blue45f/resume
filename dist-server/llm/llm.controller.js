"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LlmController", {
    enumerable: true,
    get: function() {
        return LlmController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _rxjs = require("rxjs");
const _llmservice = require("./llm.service");
const _transformresumedto = require("./dto/transform-resume.dto");
const _analysisdto = require("./dto/analysis.dto");
const _usageservice = require("../health/usage.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let LlmController = class LlmController {
    async transform(resumeId, dto, req) {
        if (req.user?.id) {
            await this.usageService.checkAndLog(req.user.id, 'ai_transform');
        }
        return this.llmService.transform(resumeId, dto);
    }
    transformStream(resumeId, dto) {
        return new _rxjs.Observable((subscriber)=>{
            let isAlive = true;
            let generator = null;
            const cleanup = ()=>{
                isAlive = false;
                if (generator?.return) generator.return(undefined).catch(()=>{});
            };
            const timeout = setTimeout(()=>{
                if (isAlive) {
                    subscriber.next({
                        data: JSON.stringify({
                            type: 'error',
                            message: '스트리밍 타임아웃 (60초)'
                        })
                    });
                    cleanup();
                    subscriber.complete();
                }
            }, 60000);
            (async ()=>{
                try {
                    generator = this.llmService.transformStream(resumeId, dto);
                    for await (const chunk of generator){
                        if (!isAlive) break;
                        subscriber.next({
                            data: JSON.stringify(chunk)
                        });
                    }
                } catch (error) {
                    if (isAlive) {
                        subscriber.next({
                            data: JSON.stringify({
                                type: 'error',
                                message: error.message
                            })
                        });
                    }
                } finally{
                    clearTimeout(timeout);
                    cleanup();
                    subscriber.complete();
                }
            })();
            // 클라이언트 연결 해제 시 cleanup
            return ()=>{
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
    // ===== AI 분석 기능 =====
    analyzeFeedback(resumeId, dto) {
        return this.llmService.analyzeFeedback(resumeId, dto.provider);
    }
    analyzeJobMatch(resumeId, dto) {
        return this.llmService.analyzeJobMatch(resumeId, dto.jobDescription, dto.provider);
    }
    generateInterview(resumeId, dto) {
        return this.llmService.generateInterviewQuestions(resumeId, dto.jobRole, dto.provider, dto.jobDescription, dto.difficulty);
    }
    inlineAssist(dto) {
        return this.llmService.inlineAssist(dto.text, dto.type, dto.provider);
    }
    constructor(llmService, usageService){
        this.llmService = llmService;
        this.usageService = usageService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: 'LLM으로 이력서 양식 변환'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 5,
            ttl: 60000
        }
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _transformresumedto.TransformResumeDto === "undefined" ? Object : _transformresumedto.TransformResumeDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], LlmController.prototype, "transform", null);
_ts_decorate([
    (0, _common.Post)('stream'),
    (0, _swagger.ApiOperation)({
        summary: 'LLM 양식 변환 (스트리밍)'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _common.Sse)(),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _transformresumedto.TransformResumeDto === "undefined" ? Object : _transformresumedto.TransformResumeDto
    ]),
    _ts_metadata("design:returntype", typeof _rxjs.Observable === "undefined" ? Object : _rxjs.Observable)
], LlmController.prototype, "transformStream", null);
_ts_decorate([
    (0, _common.Get)('history'),
    (0, _swagger.ApiOperation)({
        summary: 'LLM 변환 이력 조회'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "getHistory", null);
_ts_decorate([
    (0, _common.Get)('providers'),
    (0, _swagger.ApiOperation)({
        summary: '사용 가능한 LLM 프로바이더 목록'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "getProviders", null);
_ts_decorate([
    (0, _common.Get)('usage'),
    (0, _swagger.ApiOperation)({
        summary: 'LLM 사용량 통계'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "getUsage", null);
_ts_decorate([
    (0, _common.Post)('feedback'),
    (0, _swagger.ApiOperation)({
        summary: 'AI 이력서 피드백 (점수 + 강점 + 개선점)'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 60000
        }
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _analysisdto.FeedbackDto === "undefined" ? Object : _analysisdto.FeedbackDto
    ]),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "analyzeFeedback", null);
_ts_decorate([
    (0, _common.Post)('job-match'),
    (0, _swagger.ApiOperation)({
        summary: 'AI JD 매칭 분석'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 60000
        }
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _analysisdto.JobMatchDto === "undefined" ? Object : _analysisdto.JobMatchDto
    ]),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "analyzeJobMatch", null);
_ts_decorate([
    (0, _common.Post)('interview'),
    (0, _swagger.ApiOperation)({
        summary: 'AI 면접 질문 생성'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 3,
            ttl: 60000
        }
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _analysisdto.InterviewDto === "undefined" ? Object : _analysisdto.InterviewDto
    ]),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "generateInterview", null);
_ts_decorate([
    (0, _common.Post)('inline-assist'),
    (0, _swagger.ApiOperation)({
        summary: 'AI 인라인 문장 개선'
    }),
    (0, _throttler.Throttle)({
        default: {
            limit: 10,
            ttl: 60000
        }
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _analysisdto.InlineAssistDto === "undefined" ? Object : _analysisdto.InlineAssistDto
    ]),
    _ts_metadata("design:returntype", void 0)
], LlmController.prototype, "inlineAssist", null);
LlmController = _ts_decorate([
    (0, _swagger.ApiTags)('llm'),
    (0, _common.Controller)('resumes/:resumeId/transform'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _llmservice.LlmService === "undefined" ? Object : _llmservice.LlmService,
        typeof _usageservice.UsageService === "undefined" ? Object : _usageservice.UsageService
    ])
], LlmController);
