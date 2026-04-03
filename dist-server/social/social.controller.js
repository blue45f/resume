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
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const social_service_1 = require("./social.service");
let SocialController = class SocialController {
    service;
    constructor(service) {
        this.service = service;
    }
    follow(userId, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.follow(req.user.id, userId);
    }
    unfollow(userId, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.unfollow(req.user.id, userId);
    }
    getFollowers(req) {
        if (!req.user?.id)
            return [];
        return this.service.getFollowers(req.user.id);
    }
    getFollowing(req) {
        if (!req.user?.id)
            return [];
        return this.service.getFollowing(req.user.id);
    }
    sendScout(body, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.sendScout(req.user.id, body);
    }
    getScouts(req) {
        if (!req.user?.id)
            return [];
        return this.service.getReceivedScouts(req.user.id);
    }
    markRead(id, req) {
        if (!req.user?.id)
            return { success: false };
        return this.service.markScoutRead(id, req.user.id);
    }
    getConversations(req) {
        if (!req.user?.id)
            return [];
        return this.service.getConversations(req.user.id);
    }
    async getUnreadCount(req) {
        if (!req.user?.id)
            return { count: 0 };
        const count = await this.service.getUnreadMessageCount(req.user.id);
        return { count };
    }
    getMessages(partnerId, req) {
        if (!req.user?.id)
            return [];
        return this.service.getMessages(req.user.id, partnerId);
    }
    sendMessage(receiverId, content, req) {
        if (!req.user?.id)
            return { error: '로그인 필요' };
        return this.service.sendMessage(req.user.id, receiverId, content);
    }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Post)('follow/:userId'),
    (0, throttler_1.Throttle)({ short: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '팔로우' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "follow", null);
__decorate([
    (0, common_1.Delete)('follow/:userId'),
    (0, swagger_1.ApiOperation)({ summary: '언팔로우' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "unfollow", null);
__decorate([
    (0, common_1.Get)('followers'),
    (0, swagger_1.ApiOperation)({ summary: '내 팔로워 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowers", null);
__decorate([
    (0, common_1.Get)('following'),
    (0, swagger_1.ApiOperation)({ summary: '내 팔로잉 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getFollowing", null);
__decorate([
    (0, common_1.Post)('scout'),
    (0, throttler_1.Throttle)({ short: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '스카우트 메시지 보내기' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "sendScout", null);
__decorate([
    (0, common_1.Get)('scouts'),
    (0, swagger_1.ApiOperation)({ summary: '받은 스카우트 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getScouts", null);
__decorate([
    (0, common_1.Post)('scouts/:id/read'),
    (0, swagger_1.ApiOperation)({ summary: '스카우트 읽음 처리' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "markRead", null);
__decorate([
    (0, common_1.Get)('messages'),
    (0, swagger_1.ApiOperation)({ summary: '대화 목록' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('messages/unread/count'),
    (0, swagger_1.ApiOperation)({ summary: '읽지 않은 쪽지 수' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)('messages/:partnerId'),
    (0, swagger_1.ApiOperation)({ summary: '대화 내용' }),
    __param(0, (0, common_1.Param)('partnerId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages/:receiverId'),
    (0, throttler_1.Throttle)({ short: { limit: 10, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({ summary: '쪽지 보내기' }),
    __param(0, (0, common_1.Param)('receiverId')),
    __param(1, (0, common_1.Body)('content')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SocialController.prototype, "sendMessage", null);
exports.SocialController = SocialController = __decorate([
    (0, swagger_1.ApiTags)('social'),
    (0, common_1.Controller)('social'),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialController);
