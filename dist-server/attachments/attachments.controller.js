"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AttachmentsController", {
    enumerable: true,
    get: function() {
        return AttachmentsController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _express = require("express");
const _attachmentsservice = require("./attachments.service");
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
let AttachmentsController = class AttachmentsController {
    upload(resumeId, file, category, description) {
        if (!file) throw new _common.BadRequestException('파일이 없습니다');
        return this.attachmentsService.upload(resumeId, file, category, description);
    }
    findAll(resumeId) {
        return this.attachmentsService.findAll(resumeId);
    }
    async download(id, req, res) {
        const result = await this.attachmentsService.getFileData(id, req.user?.id);
        // Cloudinary URL → 리다이렉트
        if ('redirectUrl' in result && result.redirectUrl) {
            res.redirect(result.redirectUrl);
            return;
        }
        const { data, originalName, mimeType } = result;
        if (!data) {
            res.status(404).json({
                message: '파일을 찾을 수 없습니다'
            });
            return;
        }
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`);
        res.send(data);
    }
    remove(id) {
        return this.attachmentsService.remove(id);
    }
    constructor(attachmentsService){
        this.attachmentsService = attachmentsService;
    }
};
_ts_decorate([
    (0, _common.Post)('resumes/:resumeId/attachments'),
    (0, _swagger.ApiOperation)({
        summary: '파일 업로드'
    }),
    (0, _swagger.ApiConsumes)('multipart/form-data'),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)('file')),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_param(2, (0, _common.Body)('category')),
    _ts_param(3, (0, _common.Body)('description')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AttachmentsController.prototype, "upload", null);
_ts_decorate([
    (0, _common.Get)('resumes/:resumeId/attachments'),
    (0, _swagger.ApiOperation)({
        summary: '이력서 첨부파일 목록'
    }),
    _ts_param(0, (0, _common.Param)('resumeId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AttachmentsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('attachments/:id/download'),
    (0, _swagger.ApiOperation)({
        summary: '파일 다운로드'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_param(2, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AttachmentsController.prototype, "download", null);
_ts_decorate([
    (0, _common.Delete)('attachments/:id'),
    (0, _swagger.ApiOperation)({
        summary: '파일 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AttachmentsController.prototype, "remove", null);
AttachmentsController = _ts_decorate([
    (0, _swagger.ApiTags)('attachments'),
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _attachmentsservice.AttachmentsService === "undefined" ? Object : _attachmentsservice.AttachmentsService
    ])
], AttachmentsController);
