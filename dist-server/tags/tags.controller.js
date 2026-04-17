"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TagsController", {
    enumerable: true,
    get: function() {
        return TagsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _cacheinterceptor = require("../common/interceptors/cache.interceptor");
const _authguard = require("../auth/auth.guard");
const _resumesservice = require("../resumes/resumes.service");
const _tagsservice = require("./tags.service");
const _tagdto = require("./dto/tag.dto");
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
let TagsController = class TagsController {
    findAll() {
        return this.tagsService.findAll();
    }
    create(dto, req) {
        return this.tagsService.create(dto, req.user?.id);
    }
    remove(id, req) {
        return this.tagsService.remove(id, req.user?.id, req.user?.role);
    }
    async addToResume(tagId, resumeId, req) {
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.tagsService.addTagToResume(resumeId, tagId);
    }
    async removeFromResume(tagId, resumeId, req) {
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.tagsService.removeTagFromResume(resumeId, tagId);
    }
    constructor(tagsService, resumesService){
        this.tagsService = tagsService;
        this.resumesService = resumesService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    (0, _cacheinterceptor.CacheTTL)(120),
    (0, _swagger.ApiOperation)({
        summary: '태그 목록 조회'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], TagsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '태그 생성'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tagdto.CreateTagDto === "undefined" ? Object : _tagdto.CreateTagDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], TagsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '태그 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], TagsController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Post)(':tagId/resumes/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '이력서에 태그 추가'
    }),
    _ts_param(0, (0, _common.Param)('tagId')),
    _ts_param(1, (0, _common.Param)('resumeId')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "addToResume", null);
_ts_decorate([
    (0, _common.Delete)(':tagId/resumes/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '이력서에서 태그 제거'
    }),
    _ts_param(0, (0, _common.Param)('tagId')),
    _ts_param(1, (0, _common.Param)('resumeId')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], TagsController.prototype, "removeFromResume", null);
TagsController = _ts_decorate([
    (0, _swagger.ApiTags)('tags'),
    (0, _common.Controller)('tags'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tagsservice.TagsService === "undefined" ? Object : _tagsservice.TagsService,
        typeof _resumesservice.ResumesService === "undefined" ? Object : _resumesservice.ResumesService
    ])
], TagsController);
