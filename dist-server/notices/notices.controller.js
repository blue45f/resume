"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NoticesController", {
    enumerable: true,
    get: function() {
        return NoticesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _authguard = require("../auth/auth.guard");
const _noticesservice = require("./notices.service");
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
let NoticesController = class NoticesController {
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
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        return this.service.create(body, req.user.id);
    }
    update(req, id, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        const { reason, ...data } = body;
        return this.service.update(id, data, req.user.id, reason);
    }
    remove(req, id) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        return this.service.remove(id);
    }
    // ── Comments ─────────────────────────────────────────────────
    addComment(req, noticeId, body) {
        if (!req.user?.id) throw new _common.ForbiddenException('로그인 필요');
        return this.service.addComment(noticeId, req.user.id, body.content);
    }
    deleteComment(req, _noticeId, commentId) {
        if (!req.user?.id) throw new _common.ForbiddenException();
        return this.service.deleteComment(commentId, req.user.id, req.user.role);
    }
    toggleComments(req, id, body) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        return this.service.toggleComments(id, body.allow);
    }
    // ── History ───────────────────────────────────────────────────
    getHistory(req, id) {
        if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new _common.ForbiddenException();
        return this.service.getHistory(id);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)('popup'),
    (0, _authguard.Public)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "getPopup", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Query)('type')),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        void 0,
        void 0
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "getAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _authguard.Public)(),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "getOne", null);
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Post)(':id/comments'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "addComment", null);
_ts_decorate([
    (0, _common.Delete)(':noticeId/comments/:commentId'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('noticeId')),
    _ts_param(2, (0, _common.Param)('commentId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "deleteComment", null);
_ts_decorate([
    (0, _common.Patch)(':id/toggle-comments'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "toggleComments", null);
_ts_decorate([
    (0, _common.Get)(':id/history'),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], NoticesController.prototype, "getHistory", null);
NoticesController = _ts_decorate([
    (0, _swagger.ApiTags)('notices'),
    (0, _common.Controller)('notices'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _noticesservice.NoticesService === "undefined" ? Object : _noticesservice.NoticesService
    ])
], NoticesController);
