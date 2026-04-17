"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JobsController", {
    enumerable: true,
    get: function() {
        return JobsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _authguard = require("../auth/auth.guard");
const _jobsservice = require("./jobs.service");
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
let JobsController = class JobsController {
    // ── 정적 경로는 반드시 :id 앞에 위치해야 함 ──────────────────────────
    findAll(query, status) {
        return this.service.findAll(status || 'active', query);
    }
    async getStats(location, type, skill) {
        return this.service.getJobStats(location, type, skill);
    }
    findMy(req) {
        if (!req.user?.id) return [];
        return this.service.findByUser(req.user.id);
    }
    // ── External Job Links (정적 경로 — :id 앞에 반드시 위치) ───────────
    getExternalLinks(category, companySize, careerLevel, jobType, location, jobCategory, q) {
        return this.service.getExternalLinks({
            category,
            companySize,
            careerLevel,
            jobType,
            location,
            jobCategory,
            q
        });
    }
    createExternalLink(body, req) {
        return this.service.createExternalLink(body, {
            id: req.user?.id,
            role: req.user?.role,
            userType: req.user?.userType
        });
    }
    recordClick(id) {
        return this.service.recordExternalLinkClick(id);
    }
    updateExternalLink(id, body, req) {
        return this.service.updateExternalLink(id, body, {
            id: req.user?.id,
            role: req.user?.role,
            userType: req.user?.userType
        });
    }
    deleteExternalLink(id, req) {
        return this.service.deleteExternalLink(id, {
            id: req.user?.id,
            role: req.user?.role,
            userType: req.user?.userType
        });
    }
    // ── Curated Jobs (외부 채용 정보 카드) ───────────────────────────────
    getCuratedJobs(jobType, experienceLevel, companySize, industry, location, q, page, limit) {
        return this.service.getCuratedJobs({
            jobType,
            experienceLevel,
            companySize,
            industry,
            location,
            q,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
    }
    getCuratedJob(id) {
        return this.service.getCuratedJob(id);
    }
    createCuratedJob(body, req) {
        return this.service.createCuratedJob(body, req.user?.id, req.user?.role, req.user?.userType);
    }
    updateCuratedJob(id, body, req) {
        return this.service.updateCuratedJob(id, body, req.user?.id, req.user?.role, req.user?.userType);
    }
    deleteCuratedJob(id, req) {
        return this.service.deleteCuratedJob(id, req.user?.id, req.user?.role, req.user?.userType);
    }
    recordCuratedJobClick(id) {
        return this.service.recordCuratedJobClick(id);
    }
    // ── 동적 :id 경로 — 반드시 정적 경로 뒤에 위치 ─────────────────────
    findOne(id) {
        return this.service.findOne(id);
    }
    create(body, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.create(req.user.id, body);
    }
    update(id, body, req) {
        return this.service.update(id, req.user?.id, body);
    }
    remove(id, req) {
        return this.service.remove(id, req.user?.id, req.user?.role);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '채용 공고 목록'
    }),
    _ts_param(0, (0, _common.Query)('q')),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('stats'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '채용 통계'
    }),
    _ts_param(0, (0, _common.Query)('location')),
    _ts_param(1, (0, _common.Query)('type')),
    _ts_param(2, (0, _common.Query)('skill')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], JobsController.prototype, "getStats", null);
_ts_decorate([
    (0, _common.Get)('my'),
    (0, _swagger.ApiOperation)({
        summary: '내 채용 공고'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "findMy", null);
_ts_decorate([
    (0, _common.Get)('external-links/list'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '외부 채용 링크 목록 (필터 지원)'
    }),
    _ts_param(0, (0, _common.Query)('category')),
    _ts_param(1, (0, _common.Query)('companySize')),
    _ts_param(2, (0, _common.Query)('careerLevel')),
    _ts_param(3, (0, _common.Query)('jobType')),
    _ts_param(4, (0, _common.Query)('location')),
    _ts_param(5, (0, _common.Query)('jobCategory')),
    _ts_param(6, (0, _common.Query)('q')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "getExternalLinks", null);
_ts_decorate([
    (0, _common.Post)('external-links'),
    (0, _swagger.ApiOperation)({
        summary: '외부 채용 링크 등록'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "createExternalLink", null);
_ts_decorate([
    (0, _common.Post)('external-links/:id/click'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '외부 채용 링크 클릭 추적 + URL 반환'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "recordClick", null);
_ts_decorate([
    (0, _common.Put)('external-links/:id'),
    (0, _swagger.ApiOperation)({
        summary: '외부 채용 링크 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "updateExternalLink", null);
_ts_decorate([
    (0, _common.Delete)('external-links/:id'),
    (0, _swagger.ApiOperation)({
        summary: '외부 채용 링크 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "deleteExternalLink", null);
_ts_decorate([
    (0, _common.Get)('curated/list'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 정보 목록'
    }),
    _ts_param(0, (0, _common.Query)('jobType')),
    _ts_param(1, (0, _common.Query)('experienceLevel')),
    _ts_param(2, (0, _common.Query)('companySize')),
    _ts_param(3, (0, _common.Query)('industry')),
    _ts_param(4, (0, _common.Query)('location')),
    _ts_param(5, (0, _common.Query)('q')),
    _ts_param(6, (0, _common.Query)('page')),
    _ts_param(7, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "getCuratedJobs", null);
_ts_decorate([
    (0, _common.Get)('curated/:id'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 정보 상세'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "getCuratedJob", null);
_ts_decorate([
    (0, _common.Post)('curated'),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 정보 등록 (관리자/채용담당자)'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "createCuratedJob", null);
_ts_decorate([
    (0, _common.Put)('curated/:id'),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 정보 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "updateCuratedJob", null);
_ts_decorate([
    (0, _common.Delete)('curated/:id'),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 정보 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "deleteCuratedJob", null);
_ts_decorate([
    (0, _common.Post)('curated/:id/click'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '큐레이션 채용 클릭 추적'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "recordCuratedJobClick", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '채용 공고 상세'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '채용 공고 등록'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '채용 공고 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '채용 공고 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], JobsController.prototype, "remove", null);
JobsController = _ts_decorate([
    (0, _swagger.ApiTags)('jobs'),
    (0, _common.Controller)('jobs'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jobsservice.JobsService === "undefined" ? Object : _jobsservice.JobsService
    ])
], JobsController);
