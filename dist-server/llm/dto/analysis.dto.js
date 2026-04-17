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
    get FeedbackDto () {
        return FeedbackDto;
    },
    get InlineAssistDto () {
        return InlineAssistDto;
    },
    get InterviewDto () {
        return InterviewDto;
    },
    get JobMatchDto () {
        return JobMatchDto;
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
let FeedbackDto = class FeedbackDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'LLM 프로바이더'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], FeedbackDto.prototype, "provider", void 0);
let JobMatchDto = class JobMatchDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'Job Description (5000자 이내)'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(5000, {
        message: 'JD는 5000자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], JobMatchDto.prototype, "jobDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'LLM 프로바이더'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], JobMatchDto.prototype, "provider", void 0);
let InterviewDto = class InterviewDto {
};
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: '직무 (200자 이내)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(200, {
        message: '직무명은 200자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], InterviewDto.prototype, "jobRole", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: '채용공고/JD (3000자 이내)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(3000, {
        message: 'JD는 3000자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], InterviewDto.prototype, "jobDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: '난이도 (beginner/intermediate/advanced)'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], InterviewDto.prototype, "difficulty", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'LLM 프로바이더'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], InterviewDto.prototype, "provider", void 0);
let InlineAssistDto = class InlineAssistDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: '개선할 텍스트 (2000자 이내)'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(2000, {
        message: '텍스트는 2000자 이내여야 합니다'
    }),
    _ts_metadata("design:type", String)
], InlineAssistDto.prototype, "text", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: '개선 유형'
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], InlineAssistDto.prototype, "type", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'LLM 프로바이더'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], InlineAssistDto.prototype, "provider", void 0);
