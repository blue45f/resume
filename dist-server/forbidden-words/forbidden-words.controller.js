"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ForbiddenWordsController", {
    enumerable: true,
    get: function() {
        return ForbiddenWordsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _forbiddenwordsservice = require("./forbidden-words.service");
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
let ForbiddenWordsController = class ForbiddenWordsController {
    isAdmin(req) {
        return req.user?.role === 'admin' || req.user?.role === 'superadmin';
    }
    findAll(category, search, page = '1', limit = '50', req) {
        if (!this.isAdmin(req)) return {
            items: [],
            total: 0
        };
        return this.service.findAll(category, search, parseInt(page), parseInt(limit));
    }
    getStats(req) {
        if (!this.isAdmin(req)) return {};
        return this.service.getStats();
    }
    getCategories(req) {
        if (!this.isAdmin(req)) return [];
        return this.service.getCategories();
    }
    check(body) {
        return this.service.checkContent(body.text);
    }
    create(body, req) {
        if (!this.isAdmin(req)) return {
            error: '권한이 없습니다'
        };
        return this.service.create(body.word, body.category || 'general', body.severity || 'block', req.user?.id);
    }
    createBulk(body, req) {
        if (!this.isAdmin(req)) return {
            error: '권한이 없습니다'
        };
        return this.service.createBulk(body.words, body.category || 'general', body.severity || 'block', req.user?.id);
    }
    update(id, body, req) {
        if (!this.isAdmin(req)) return {
            error: '권한이 없습니다'
        };
        return this.service.update(id, body);
    }
    removeBulk(body, req) {
        if (!this.isAdmin(req)) return {
            error: '권한이 없습니다'
        };
        return this.service.removeBulk(body.ids);
    }
    remove(id, req) {
        if (!this.isAdmin(req)) return {
            error: '권한이 없습니다'
        };
        return this.service.remove(id);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 목록 (관리자)'
    }),
    _ts_param(0, (0, _common.Query)('category')),
    _ts_param(1, (0, _common.Query)('search')),
    _ts_param(2, (0, _common.Query)('page')),
    _ts_param(3, (0, _common.Query)('limit')),
    _ts_param(4, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        void 0,
        void 0,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('stats'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 통계'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "getStats", null);
_ts_decorate([
    (0, _common.Get)('categories'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 카테고리 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "getCategories", null);
_ts_decorate([
    (0, _common.Post)('check'),
    (0, _swagger.ApiOperation)({
        summary: '콘텐츠 금칙어 검사'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "check", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 등록'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Post)('bulk'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 일괄 등록'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "createBulk", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 수정'
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
], ForbiddenWordsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)('bulk'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 일괄 삭제'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "removeBulk", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '금칙어 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ForbiddenWordsController.prototype, "remove", null);
ForbiddenWordsController = _ts_decorate([
    (0, _swagger.ApiTags)('forbidden-words'),
    (0, _common.Controller)('forbidden-words'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _forbiddenwordsservice.ForbiddenWordsService === "undefined" ? Object : _forbiddenwordsservice.ForbiddenWordsService
    ])
], ForbiddenWordsController);
