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
exports.CoverLettersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cover_letters_service_1 = require("./cover-letters.service");
let CoverLettersController = class CoverLettersController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        if (!req.user?.id)
            return [];
        return this.service.findAll(req.user.id);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user?.id);
    }
    create(body, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.create(req.user.id, body);
    }
    update(id, body, req) {
        return this.service.update(id, req.user?.id, body);
    }
    remove(id, req) {
        return this.service.remove(id, req.user?.id);
    }
    getByResume(resumeId, req) {
        if (!req.user?.id)
            return [];
        return this.service.getByResume(resumeId, req.user.id);
    }
};
exports.CoverLettersController = CoverLettersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '내 자소서 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '자소서 상세' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '자소서 저장' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '자소서 수정' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '자소서 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('resume/:resumeId'),
    (0, swagger_1.ApiOperation)({ summary: '이력서별 자소서 목록' }),
    __param(0, (0, common_1.Param)('resumeId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CoverLettersController.prototype, "getByResume", null);
exports.CoverLettersController = CoverLettersController = __decorate([
    (0, swagger_1.ApiTags)('cover-letters'),
    (0, common_1.Controller)('cover-letters'),
    __metadata("design:paramtypes", [cover_letters_service_1.CoverLettersService])
], CoverLettersController);
