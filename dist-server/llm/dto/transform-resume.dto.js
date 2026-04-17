"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TEMPLATE_TYPES () {
        return TEMPLATE_TYPES;
    },
    get TransformResumeDto () {
        return TransformResumeDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const TEMPLATE_TYPES = [
    'standard',
    'career-description',
    'cover-letter',
    'linkedin',
    'english',
    'developer',
    'designer',
    'custom'
];
let TransformResumeDto = class TransformResumeDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: '변환 유형',
        enum: TEMPLATE_TYPES,
        example: 'standard'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)(TEMPLATE_TYPES),
    _ts_metadata("design:type", typeof TemplateType === "undefined" ? Object : TemplateType)
], TransformResumeDto.prototype, "templateType", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: '타겟 언어 (ko/en)',
        default: 'ko'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsIn)([
        'ko',
        'en'
    ]),
    _ts_metadata("design:type", String)
], TransformResumeDto.prototype, "targetLanguage", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'Job Description (JD 맞춤 최적화용, 3000자 이내)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(3000, {
        message: 'JD는 3000자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], TransformResumeDto.prototype, "jobDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: '커스텀 프롬프트 (custom 유형일 때, 2000자 이내)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(2000, {
        message: '커스텀 프롬프트는 2000자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], TransformResumeDto.prototype, "customPrompt", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'LLM 프로바이더 (anthropic/n8n/openai-compatible). 미지정시 기본 프로바이더 사용'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TransformResumeDto.prototype, "provider", void 0);
