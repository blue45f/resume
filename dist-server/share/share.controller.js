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
exports.ShareController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const resumes_service_1 = require("../resumes/resumes.service");
const share_service_1 = require("./share.service");
const share_dto_1 = require("./dto/share.dto");
let ShareController = class ShareController {
    shareService;
    resumesService;
    constructor(shareService, resumesService) {
        this.shareService = shareService;
        this.resumesService = resumesService;
    }
    async createLink(resumeId, dto, req) {
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.shareService.createLink(resumeId, dto);
    }
    async getLinks(resumeId, req) {
        await this.resumesService.findOne(resumeId, req.user?.id);
        return this.shareService.getLinksForResume(resumeId);
    }
    removeLink(id, req) {
        return this.shareService.removeLink(id, req.user?.id, req.user?.role);
    }
    getShared(token, password) {
        return this.shareService.getByToken(token, password);
    }
};
exports.ShareController = ShareController;
__decorate([
    (0, common_1.Post)('resumes/:resumeId/share'),
    (0, swagger_1.ApiOperation)({ summary: '공유 링크 생성' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, share_dto_1.CreateShareLinkDto, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "createLink", null);
__decorate([
    (0, common_1.Get)('resumes/:resumeId/share'),
    (0, swagger_1.ApiOperation)({ summary: '이력서의 공유 링크 목록' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShareController.prototype, "getLinks", null);
__decorate([
    (0, common_1.Delete)('share/:id'),
    (0, swagger_1.ApiOperation)({ summary: '공유 링크 삭제 (이력서 소유자 전용)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ShareController.prototype, "removeLink", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, auth_guard_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: '공유된 이력서 조회 (공개 접근)' }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Query)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShareController.prototype, "getShared", null);
exports.ShareController = ShareController = __decorate([
    (0, swagger_1.ApiTags)('share'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [share_service_1.ShareService,
        resumes_service_1.ResumesService])
], ShareController);
