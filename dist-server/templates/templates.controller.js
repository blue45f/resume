"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TemplatesController", {
    enumerable: true,
    get: function() {
        return TemplatesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _templatesservice = require("./templates.service");
const _localtransformservice = require("./local-transform.service");
const _resumesservice = require("../resumes/resumes.service");
const _templatedto = require("./dto/template.dto");
const _authguard = require("../auth/auth.guard");
const _cacheinterceptor = require("../common/interceptors/cache.interceptor");
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
let TemplatesController = class TemplatesController {
    findAll() {
        return this.templatesService.findAll();
    }
    findPublicTemplates(category) {
        return this.templatesService.findPublic(category);
    }
    findOne(id) {
        return this.templatesService.findOne(id);
    }
    create(dto, req) {
        return this.templatesService.create(dto, req.user?.id);
    }
    update(id, dto, req) {
        return this.templatesService.update(id, dto, req.user?.id, req.user?.role);
    }
    remove(id, req) {
        return this.templatesService.remove(id, req.user?.id, req.user?.role);
    }
    seed() {
        return this.templatesService.seed();
    }
    async localTransform(resumeId, dto) {
        const resume = await this.resumesService.findOne(resumeId);
        if (dto.templateId) {
            const template = await this.templatesService.findOne(dto.templateId);
            const layout = JSON.parse(template.layout || '{}');
            const text = this.localTransformService.transform(resume, layout);
            return {
                text,
                method: 'template',
                templateName: template.name
            };
        }
        const text = this.localTransformService.transformByPreset(resume, dto.preset || 'standard');
        return {
            text,
            method: 'preset',
            preset: dto.preset || 'standard'
        };
    }
    getPresets() {
        return [
            {
                id: 'standard',
                name: '표준 이력서',
                description: '전체 섹션을 기본 순서로 표시'
            },
            {
                id: 'developer',
                name: '개발자 이력서',
                description: '기술 스택과 프로젝트를 우선 배치'
            },
            {
                id: 'career-focused',
                name: '경력 중심',
                description: '경력과 프로젝트를 강조'
            },
            {
                id: 'academic',
                name: '학술/연구용',
                description: '학력과 수상을 우선 배치'
            },
            {
                id: 'minimal',
                name: '미니멀',
                description: '핵심 정보만 간결하게'
            }
        ];
    }
    constructor(templatesService, localTransformService, resumesService){
        this.templatesService = templatesService;
        this.localTransformService = localTransformService;
        this.resumesService = resumesService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _cacheinterceptor.CacheTTL)(300),
    (0, _swagger.ApiOperation)({
        summary: '템플릿 목록 조회'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('public'),
    (0, _authguard.Public)(),
    (0, _swagger.ApiOperation)({
        summary: '공개 템플릿 목록'
    }),
    _ts_param(0, (0, _common.Query)('category')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "findPublicTemplates", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '템플릿 상세 조회'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _swagger.ApiOperation)({
        summary: '템플릿 생성'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _templatedto.CreateTemplateDto === "undefined" ? Object : _templatedto.CreateTemplateDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '템플릿 수정'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _templatedto.UpdateTemplateDto === "undefined" ? Object : _templatedto.UpdateTemplateDto,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '템플릿 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Post)('seed'),
    (0, _swagger.ApiOperation)({
        summary: '기본 템플릿 시드 데이터 생성'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "seed", null);
_ts_decorate([
    (0, _common.Post)('local-transform/:resumeId'),
    (0, _swagger.ApiOperation)({
        summary: '로컬 변환 (LLM 불필요 - 프리셋/템플릿 기반 구조 변환)'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _templatedto.LocalTransformDto === "undefined" ? Object : _templatedto.LocalTransformDto
    ]),
    _ts_metadata("design:returntype", Promise)
], TemplatesController.prototype, "localTransform", null);
_ts_decorate([
    (0, _common.Get)('presets/list'),
    (0, _swagger.ApiOperation)({
        summary: '로컬 변환 프리셋 목록'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], TemplatesController.prototype, "getPresets", null);
TemplatesController = _ts_decorate([
    (0, _swagger.ApiTags)('templates'),
    (0, _common.Controller)('templates'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _templatesservice.TemplatesService === "undefined" ? Object : _templatesservice.TemplatesService,
        typeof _localtransformservice.LocalTransformService === "undefined" ? Object : _localtransformservice.LocalTransformService,
        typeof _resumesservice.ResumesService === "undefined" ? Object : _resumesservice.ResumesService
    ])
], TemplatesController);
