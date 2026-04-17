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
exports.ForbiddenWordsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const forbidden_words_service_1 = require("./forbidden-words.service");
let ForbiddenWordsController = class ForbiddenWordsController {
    service;
    constructor(service) {
        this.service = service;
    }
    isAdmin(req) {
        return req.user?.role === 'admin' || req.user?.role === 'superadmin';
    }
    findAll(category, search, page = '1', limit = '50', req) {
        if (!this.isAdmin(req))
            return { items: [], total: 0 };
        return this.service.findAll(category, search, parseInt(page), parseInt(limit));
    }
    getStats(req) {
        if (!this.isAdmin(req))
            return {};
        return this.service.getStats();
    }
    getCategories(req) {
        if (!this.isAdmin(req))
            return [];
        return this.service.getCategories();
    }
    check(body) {
        return this.service.checkContent(body.text);
    }
    create(body, req) {
        if (!this.isAdmin(req))
            return { error: '권한이 없습니다' };
        return this.service.create(body.word, body.category || 'general', body.severity || 'block', req.user?.id);
    }
    createBulk(body, req) {
        if (!this.isAdmin(req))
            return { error: '권한이 없습니다' };
        return this.service.createBulk(body.words, body.category || 'general', body.severity || 'block', req.user?.id);
    }
    update(id, body, req) {
        if (!this.isAdmin(req))
            return { error: '권한이 없습니다' };
        return this.service.update(id, body);
    }
    removeBulk(body, req) {
        if (!this.isAdmin(req))
            return { error: '권한이 없습니다' };
        return this.service.removeBulk(body.ids);
    }
    remove(id, req) {
        if (!this.isAdmin(req))
            return { error: '권한이 없습니다' };
        return this.service.remove(id);
    }
};
exports.ForbiddenWordsController = ForbiddenWordsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 목록 (관리자)' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 통계' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 카테고리 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)('check'),
    (0, swagger_1.ApiOperation)({ summary: '콘텐츠 금칙어 검사' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "check", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 등록' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 일괄 등록' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 일괄 삭제' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "removeBulk", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '금칙어 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "remove", null);
exports.ForbiddenWordsController = ForbiddenWordsController = __decorate([
    (0, swagger_1.ApiTags)('forbidden-words'),
    (0, common_1.Controller)('forbidden-words'),
    __metadata("design:paramtypes", [forbidden_words_service_1.ForbiddenWordsService])
], ForbiddenWordsController);
