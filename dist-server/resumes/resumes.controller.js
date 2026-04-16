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
exports.ResumesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const cache_interceptor_1 = require("../common/interceptors/cache.interceptor");
const resumes_service_1 = require("./resumes.service");
const export_service_1 = require("./export.service");
const analytics_service_1 = require("./analytics.service");
const create_resume_dto_1 = require("./dto/create-resume.dto");
const update_resume_dto_1 = require("./dto/update-resume.dto");
let ResumesController = class ResumesController {
    resumesService;
    exportService;
    analyticsService;
    constructor(resumesService, exportService, analyticsService) {
        this.resumesService = resumesService;
        this.exportService = exportService;
        this.analyticsService = analyticsService;
    }
    findAll(req, isPublic, page, limit) {
        const parsedPage = parseInt(page || '1');
        const parsedLimit = Math.min(parseInt(limit || '20'), 50);
        if (isPublic === 'true' || !req.user?.id) {
            return this.resumesService.findPublic(parsedPage, parsedLimit);
        }
        return this.resumesService.findAll(req.user.id, parsedPage, parsedLimit);
    }
    analytics(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.analyticsService.getUserDashboard(req.user.id);
    }
    getResumeTrend(resumeId) {
        return this.analyticsService.getResumeTrend(resumeId);
    }
    getPopularSkills() {
        return this.analyticsService.getPopularSkills();
    }
    getResumeAnalytics(resumeId) {
        return this.analyticsService.getResumeAnalytics(resumeId);
    }
    getBookmarks(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.getBookmarks(req.user.id);
    }
    findBySlug(username, slug) {
        return this.resumesService.findBySlug(username, slug);
    }
    async findByShortCode(code, res) {
        const resume = await this.resumesService.findByShortCode(code);
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        return res.json(resume);
    }
    findPublicResumes(query, tag, sort, page, limit) {
        return this.resumesService.searchPublic({
            query, tag, sort,
            page: parseInt(page || '1'),
            limit: Math.min(parseInt(limit || '20'), 50),
        });
    }
    async isBookmarked(id, req) {
        if (!req.user?.id)
            return { bookmarked: false };
        const bookmarked = await this.resumesService.isBookmarked(id, req.user.id);
        return { bookmarked };
    }
    findOne(id, req) {
        return this.resumesService.findOne(id, req.user?.id);
    }
    create(dto, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.create(dto, req.user.id);
    }
    update(id, dto, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.update(id, dto, req.user.id);
    }
    setVisibility(id, visibility, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.setVisibility(id, visibility, req.user.id, req.user.role);
    }
    updateSlug(id, slug, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.updateSlug(id, slug, req.user.id, req.user.role);
    }
    transferOwnership(id, newUserId, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new common_1.UnauthorizedException('관리자 권한이 필요합니다');
        }
        return this.resumesService.transferOwnership(id, newUserId);
    }
    remove(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.remove(id, req.user.id, req.user.role);
    }
    addBookmark(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.addBookmark(id, req.user.id);
    }
    removeBookmark(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.removeBookmark(id, req.user.id);
    }
    duplicate(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.duplicate(id, req.user.id);
    }
    async exportText(id, res) {
        try {
            const text = await this.exportService.exportAsText(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.txt"`);
            res.send(text);
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                throw e;
            throw new common_1.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportMarkdown(id, res) {
        try {
            const text = await this.exportService.exportAsMarkdown(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.md"`);
            res.send(text);
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                throw e;
            throw new common_1.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportJson(id, res) {
        try {
            const json = await this.exportService.exportAsJson(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.json"`);
            res.send(json);
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                throw e;
            throw new common_1.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportDocx(id, res) {
        try {
            const buffer = await this.exportService.exportAsDocx(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="resume.docx"`);
            res.send(buffer);
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                throw e;
            throw new common_1.InternalServerErrorException('Word 내보내기에 실패했습니다');
        }
    }
};
exports.ResumesController = ResumesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '내 이력서 목록 (로그인 시) 또는 공개 이력서 목록' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('public')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('dashboard/analytics'),
    (0, swagger_1.ApiOperation)({ summary: '사용자 대시보드 분석' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "analytics", null);
__decorate([
    (0, common_1.Get)('trend/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 변경 추이' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "getResumeTrend", null);
__decorate([
    (0, common_1.Get)('popular-skills'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '인기 기술 스택' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "getPopularSkills", null);
__decorate([
    (0, common_1.Get)('analytics/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 분석 통계' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "getResumeAnalytics", null);
__decorate([
    (0, common_1.Get)('bookmarks/list'),
    (0, swagger_1.ApiOperation)({ summary: '내 북마크 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "getBookmarks", null);
__decorate([
    (0, common_1.Get)('@:username/:slug'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(60),
    (0, swagger_1.ApiOperation)({ summary: '슬러그로 이력서 조회 (/@username/slug)' }),
    __param(0, (0, common_1.Param)('username')),
    __param(1, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Get)('short/:code'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '숏코드로 이력서 조회 (/r/xxxxxxxx)' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "findByShortCode", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, auth_guard_1.Public)(),
    (0, cache_interceptor_1.CacheTTL)(60),
    (0, swagger_1.ApiOperation)({ summary: '공개 이력서 검색/목록' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('tag')),
    __param(2, (0, common_1.Query)('sort')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findPublicResumes", null);
__decorate([
    (0, common_1.Get)(':id/bookmark/status'),
    (0, swagger_1.ApiOperation)({ summary: '북마크 여부 확인' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "isBookmarked", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '이력서 생성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resume_dto_1.CreateResumeDto, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resume_dto_1.UpdateResumeDto, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/visibility'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 공개/비공개 설정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('visibility')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "setVisibility", null);
__decorate([
    (0, common_1.Patch)(':id/slug'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 공개 URL 슬러그 변경' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('slug')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "updateSlug", null);
__decorate([
    (0, common_1.Patch)(':id/transfer'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 소유권 이전 (관리자)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('newUserId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "transferOwnership", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/bookmark'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 북마크 추가' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "addBookmark", null);
__decorate([
    (0, common_1.Delete)(':id/bookmark'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 북마크 해제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "removeBookmark", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 복제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "duplicate", null);
__decorate([
    (0, common_1.Get)(':id/export/text'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 텍스트 내보내기' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "exportText", null);
__decorate([
    (0, common_1.Get)(':id/export/markdown'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 마크다운 내보내기' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "exportMarkdown", null);
__decorate([
    (0, common_1.Get)(':id/export/json'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 JSON 내보내기' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "exportJson", null);
__decorate([
    (0, common_1.Get)(':id/export/docx'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 Word(.docx) 내보내기' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ResumesController.prototype, "exportDocx", null);
exports.ResumesController = ResumesController = __decorate([
    (0, swagger_1.ApiTags)('resumes'),
    (0, common_1.Controller)('resumes'),
    __metadata("design:paramtypes", [resumes_service_1.ResumesService,
        export_service_1.ExportService,
        analytics_service_1.AnalyticsService])
], ResumesController);
