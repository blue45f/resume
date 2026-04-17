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
exports.JobInterviewQuestionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const job_interview_questions_service_1 = require("./job-interview-questions.service");
let JobInterviewQuestionsController = class JobInterviewQuestionsController {
    service;
    constructor(service) {
        this.service = service;
    }
    list(company, position, jobPostId, curatedJobId, limit, req) {
        return this.service.list({
            company,
            position,
            jobPostId,
            curatedJobId,
            limit: limit ? parseInt(limit, 10) : undefined,
        }, req.user?.id ?? null);
    }
    create(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.create(req.user.id, body);
    }
    upvote(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.toggleUpvote(id, req.user.id);
    }
    remove(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.remove(id, req.user.id, req.user.role);
    }
    aiGenerate(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.aiGenerate(req.user.id, body);
    }
};
exports.JobInterviewQuestionsController = JobInterviewQuestionsController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '공고별 예상 면접 질문 목록' }),
    __param(0, (0, common_1.Query)('company')),
    __param(1, (0, common_1.Query)('position')),
    __param(2, (0, common_1.Query)('jobPostId')),
    __param(3, (0, common_1.Query)('curatedJobId')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], JobInterviewQuestionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '예상 면접 질문 등록' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JobInterviewQuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/upvote'),
    (0, swagger_1.ApiOperation)({ summary: '예상 면접 질문 upvote 토글' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobInterviewQuestionsController.prototype, "upvote", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '예상 면접 질문 삭제 (작성자 또는 관리자)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobInterviewQuestionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('ai-generate'),
    (0, swagger_1.ApiOperation)({ summary: 'AI로 예상 면접 질문 생성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JobInterviewQuestionsController.prototype, "aiGenerate", null);
exports.JobInterviewQuestionsController = JobInterviewQuestionsController = __decorate([
    (0, swagger_1.ApiTags)('job-interview-questions'),
    (0, common_1.Controller)('job-interview-questions'),
    __metadata("design:paramtypes", [job_interview_questions_service_1.JobInterviewQuestionsService])
], JobInterviewQuestionsController);
