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
exports.AttachmentsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const attachments_service_1 = require("./attachments.service");
let AttachmentsController = class AttachmentsController {
    attachmentsService;
    constructor(attachmentsService) {
        this.attachmentsService = attachmentsService;
    }
    upload(resumeId, file, category, description, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        if (!file)
            throw new common_1.BadRequestException('파일이 없습니다');
        return this.attachmentsService.upload(resumeId, file, category, description, req.user.id, req.user.role);
    }
    findAll(resumeId, req) {
        return this.attachmentsService.findAll(resumeId, req.user?.id, req.user?.role);
    }
    async download(id, req, res) {
        const result = await this.attachmentsService.getFileData(id, req.user?.id);
        if ('redirectUrl' in result && result.redirectUrl) {
            res.redirect(result.redirectUrl);
            return;
        }
        const { data, originalName, mimeType } = result;
        if (!data) {
            res.status(404).json({ message: '파일을 찾을 수 없습니다' });
            return;
        }
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        res.send(data);
    }
    remove(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.attachmentsService.remove(id, req.user.id, req.user.role);
    }
};
exports.AttachmentsController = AttachmentsController;
__decorate([
    (0, common_1.Post)('resumes/:resumeId/attachments'),
    (0, swagger_1.ApiOperation)({ summary: '파일 업로드 (소유자 전용)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('category')),
    __param(3, (0, common_1.Body)('description')),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('resumes/:resumeId/attachments'),
    (0, swagger_1.ApiOperation)({ summary: '이력서 첨부파일 목록' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('attachments/:id/download'),
    (0, swagger_1.ApiOperation)({ summary: '파일 다운로드' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AttachmentsController.prototype, "download", null);
__decorate([
    (0, common_1.Delete)('attachments/:id'),
    (0, swagger_1.ApiOperation)({ summary: '파일 삭제 (소유자 전용)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AttachmentsController.prototype, "remove", null);
exports.AttachmentsController = AttachmentsController = __decorate([
    (0, swagger_1.ApiTags)('attachments'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [attachments_service_1.AttachmentsService])
], AttachmentsController);
