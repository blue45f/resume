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
exports.VersionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const versions_service_1 = require("./versions.service");
let VersionsController = class VersionsController {
    versionsService;
    constructor(versionsService) {
        this.versionsService = versionsService;
    }
    findAll(resumeId) {
        return this.versionsService.findAll(resumeId);
    }
    findOne(resumeId, versionId) {
        return this.versionsService.findOne(resumeId, versionId);
    }
    restore(resumeId, versionId, req) {
        return this.versionsService.restore(resumeId, versionId, req.user?.id);
    }
};
exports.VersionsController = VersionsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '이력서 버전 목록 조회' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':versionId'),
    (0, swagger_1.ApiOperation)({ summary: '특정 버전 상세 조회' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Param)('versionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':versionId/restore'),
    (0, swagger_1.ApiOperation)({ summary: '특정 버전으로 복원' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Param)('versionId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VersionsController.prototype, "restore", null);
exports.VersionsController = VersionsController = __decorate([
    (0, swagger_1.ApiTags)('versions'),
    (0, common_1.Controller)('resumes/:resumeId/versions'),
    __metadata("design:paramtypes", [versions_service_1.VersionsService])
], VersionsController);
