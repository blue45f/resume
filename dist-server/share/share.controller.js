"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ShareController", {
    enumerable: true,
    get: function() {
        return ShareController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _authguard = require("../auth/auth.guard");
const _resumesservice = require("../resumes/resumes.service");
const _shareservice = require("./share.service");
const _sharedto = require("./dto/share.dto");
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
let ShareController = class ShareController {
    async createLink(resumeId, dto, req) {
        // 소유권 검증: 이력서 소유자만 공유 링크 생성 가능
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.shareService.createLink(resumeId, dto);
    }
    async getLinks(resumeId, req) {
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.shareService.getLinksForResume(resumeId);
    }
    removeLink(id) {
        return this.shareService.removeLink(id);
    }
    getShared(token, password) {
        return this.shareService.getByToken(token, password);
    }
    constructor(shareService, resumesService){
        this.shareService = shareService;
        this.resumesService = resumesService;
    }
};
_ts_decorate([
    (0, _common.Post)('resumes/:resumeId/share'),
    (0, _swagger.ApiOperation)({
        summary: '공유 링크 생성'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _sharedto.CreateShareLinkDto === "undefined" ? Object : _sharedto.CreateShareLinkDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ShareController.prototype, "createLink", null);
_ts_decorate([
    (0, _common.Get)('resumes/:resumeId/share'),
    (0, _swagger.ApiOperation)({
        summary: '이력서의 공유 링크 목록'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ShareController.prototype, "getLinks", null);
_ts_decorate([
    (0, _common.Delete)('share/:id'),
    (0, _swagger.ApiOperation)({
        summary: '공유 링크 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ShareController.prototype, "removeLink", null);
_ts_decorate([
    (0, _common.Get)('shared/:token'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '공유된 이력서 조회 (공개 접근)'
    }),
    _ts_param(0, (0, _common.Param)('token')),
    _ts_param(1, (0, _common.Query)('password')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ShareController.prototype, "getShared", null);
ShareController = _ts_decorate([
    (0, _swagger.ApiTags)('share'),
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _shareservice.ShareService === "undefined" ? Object : _shareservice.ShareService,
        typeof _resumesservice.ResumesService === "undefined" ? Object : _resumesservice.ResumesService
    ])
], ShareController);
