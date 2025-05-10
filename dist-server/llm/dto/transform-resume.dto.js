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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformResumeDto = exports.TEMPLATE_TYPES = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.TEMPLATE_TYPES = [
    'standard',
    'career-description',
    'cover-letter',
    'linkedin',
    'english',
    'developer',
    'designer',
    'custom',
];
class TransformResumeDto {
    templateType;
    targetLanguage;
    jobDescription;
    customPrompt;
    provider;
}
exports.TransformResumeDto = TransformResumeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '변환 유형',
        enum: exports.TEMPLATE_TYPES,
        example: 'standard',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.TEMPLATE_TYPES),
    __metadata("design:type", String)
], TransformResumeDto.prototype, "templateType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '타겟 언어 (ko/en)', default: 'ko' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['ko', 'en']),
    __metadata("design:type", String)
], TransformResumeDto.prototype, "targetLanguage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Job Description (JD 맞춤 최적화용)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransformResumeDto.prototype, "jobDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '커스텀 프롬프트 (custom 유형일 때)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransformResumeDto.prototype, "customPrompt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'LLM 프로바이더 (anthropic/n8n/openai-compatible). 미지정시 기본 프로바이더 사용',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransformResumeDto.prototype, "provider", void 0);
