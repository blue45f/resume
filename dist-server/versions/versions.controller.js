"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "VersionsController", {
    enumerable: true,
    get: function() {
        return VersionsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _versionsservice = require("./versions.service");
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
let VersionsController = class VersionsController {
    findAll(resumeId) {
        return this.versionsService.findAll(resumeId);
    }
    findOne(resumeId, versionId) {
        return this.versionsService.findOne(resumeId, versionId);
    }
    restore(resumeId, versionId, req) {
        return this.versionsService.restore(resumeId, versionId, req.user?.id);
    }
    constructor(versionsService){
        this.versionsService = versionsService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '이력서 버전 목록 조회'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VersionsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':versionId'),
    (0, _swagger.ApiOperation)({
        summary: '특정 버전 상세 조회'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Param)('versionId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], VersionsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(':versionId/restore'),
    (0, _swagger.ApiOperation)({
        summary: '특정 버전으로 복원'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Param)('versionId')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], VersionsController.prototype, "restore", null);
VersionsController = _ts_decorate([
    (0, _swagger.ApiTags)('versions'),
    (0, _common.Controller)('resumes/:resumeId/versions'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _versionsservice.VersionsService === "undefined" ? Object : _versionsservice.VersionsService
    ])
], VersionsController);
