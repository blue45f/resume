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
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const templates_service_1 = require("./templates.service");
const local_transform_service_1 = require("./local-transform.service");
const resumes_service_1 = require("../resumes/resumes.service");
const template_dto_1 = require("./dto/template.dto");
let TemplatesController = class TemplatesController {
    templatesService;
    localTransformService;
    resumesService;
    constructor(templatesService, localTransformService, resumesService) {
        this.templatesService = templatesService;
        this.localTransformService = localTransformService;
        this.resumesService = resumesService;
    }
    findAll() {
        return this.templatesService.findAll();
    }
    findOne(id) {
        return this.templatesService.findOne(id);
    }
    create(dto) {
        return this.templatesService.create(dto);
    }
    update(id, dto) {
        return this.templatesService.update(id, dto);
    }
    remove(id) {
        return this.templatesService.remove(id);
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
            return { text, method: 'template', templateName: template.name };
        }
        const text = this.localTransformService.transformByPreset(resume, dto.preset || 'standard');
        return { text, method: 'preset', preset: dto.preset || 'standard' };
    }
    getPresets() {
        return [
            { id: 'standard', name: '표준 이력서', description: '전체 섹션을 기본 순서로 표시' },
            { id: 'developer', name: '개발자 이력서', description: '기술 스택과 프로젝트를 우선 배치' },
            { id: 'career-focused', name: '경력 중심', description: '경력과 프로젝트를 강조' },
            { id: 'academic', name: '학술/연구용', description: '학력과 수상을 우선 배치' },
            { id: 'minimal', name: '미니멀', description: '핵심 정보만 간결하게' },
        ];
    }
};
exports.TemplatesController = TemplatesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '템플릿 목록 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '템플릿 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '템플릿 생성' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '템플릿 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '템플릿 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('seed'),
    (0, swagger_1.ApiOperation)({ summary: '기본 템플릿 시드 데이터 생성' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "seed", null);
__decorate([
    (0, common_1.Post)('local-transform/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '로컬 변환 (LLM 불필요 - 프리셋/템플릿 기반 구조 변환)' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, template_dto_1.LocalTransformDto]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "localTransform", null);
__decorate([
    (0, common_1.Get)('presets/list'),
    (0, swagger_1.ApiOperation)({ summary: '로컬 변환 프리셋 목록' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "getPresets", null);
exports.TemplatesController = TemplatesController = __decorate([
    (0, swagger_1.ApiTags)('templates'),
    (0, common_1.Controller)('templates'),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService,
        local_transform_service_1.LocalTransformService,
        resumes_service_1.ResumesService])
], TemplatesController);
