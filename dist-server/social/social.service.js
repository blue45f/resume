"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SocialService", {
    enumerable: true,
    get: function() {
        return SocialService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
const _forbiddenwordsservice = require("../forbidden-words/forbidden-words.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SocialService = class SocialService {
    async follow(followerId, followingId) {
        if (followerId === followingId) throw new _common.ForbiddenException('자신을 팔로우할 수 없습니다');
        try {
            await this.prisma.follow.create({
                data: {
                    followerId,
                    followingId
                }
            });
        } catch  {} // unique constraint
        return {
            followed: true
        };
    }
    async unfollow(followerId, followingId) {
        await this.prisma.follow.deleteMany({
            where: {
                followerId,
                followingId
            }
        });
        return {
            followed: false
        };
    }
    async getFollowers(userId) {
        const follows = await this.prisma.follow.findMany({
            where: {
                followingId: userId
            },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });
        return follows.map((f)=>({
                ...f.follower,
                followedAt: f.createdAt
            }));
    }
    async getFollowing(userId) {
        const follows = await this.prisma.follow.findMany({
            where: {
                followerId: userId
            },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        });
        return follows.map((f)=>({
                ...f.following,
                followedAt: f.createdAt
            }));
    }
    async isFollowing(followerId, followingId) {
        const follow = await this.prisma.follow.findFirst({
            where: {
                followerId,
                followingId
            }
        });
        return !!follow;
    }
    // Scout messages
    async sendScout(senderId, data) {
        if (data.message.length > 2000) throw new _common.ForbiddenException('스카우트 메시지는 2000자 이내로 입력해주세요');
        await this.forbiddenWords.validateOrThrow(data.message, data.company, data.position);
        const sender = await this.prisma.user.findUnique({
            where: {
                id: senderId
            },
            select: {
                name: true,
                userType: true
            }
        });
        if (sender?.userType === 'personal') {
            throw new _common.ForbiddenException('스카우트 전송은 리크루터 또는 기업 회원만 가능합니다');
        }
        const scout = await this.prisma.scoutMessage.create({
            data: {
                senderId,
                ...data
            }
        });
        try {
            const senderName = sender?.name || '누군가';
            // sender already fetched above
            await this.notificationsService.create(data.receiverId, 'scout', `${senderName}님이 스카우트 제안을 보냈습니다`, '/scouts');
        } catch  {}
        return scout;
    }
    async getReceivedScouts(userId) {
        return this.prisma.scoutMessage.findMany({
            where: {
                receiverId: userId
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async markScoutRead(id, userId) {
        await this.prisma.scoutMessage.updateMany({
            where: {
                id,
                receiverId: userId
            },
            data: {
                read: true
            }
        });
        return {
            success: true
        };
    }
    async getSentScouts(userId) {
        return this.prisma.scoutMessage.findMany({
            where: {
                senderId: userId
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async respondToScout(id, userId, status) {
        if (![
            'accepted',
            'rejected'
        ].includes(status)) {
            throw new _common.ForbiddenException('유효하지 않은 상태입니다');
        }
        const scout = await this.prisma.scoutMessage.findUnique({
            where: {
                id
            }
        });
        if (!scout || scout.receiverId !== userId) throw new _common.ForbiddenException();
        await this.prisma.scoutMessage.update({
            where: {
                id
            },
            data: {
                status,
                read: true
            }
        });
        try {
            const receiver = await this.prisma.user.findUnique({
                where: {
                    id: userId
                },
                select: {
                    name: true
                }
            });
            const label = status === 'accepted' ? '수락' : '거절';
            await this.notificationsService.create(scout.senderId, 'scout', `${receiver?.name || '후보자'}님이 스카우트 제안을 ${label}했습니다`, '/scouts');
        } catch  {}
        return {
            success: true
        };
    }
    async sendBulkScout(senderId, data) {
        const results = [];
        for (const receiverId of data.targetIds){
            try {
                const scout = await this.sendScout(senderId, {
                    receiverId,
                    message: data.message,
                    company: data.company,
                    position: ''
                });
                results.push({
                    receiverId,
                    success: true,
                    id: scout.id
                });
            } catch  {
                results.push({
                    receiverId,
                    success: false
                });
            }
        }
        return {
            sent: results.filter((r)=>r.success).length,
            failed: results.filter((r)=>!r.success).length,
            results
        };
    }
    // Direct Messages
    async sendMessage(senderId, receiverId, content) {
        if (senderId === receiverId) throw new _common.ForbiddenException('자신에게 메시지를 보낼 수 없습니다');
        if (!content || content.trim().length < 1) throw new _common.ForbiddenException('메시지를 입력해주세요');
        if (content.length > 1000) throw new _common.ForbiddenException('메시지는 1000자 이내로 입력해주세요');
        await this.forbiddenWords.validateOrThrow(content);
        const message = await this.prisma.directMessage.create({
            data: {
                senderId,
                receiverId,
                content: content.trim()
            }
        });
        try {
            const sender = await this.prisma.user.findUnique({
                where: {
                    id: senderId
                },
                select: {
                    name: true
                }
            });
            await this.notificationsService.create(receiverId, 'message', `${sender?.name || '누군가'}님이 쪽지를 보냈습니다`, '/messages');
        } catch  {}
        return message;
    }
    async getConversations(userId) {
        const sent = await this.prisma.directMessage.findMany({
            where: {
                senderId: userId
            },
            select: {
                receiverId: true
            },
            distinct: [
                'receiverId'
            ]
        });
        const received = await this.prisma.directMessage.findMany({
            where: {
                receiverId: userId
            },
            select: {
                senderId: true
            },
            distinct: [
                'senderId'
            ]
        });
        const partnerIds = new Set([
            ...sent.map((s)=>s.receiverId),
            ...received.map((r)=>r.senderId)
        ]);
        const conversations = [];
        for (const partnerId of partnerIds){
            const lastMessage = await this.prisma.directMessage.findFirst({
                where: {
                    OR: [
                        {
                            senderId: userId,
                            receiverId: partnerId
                        },
                        {
                            senderId: partnerId,
                            receiverId: userId
                        }
                    ]
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const unreadCount = await this.prisma.directMessage.count({
                where: {
                    senderId: partnerId,
                    receiverId: userId,
                    read: false
                }
            });
            const partner = await this.prisma.user.findUnique({
                where: {
                    id: partnerId
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                }
            });
            if (partner && lastMessage) {
                conversations.push({
                    partner,
                    lastMessage: {
                        content: lastMessage.content,
                        createdAt: lastMessage.createdAt,
                        isMine: lastMessage.senderId === userId
                    },
                    unreadCount
                });
            }
        }
        return conversations.sort((a, b)=>new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    }
    async getMessages(userId, partnerId) {
        await this.prisma.directMessage.updateMany({
            where: {
                senderId: partnerId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        });
        return this.prisma.directMessage.findMany({
            where: {
                OR: [
                    {
                        senderId: userId,
                        receiverId: partnerId
                    },
                    {
                        senderId: partnerId,
                        receiverId: userId
                    }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: 100
        });
    }
    async getUnreadMessageCount(userId) {
        return this.prisma.directMessage.count({
            where: {
                receiverId: userId,
                read: false
            }
        });
    }
    constructor(prisma, notificationsService, forbiddenWords){
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.forbiddenWords = forbiddenWords;
    }
};
SocialService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _forbiddenwordsservice.ForbiddenWordsService === "undefined" ? Object : _forbiddenwordsservice.ForbiddenWordsService
    ])
], SocialService);
