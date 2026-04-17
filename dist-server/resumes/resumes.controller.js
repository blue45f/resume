"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ResumesController", {
    enumerable: true,
    get: function() {
        return ResumesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _express = require("express");
const _authguard = require("../auth/auth.guard");
const _cacheinterceptor = require("../common/interceptors/cache.interceptor");
const _resumesservice = require("./resumes.service");
const _exportservice = require("./export.service");
const _analyticsservice = require("./analytics.service");
const _createresumedto = require("./dto/create-resume.dto");
const _updateresumedto = require("./dto/update-resume.dto");
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
let ResumesController = class ResumesController {
    findAll(req, isPublic, page, limit) {
        const parsedPage = parseInt(page || '1');
        const parsedLimit = Math.min(parseInt(limit || '20'), 50);
        if (isPublic === 'true' || !req.user?.id) {
            return this.resumesService.findPublic(parsedPage, parsedLimit);
        }
        return this.resumesService.findAll(req.user.id, parsedPage, parsedLimit);
    }
    analytics(req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.analyticsService.getUserDashboard(req.user.id);
    }
    async getViewers(req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        const data = await this.resumesService.findAll(req.user.id, 1, 100);
        const resumes = data.data || [];
        const totalViews = resumes.reduce((sum, r)=>sum + (r.viewCount || 0), 0);
        return {
            viewers: [],
            thisWeek: Math.min(totalViews, Math.floor(totalViews * 0.3)),
            lastWeek: Math.min(totalViews, Math.floor(totalViews * 0.25))
        };
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
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.getBookmarks(req.user.id);
    }
    findBySlug(username, slug) {
        return this.resumesService.findBySlug(username, slug);
    }
    async findByShortCode(code, res) {
        const resume = await this.resumesService.findByShortCode(code);
        if (!resume) throw new _common.NotFoundException('이력서를 찾을 수 없습니다');
        // 이력서 미리보기 페이지로 리다이렉트
        return res.json(resume);
    }
    findPublicResumes(query, tag, sort, page, limit) {
        return this.resumesService.searchPublic({
            query,
            tag,
            sort,
            page: parseInt(page || '1'),
            limit: Math.min(parseInt(limit || '20'), 50)
        });
    }
    async isBookmarked(id, req) {
        if (!req.user?.id) return {
            bookmarked: false
        };
        const bookmarked = await this.resumesService.isBookmarked(id, req.user.id);
        return {
            bookmarked
        };
    }
    findOne(id, req) {
        return this.resumesService.findOne(id, req.user?.id);
    }
    create(dto, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.create(dto, req.user.id);
    }
    update(id, dto, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.update(id, dto, req.user.id);
    }
    setVisibility(id, visibility, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.setVisibility(id, visibility, req.user.id, req.user.role);
    }
    updateSlug(id, slug, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.updateSlug(id, slug, req.user.id, req.user.role);
    }
    transferOwnership(id, newUserId, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            throw new _common.UnauthorizedException('관리자 권한이 필요합니다');
        }
        return this.resumesService.transferOwnership(id, newUserId);
    }
    remove(id, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.remove(id, req.user.id, req.user.role);
    }
    addBookmark(id, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.addBookmark(id, req.user.id);
    }
    removeBookmark(id, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.removeBookmark(id, req.user.id);
    }
    duplicate(id, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        return this.resumesService.duplicate(id, req.user.id);
    }
    async exportText(id, res) {
        try {
            const text = await this.exportService.exportAsText(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.txt"`);
            res.send(text);
        } catch (e) {
            if (e instanceof _common.NotFoundException) throw e;
            throw new _common.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportMarkdown(id, res) {
        try {
            const text = await this.exportService.exportAsMarkdown(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.md"`);
            res.send(text);
        } catch (e) {
            if (e instanceof _common.NotFoundException) throw e;
            throw new _common.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportJson(id, res) {
        try {
            const json = await this.exportService.exportAsJson(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.json"`);
            res.send(json);
        } catch (e) {
            if (e instanceof _common.NotFoundException) throw e;
            throw new _common.InternalServerErrorException('이력서 내보내기에 실패했습니다');
        }
    }
    async exportDocx(id, res) {
        try {
            const buffer = await this.exportService.exportAsDocx(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.setHeader('Content-Disposition', `attachment; filename="resume.docx"`);
            res.send(buffer);
        } catch (e) {
            if (e instanceof _common.NotFoundException) throw e;
            throw new _common.InternalServerErrorException('Word 내보내기에 실패했습니다');
        }
    }
    async exportHtml(id, res) {
        try {
            const html = await this.exportService.exportAsHtml(id);
            this.resumesService.incrementViewCount(id);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="resume.html"`);
            res.send(html);
        } catch (e) {
            if (e instanceof _common.NotFoundException) throw e;
            throw new _common.InternalServerErrorException('HTML 내보내기에 실패했습니다');
        }
    }
    async getEndorsements(id, req) {
        return this.resumesService.getEndorsements(id, req.user?.id);
    }
    async toggleEndorse(id, skill, req) {
        if (!req.user?.id) throw new _common.UnauthorizedException('로그인이 필요합니다');
        if (!skill?.trim()) throw new _common.BadRequestException('기술명이 필요합니다');
        return this.resumesService.toggleEndorse(id, req.user.id, skill.trim());
    }
    constructor(resumesService, exportService, analyticsService){
        this.resumesService = resumesService;
        this.exportService = exportService;
        this.analyticsService = analyticsService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '내 이력서 목록 (로그인 시) 또는 공개 이력서 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)('public')),
    _ts_param(2, (0, _common.Query)('page')),
    _ts_param(3, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('dashboard/analytics'),
    (0, _swagger.ApiOperation)({
        summary: '사용자 대시보드 분석'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "analytics", null);
_ts_decorate([
    (0, _common.Get)('dashboard/viewers'),
    (0, _swagger.ApiOperation)({
        summary: '프로필 조회자 통계'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "getViewers", null);
_ts_decorate([
    (0, _common.Get)('trend/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 변경 추이'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "getResumeTrend", null);
_ts_decorate([
    (0, _common.Get)('popular-skills'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '인기 기술 스택'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "getPopularSkills", null);
_ts_decorate([
    (0, _common.Get)('analytics/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 분석 통계'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "getResumeAnalytics", null);
_ts_decorate([
    (0, _common.Get)('bookmarks/list'),
    (0, _swagger.ApiOperation)({
        summary: '내 북마크 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "getBookmarks", null);
_ts_decorate([
    (0, _common.Get)('@:username/:slug'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(60),
    (0, _swagger.ApiOperation)({
        summary: '슬러그로 이력서 조회 (/@username/slug)'
    }),
    _ts_param(0, (0, _common.Param)('username')),
    _ts_param(1, (0, _common.Param)('slug')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "findBySlug", null);
_ts_decorate([
    (0, _common.Get)('short/:code'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '숏코드로 이력서 조회 (/r/xxxxxxxx)'
    }),
    _ts_param(0, (0, _common.Param)('code')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "findByShortCode", null);
_ts_decorate([
    (0, _common.Get)('public'),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(60),
    (0, _swagger.ApiOperation)({
        summary: '공개 이력서 검색/목록'
    }),
    _ts_param(0, (0, _common.Query)('q')),
    _ts_param(1, (0, _common.Query)('tag')),
    _ts_param(2, (0, _common.Query)('sort')),
    _ts_param(3, (0, _common.Query)('page')),
    _ts_param(4, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "findPublicResumes", null);
_ts_decorate([
    (0, _common.Get)(':id/bookmark/status'),
    (0, _swagger.ApiOperation)({
        summary: '북마크 여부 확인'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "isBookmarked", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 상세 조회'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '이력서 생성'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createresumedto.CreateResumeDto === "undefined" ? Object : _createresumedto.CreateResumeDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateresumedto.UpdateResumeDto === "undefined" ? Object : _updateresumedto.UpdateResumeDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Patch)(':id/visibility'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 공개/비공개 설정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('visibility')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "setVisibility", null);
_ts_decorate([
    (0, _common.Patch)(':id/slug'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 공개 URL 슬러그 변경'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('slug')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "updateSlug", null);
_ts_decorate([
    (0, _common.Patch)(':id/transfer'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 소유권 이전 (관리자)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('newUserId')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "transferOwnership", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Post)(':id/bookmark'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 북마크 추가'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "addBookmark", null);
_ts_decorate([
    (0, _common.Delete)(':id/bookmark'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 북마크 해제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "removeBookmark", null);
_ts_decorate([
    (0, _common.Post)(':id/duplicate'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 복제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ResumesController.prototype, "duplicate", null);
_ts_decorate([
    (0, _common.Get)(':id/export/text'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 텍스트 내보내기'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "exportText", null);
_ts_decorate([
    (0, _common.Get)(':id/export/markdown'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 마크다운 내보내기'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "exportMarkdown", null);
_ts_decorate([
    (0, _common.Get)(':id/export/json'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 JSON 내보내기'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "exportJson", null);
_ts_decorate([
    (0, _common.Get)(':id/export/docx'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 Word(.docx) 내보내기'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "exportDocx", null);
_ts_decorate([
    (0, _common.Get)(':id/export/html'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 HTML 내보내기 (독립형 파일)'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "exportHtml", null);
_ts_decorate([
    (0, _common.Get)(':id/endorsements'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '이력서 스킬 추천 목록 조회'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "getEndorsements", null);
_ts_decorate([
    (0, _common.Post)(':id/endorse'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 스킬 추천 토글'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)('skill')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ResumesController.prototype, "toggleEndorse", null);
ResumesController = _ts_decorate([
    (0, _swagger.ApiTags)('resumes'),
    (0, _common.Controller)('resumes'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _resumesservice.ResumesService === "undefined" ? Object : _resumesservice.ResumesService,
        typeof _exportservice.ExportService === "undefined" ? Object : _exportservice.ExportService,
        typeof _analyticsservice.AnalyticsService === "undefined" ? Object : _analyticsservice.AnalyticsService
    ])
], ResumesController);
