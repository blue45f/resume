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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let SocialService = class SocialService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async follow(followerId, followingId) {
        if (followerId === followingId)
            throw new common_1.ForbiddenException('자신을 팔로우할 수 없습니다');
        try {
            await this.prisma.follow.create({ data: { followerId, followingId } });
        }
        catch { }
        return { followed: true };
    }
    async unfollow(followerId, followingId) {
        await this.prisma.follow.deleteMany({ where: { followerId, followingId } });
        return { followed: false };
    }
    async getFollowers(userId) {
        const follows = await this.prisma.follow.findMany({
            where: { followingId: userId },
            include: { follower: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        return follows.map(f => ({ ...f.follower, followedAt: f.createdAt }));
    }
    async getFollowing(userId) {
        const follows = await this.prisma.follow.findMany({
            where: { followerId: userId },
            include: { following: { select: { id: true, name: true, email: true, avatar: true } } },
        });
        return follows.map(f => ({ ...f.following, followedAt: f.createdAt }));
    }
    async isFollowing(followerId, followingId) {
        const follow = await this.prisma.follow.findFirst({ where: { followerId, followingId } });
        return !!follow;
    }
    async sendScout(senderId, data) {
        if (data.message.length > 2000)
            throw new common_1.ForbiddenException('스카우트 메시지는 2000자 이내로 입력해주세요');
        const sender = await this.prisma.user.findUnique({ where: { id: senderId }, select: { name: true, userType: true } });
        if (sender?.userType === 'personal') {
            throw new common_1.ForbiddenException('스카우트 전송은 리크루터 또는 기업 회원만 가능합니다');
        }
        const scout = await this.prisma.scoutMessage.create({
            data: { senderId, ...data },
        });
        try {
            const senderName = sender?.name || '누군가';
            await this.notificationsService.create(data.receiverId, 'scout', `${senderName}님이 스카우트 제안을 보냈습니다`, '/scouts');
        }
        catch { }
        return scout;
    }
    async getReceivedScouts(userId) {
        return this.prisma.scoutMessage.findMany({
            where: { receiverId: userId },
            include: { sender: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markScoutRead(id, userId) {
        await this.prisma.scoutMessage.updateMany({
            where: { id, receiverId: userId },
            data: { read: true },
        });
        return { success: true };
    }
    async getSentScouts(userId) {
        return this.prisma.scoutMessage.findMany({
            where: { senderId: userId },
            include: {
                receiver: { select: { id: true, name: true, email: true } },
                sender: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async respondToScout(id, userId, status) {
        if (!['accepted', 'rejected'].includes(status)) {
            throw new common_1.ForbiddenException('유효하지 않은 상태입니다');
        }
        const scout = await this.prisma.scoutMessage.findUnique({ where: { id } });
        if (!scout || scout.receiverId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.scoutMessage.update({
            where: { id },
            data: { status, read: true },
        });
        try {
            const receiver = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
            const label = status === 'accepted' ? '수락' : '거절';
            await this.notificationsService.create(scout.senderId, 'scout', `${receiver?.name || '후보자'}님이 스카우트 제안을 ${label}했습니다`, '/scouts');
        }
        catch { }
        return { success: true };
    }
    async sendBulkScout(senderId, data) {
        const results = [];
        for (const receiverId of data.targetIds) {
            try {
                const scout = await this.sendScout(senderId, {
                    receiverId,
                    message: data.message,
                    company: data.company,
                    position: '',
                });
                results.push({ receiverId, success: true, id: scout.id });
            }
            catch {
                results.push({ receiverId, success: false });
            }
        }
        return { sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results };
    }
    async sendMessage(senderId, receiverId, content) {
        if (senderId === receiverId)
            throw new common_1.ForbiddenException('자신에게 메시지를 보낼 수 없습니다');
        if (!content || content.trim().length < 1)
            throw new common_1.ForbiddenException('메시지를 입력해주세요');
        if (content.length > 1000)
            throw new common_1.ForbiddenException('메시지는 1000자 이내로 입력해주세요');
        const message = await this.prisma.directMessage.create({
            data: { senderId, receiverId, content: content.trim() },
        });
        try {
            const sender = await this.prisma.user.findUnique({ where: { id: senderId }, select: { name: true } });
            await this.notificationsService.create(receiverId, 'message', `${sender?.name || '누군가'}님이 쪽지를 보냈습니다`, '/messages');
        }
        catch { }
        return message;
    }
    async getConversations(userId) {
        const sent = await this.prisma.directMessage.findMany({
            where: { senderId: userId },
            select: { receiverId: true },
            distinct: ['receiverId'],
        });
        const received = await this.prisma.directMessage.findMany({
            where: { receiverId: userId },
            select: { senderId: true },
            distinct: ['senderId'],
        });
        const partnerIds = new Set([
            ...sent.map(s => s.receiverId),
            ...received.map(r => r.senderId),
        ]);
        const conversations = [];
        for (const partnerId of partnerIds) {
            const lastMessage = await this.prisma.directMessage.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: partnerId },
                        { senderId: partnerId, receiverId: userId },
                    ],
                },
                orderBy: { createdAt: 'desc' },
            });
            const unreadCount = await this.prisma.directMessage.count({
                where: { senderId: partnerId, receiverId: userId, read: false },
            });
            const partner = await this.prisma.user.findUnique({
                where: { id: partnerId },
                select: { id: true, name: true, email: true, avatar: true },
            });
            if (partner && lastMessage) {
                conversations.push({
                    partner,
                    lastMessage: { content: lastMessage.content, createdAt: lastMessage.createdAt, isMine: lastMessage.senderId === userId },
                    unreadCount,
                });
            }
        }
        return conversations.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    }
    async getMessages(userId, partnerId) {
        await this.prisma.directMessage.updateMany({
            where: { senderId: partnerId, receiverId: userId, read: false },
            data: { read: true },
        });
        return this.prisma.directMessage.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: 100,
        });
    }
    async getUnreadMessageCount(userId) {
        return this.prisma.directMessage.count({
            where: { receiverId: userId, read: false },
        });
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], SocialService);
