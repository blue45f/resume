"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CoverLettersController", {
    enumerable: true,
    get: function() {
        return CoverLettersController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _coverlettersservice = require("./cover-letters.service");
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
let CoverLettersController = class CoverLettersController {
    findAll(req) {
        if (!req.user?.id) return [];
        return this.service.findAll(req.user.id);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user?.id);
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
        return this.service.remove(id, req.user?.id);
    }
    getByResume(resumeId, req) {
        if (!req.user?.id) return [];
        return this.service.getByResume(resumeId, req.user.id);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '내 자소서 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CoverLettersController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '자소서 상세'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CoverLettersController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '자소서 저장'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CoverLettersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '자소서 수정'
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
], CoverLettersController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '자소서 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CoverLettersController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Get)('resume/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '이력서별 자소서 목록'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], CoverLettersController.prototype, "getByResume", null);
CoverLettersController = _ts_decorate([
    (0, _swagger.ApiTags)('cover-letters'),
    (0, _common.Controller)('cover-letters'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _coverlettersservice.CoverLettersService === "undefined" ? Object : _coverlettersservice.CoverLettersService
    ])
], CoverLettersController);
