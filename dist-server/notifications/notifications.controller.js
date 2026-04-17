"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsController", {
    enumerable: true,
    get: function() {
        return NotificationsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _notificationsservice = require("./notifications.service");
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
let NotificationsController = class NotificationsController {
    getAll(req) {
        if (!req.user?.id) return [];
        return this.service.getAll(req.user.id);
    }
    getUnread(req) {
        if (!req.user?.id) return [];
        return this.service.getUnread(req.user.id);
    }
    async getCount(req) {
        if (!req.user?.id) return {
            count: 0
        };
        const count = await this.service.getUnreadCount(req.user.id);
        return {
            count
        };
    }
    markAllRead(req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.markAsRead(req.user.id);
    }
    markRead(id, req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.markAsRead(req.user.id, id);
    }
    deleteOne(id, req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.deleteOne(req.user.id, id);
    }
    deleteBulk(body, req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.deleteBulk(req.user.id, body.ids);
    }
    cleanup(req) {
        if (!req.user?.id) return {
            success: false
        };
        if (req.user.role !== 'superadmin') {
            throw new _common.ForbiddenException('관리자만 사용할 수 있습니다');
        }
        return this.service.cleanupOld();
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: '알림 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "getAll", null);
_ts_decorate([
    (0, _common.Get)('unread'),
    (0, _swagger.ApiOperation)({
        summary: '읽지 않은 알림'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "getUnread", null);
_ts_decorate([
    (0, _common.Get)('count'),
    (0, _swagger.ApiOperation)({
        summary: '읽지 않은 알림 수'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotificationsController.prototype, "getCount", null);
_ts_decorate([
    (0, _common.Post)('read-all'),
    (0, _swagger.ApiOperation)({
        summary: '모든 알림 읽음 처리'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "markAllRead", null);
_ts_decorate([
    (0, _common.Post)(':id/read'),
    (0, _swagger.ApiOperation)({
        summary: '알림 읽음 처리'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "markRead", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _swagger.ApiOperation)({
        summary: '알림 삭제'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "deleteOne", null);
_ts_decorate([
    (0, _common.Post)('delete-bulk'),
    (0, _swagger.ApiOperation)({
        summary: '알림 일괄 삭제'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "deleteBulk", null);
_ts_decorate([
    (0, _common.Delete)('cleanup'),
    (0, _swagger.ApiOperation)({
        summary: '오래된 읽은 알림 정리 (관리자 전용)'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], NotificationsController.prototype, "cleanup", null);
NotificationsController = _ts_decorate([
    (0, _swagger.ApiTags)('notifications'),
    (0, _common.Controller)('notifications'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService
    ])
], NotificationsController);
