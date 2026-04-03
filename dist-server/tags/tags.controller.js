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
exports.TagsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const resumes_service_1 = require("../resumes/resumes.service");
const tags_service_1 = require("./tags.service");
const tag_dto_1 = require("./dto/tag.dto");
let TagsController = class TagsController {
    tagsService;
    resumesService;
    constructor(tagsService, resumesService) {
        this.tagsService = tagsService;
        this.resumesService = resumesService;
    }
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
};
exports.TagsController = TagsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '태그 목록 조회' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '태그 생성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tag_dto_1.CreateTagDto, Object]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '태그 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TagsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':tagId/resumes/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '이력서에 태그 추가' }),
    __param(0, (0, common_1.Param)('tagId')),
    __param(1, (0, common_1.Param)('resumeId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "addToResume", null);
__decorate([
    (0, common_1.Delete)(':tagId/resumes/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '이력서에서 태그 제거' }),
    __param(0, (0, common_1.Param)('tagId')),
    __param(1, (0, common_1.Param)('resumeId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TagsController.prototype, "removeFromResume", null);
exports.TagsController = TagsController = __decorate([
    (0, swagger_1.ApiTags)('tags'),
    (0, common_1.Controller)('tags'),
    __metadata("design:paramtypes", [tags_service_1.TagsService,
        resumes_service_1.ResumesService])
], TagsController);
