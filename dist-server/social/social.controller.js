"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SocialController", {
    enumerable: true,
    get: function() {
        return SocialController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _socialservice = require("./social.service");
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
let SocialController = class SocialController {
    follow(userId, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.follow(req.user.id, userId);
    }
    unfollow(userId, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.unfollow(req.user.id, userId);
    }
    getFollowers(req) {
        if (!req.user?.id) return [];
        return this.service.getFollowers(req.user.id);
    }
    getFollowing(req) {
        if (!req.user?.id) return [];
        return this.service.getFollowing(req.user.id);
    }
    sendScout(body, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.sendScout(req.user.id, body);
    }
    // ── 정적 경로 먼저 ──────────────────────────────────────
    getScouts(req) {
        if (!req.user?.id) return [];
        return this.service.getReceivedScouts(req.user.id);
    }
    getSentScouts(req) {
        if (!req.user?.id) return [];
        return this.service.getSentScouts(req.user.id);
    }
    sendBulkScout(body, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.sendBulkScout(req.user.id, body);
    }
    // ── 동적 :id 경로 ─────────────────────────────────────
    markRead(id, req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.markScoutRead(id, req.user.id);
    }
    respondToScout(id, body, req) {
        if (!req.user?.id) return {
            success: false
        };
        return this.service.respondToScout(id, req.user.id, body.status);
    }
    getConversations(req) {
        if (!req.user?.id) return [];
        return this.service.getConversations(req.user.id);
    }
    async getUnreadCount(req) {
        if (!req.user?.id) return {
            count: 0
        };
        const count = await this.service.getUnreadMessageCount(req.user.id);
        return {
            count
        };
    }
    getMessages(partnerId, req) {
        if (!req.user?.id) return [];
        return this.service.getMessages(req.user.id, partnerId);
    }
    sendMessage(receiverId, content, req) {
        if (!req.user?.id) return {
            error: '로그인 필요'
        };
        return this.service.sendMessage(req.user.id, receiverId, content);
    }
    constructor(service){
        this.service = service;
    }
};
_ts_decorate([
    (0, _common.Post)('follow/:userId'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '팔로우'
    }),
    _ts_param(0, (0, _common.Param)('userId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "follow", null);
_ts_decorate([
    (0, _common.Delete)('follow/:userId'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '언팔로우'
    }),
    _ts_param(0, (0, _common.Param)('userId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "unfollow", null);
_ts_decorate([
    (0, _common.Get)('followers'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '내 팔로워 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowers", null);
_ts_decorate([
    (0, _common.Get)('following'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '내 팔로잉 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowing", null);
_ts_decorate([
    (0, _common.Post)('scout'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '스카우트 메시지 보내기'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "sendScout", null);
_ts_decorate([
    (0, _common.Get)('scouts'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '받은 스카우트 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getScouts", null);
_ts_decorate([
    (0, _common.Get)('scouts/sent'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '보낸 스카우트 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getSentScouts", null);
_ts_decorate([
    (0, _common.Post)('bulk-scout'),
    (0, _throttler.Throttle)({
        short: {
            limit: 5,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '일괄 스카우트 전송'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "sendBulkScout", null);
_ts_decorate([
    (0, _common.Post)('scouts/:id/read'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '스카우트 읽음 처리'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "markRead", null);
_ts_decorate([
    (0, _common.Post)('scouts/:id/respond'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '스카우트 수락/거절'
    }),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "respondToScout", null);
_ts_decorate([
    (0, _common.Get)('messages'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '대화 목록'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getConversations", null);
_ts_decorate([
    (0, _common.Get)('messages/unread/count'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '읽지 않은 쪽지 수'
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], SocialController.prototype, "getUnreadCount", null);
_ts_decorate([
    (0, _common.Get)('messages/:partnerId'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '대화 내용'
    }),
    _ts_param(0, (0, _common.Param)('partnerId')),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "getMessages", null);
_ts_decorate([
    (0, _common.Post)('messages/:receiverId'),
    (0, _throttler.Throttle)({
        short: {
            limit: 10,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: '쪽지 보내기'
    }),
    _ts_param(0, (0, _common.Param)('receiverId')),
    _ts_param(1, (0, _common.Body)('content')),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], SocialController.prototype, "sendMessage", null);
SocialController = _ts_decorate([
    (0, _swagger.ApiTags)('social'),
    (0, _common.Controller)('social'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _socialservice.SocialService === "undefined" ? Object : _socialservice.SocialService
    ])
], SocialController);
