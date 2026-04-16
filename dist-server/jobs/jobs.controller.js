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
exports.JobsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const jobs_service_1 = require("./jobs.service");
let JobsController = class JobsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query, status) {
        return this.service.findAll(status || 'active', query);
    }
    findMy(req) {
        if (!req.user?.id)
            return [];
        return this.service.findByUser(req.user.id);
    }
    getExternalLinks(category, companySize, careerLevel, jobType, location, jobCategory, q) {
        return this.service.getExternalLinks({ category, companySize, careerLevel, jobType, location, jobCategory, q });
    }
    createExternalLink(body, req) {
        return this.service.createExternalLink(body, req.user?.role);
    }
    recordClick(id) {
        return this.service.recordExternalLinkClick(id);
    }
    updateExternalLink(id, body, req) {
        return this.service.updateExternalLink(id, body, req.user?.role);
    }
    deleteExternalLink(id, req) {
        return this.service.deleteExternalLink(id, req.user?.role);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    create(body, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.create(req.user.id, body);
    }
    update(id, body, req) {
        return this.service.update(id, req.user?.id, body);
    }
    remove(id, req) {
        return this.service.remove(id, req.user?.id, req.user?.role);
    }
};
exports.JobsController = JobsController;
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '채용 공고 목록' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: '내 채용 공고' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "findMy", null);
__decorate([
    (0, common_1.Get)('external-links/list'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '외부 채용 링크 목록 (필터 지원)' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('companySize')),
    __param(2, (0, common_1.Query)('careerLevel')),
    __param(3, (0, common_1.Query)('jobType')),
    __param(4, (0, common_1.Query)('location')),
    __param(5, (0, common_1.Query)('jobCategory')),
    __param(6, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "getExternalLinks", null);
__decorate([
    (0, common_1.Post)('external-links'),
    (0, swagger_1.ApiOperation)({ summary: '[어드민] 외부 채용 링크 등록' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "createExternalLink", null);
__decorate([
    (0, common_1.Post)('external-links/:id/click'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '외부 채용 링크 클릭 추적 + URL 반환' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "recordClick", null);
__decorate([
    (0, common_1.Put)('external-links/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[어드민] 외부 채용 링크 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "updateExternalLink", null);
__decorate([
    (0, common_1.Delete)('external-links/:id'),
    (0, swagger_1.ApiOperation)({ summary: '[어드민] 외부 채용 링크 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "deleteExternalLink", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '채용 공고 상세' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '채용 공고 등록' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '채용 공고 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '채용 공고 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], JobsController.prototype, "remove", null);
exports.JobsController = JobsController = __decorate([
    (0, swagger_1.ApiTags)('jobs'),
    (0, common_1.Controller)('jobs'),
    __metadata("design:paramtypes", [jobs_service_1.JobsService])
], JobsController);
