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
exports.ResumesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const resumes_service_1 = require("./resumes.service");
const create_resume_dto_1 = require("./dto/create-resume.dto");
const update_resume_dto_1 = require("./dto/update-resume.dto");
let ResumesController = class ResumesController {
    resumesService;
    constructor(resumesService) {
        this.resumesService = resumesService;
    }
    findAll(req, isPublic) {
        if (isPublic === 'true') {
            return this.resumesService.findPublic();
        }
        return this.resumesService.findAll(req.user?.id);
    }
    findPublicResumes(query, tag, page, limit) {
        return this.resumesService.searchPublic({
            query, tag,
            page: parseInt(page || '1'),
            limit: Math.min(parseInt(limit || '20'), 50),
        });
    }
    findOne(id, req) {
        return this.resumesService.findOne(id, req.user?.id);
    }
    create(dto, req) {
        return this.resumesService.create(dto, req.user?.id);
    }
    update(id, dto) {
        return this.resumesService.update(id, dto);
    }
    setVisibility(id, visibility) {
        return this.resumesService.setVisibility(id, visibility);
    }
    remove(id) {
        return this.resumesService.remove(id);
    }
    duplicate(id, req) {
        return this.resumesService.duplicate(id, req.user?.id);
    }
};
exports.ResumesController = ResumesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '내 이력서 목록 (로그인 시) 또는 공개 이력서 목록' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('public')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '공개 이력서 검색/목록' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('tag')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findPublicResumes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 상세 조회' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '이력서 생성' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_resume_dto_1.CreateResumeDto, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_resume_dto_1.UpdateResumeDto]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/visibility'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 공개/비공개 설정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('visibility')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "setVisibility", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/duplicate'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 복제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ResumesController.prototype, "duplicate", null);
exports.ResumesController = ResumesController = __decorate([
    (0, swagger_1.ApiTags)('resumes'),
    (0, common_1.Controller)('resumes'),
    __metadata("design:paramtypes", [resumes_service_1.ResumesService])
], ResumesController);
