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
exports.InterviewController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const interview_service_1 = require("./interview.service");
let InterviewController = class InterviewController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.findAll(req.user.id);
    }
    create(body, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.create(req.user.id, body);
    }
    remove(id, req) {
        if (!req.user?.id)
            throw new common_1.UnauthorizedException('로그인이 필요합니다');
        return this.service.remove(id, req.user.id);
    }
};
exports.InterviewController = InterviewController;
__decorate([
    (0, common_1.Get)('answers'),
    (0, swagger_1.ApiOperation)({ summary: '내 면접 답변 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InterviewController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('answers'),
    (0, swagger_1.ApiOperation)({ summary: '면접 답변 저장' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InterviewController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)('answers/:id'),
    (0, swagger_1.ApiOperation)({ summary: '면접 답변 삭제' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], InterviewController.prototype, "remove", null);
exports.InterviewController = InterviewController = __decorate([
    (0, swagger_1.ApiTags)('interview'),
    (0, common_1.Controller)('interview'),
    __metadata("design:paramtypes", [interview_service_1.InterviewService])
], InterviewController);
