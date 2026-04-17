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
exports.InlineAssistDto = exports.InterviewDto = exports.JobMatchDto = exports.FeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class FeedbackDto {
    provider;
}
exports.FeedbackDto = FeedbackDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LLM 프로바이더' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], FeedbackDto.prototype, "provider", void 0);
class JobMatchDto {
    jobDescription;
    provider;
}
exports.JobMatchDto = JobMatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Job Description (5000자 이내)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000, { message: 'JD는 5000자 이내여야 합니다' }),
    __metadata("design:type", String)
], JobMatchDto.prototype, "jobDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LLM 프로바이더' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], JobMatchDto.prototype, "provider", void 0);
class InterviewDto {
    jobRole;
    jobDescription;
    difficulty;
    provider;
}
exports.InterviewDto = InterviewDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '직무 (200자 이내)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, { message: '직무명은 200자 이내여야 합니다' }),
    __metadata("design:type", String)
], InterviewDto.prototype, "jobRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '채용공고/JD (3000자 이내)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3000, { message: 'JD는 3000자 이내여야 합니다' }),
    __metadata("design:type", String)
], InterviewDto.prototype, "jobDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '난이도 (beginner/intermediate/advanced)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InterviewDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LLM 프로바이더' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], InterviewDto.prototype, "provider", void 0);
class InlineAssistDto {
    text;
    type;
    provider;
}
exports.InlineAssistDto = InlineAssistDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '개선할 텍스트 (2000자 이내)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000, { message: '텍스트는 2000자 이내여야 합니다' }),
    __metadata("design:type", String)
], InlineAssistDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '개선 유형' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], InlineAssistDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'LLM 프로바이더' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], InlineAssistDto.prototype, "provider", void 0);
