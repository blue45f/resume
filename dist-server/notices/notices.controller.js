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
exports.NoticesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const notices_service_1 = require("./notices.service");
let NoticesController = class NoticesController {
    service;
    constructor(service) {
        this.service = service;
    }
    getPopup() {
        return this.service.getPopup();
    }
    getAll(type, page = '1', limit = '10') {
        return this.service.getAll(type, parseInt(page), parseInt(limit));
    }
    getOne(id) {
        return this.service.getOne(id);
    }
    create(req, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            throw new common_1.ForbiddenException();
        return this.service.create(body, req.user.id);
    }
    update(req, id, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            throw new common_1.ForbiddenException();
        const { reason, ...data } = body;
        return this.service.update(id, data, req.user.id, reason);
    }
    remove(req, id) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            throw new common_1.ForbiddenException();
        return this.service.remove(id);
    }
    addComment(req, noticeId, body) {
        if (!req.user?.id)
            throw new common_1.ForbiddenException('로그인 필요');
        return this.service.addComment(noticeId, req.user.id, body.content);
    }
    deleteComment(req, _noticeId, commentId) {
        if (!req.user?.id)
            throw new common_1.ForbiddenException();
        return this.service.deleteComment(commentId, req.user.id, req.user.role);
    }
    toggleComments(req, id, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            throw new common_1.ForbiddenException();
        return this.service.toggleComments(id, body.allow);
    }
    getHistory(req, id) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin')
            throw new common_1.ForbiddenException();
        return this.service.getHistory(id);
    }
};
exports.NoticesController = NoticesController;
__decorate([
    (0, common_1.Get)('popup'),
    (0, auth_guard_1.Public)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getPopup", null);
__decorate([
    (0, common_1.Get)(),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, auth_guard_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)(':noticeId/comments/:commentId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('noticeId')),
    __param(2, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-comments'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "toggleComments", null);
__decorate([
    (0, common_1.Get)(':id/history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NoticesController.prototype, "getHistory", null);
exports.NoticesController = NoticesController = __decorate([
    (0, swagger_1.ApiTags)('notices'),
    (0, common_1.Controller)('notices'),
    __metadata("design:paramtypes", [notices_service_1.NoticesService])
], NoticesController);
