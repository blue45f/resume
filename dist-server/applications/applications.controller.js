"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ApplicationsController", {
    enumerable: true,
    get: function() {
        return ApplicationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _applicationsservice = require("./applications.service");
const _authguard = require("../auth/auth.guard");
const _applicationdto = require("./dto/application.dto");
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
let ApplicationsController = class ApplicationsController {
    findAll(req) {
        return this.service.findAll(req.user?.id);
    }
    getStats(req) {
        return this.service.getStats(req.user?.id);
    }
    create(dto, req) {
        return this.service.create(dto, req.user?.id);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user?.id);
    }
    remove(id, req) {
        return this.service.remove(id, req.user?.id);
    }
    async getComments(id) {
        const app = await this.service.findOne(id);
        if (!app || app.visibility !== 'public') return [];
        return this.service.getComments(id);
    }
    async addComment(id, body, req) {
        return this.service.addComment(id, body.content, req.user?.id);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ApplicationsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('stats'),
    (0, _swagger.ApiOperation)({
        summary: '지원 통계'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ApplicationsController.prototype, "getStats", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역 추가'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _applicationdto.CreateApplicationDto === "undefined" ? Object : _applicationdto.CreateApplicationDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ApplicationsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _applicationdto.UpdateApplicationDto === "undefined" ? Object : _applicationdto.UpdateApplicationDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ApplicationsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ApplicationsController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Get)(':id/comments'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역 댓글 목록'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], ApplicationsController.prototype, "getComments", null);
_ts_decorate([
    (0, _common.Post)(':id/comments'),
    (0, _throttler.Throttle)({
        short: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '지원 내역에 댓글 작성'
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
    _ts_metadata("design:returntype", Promise)
], ApplicationsController.prototype, "addComment", null);
ApplicationsController = _ts_decorate([
    (0, _swagger.ApiTags)('applications'),
    (0, _common.Controller)('applications'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _applicationsservice.ApplicationsService === "undefined" ? Object : _applicationsservice.ApplicationsService
    ])
], ApplicationsController);
