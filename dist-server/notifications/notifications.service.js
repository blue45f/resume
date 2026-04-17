"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsService", {
    enumerable: true,
    get: function() {
        return NotificationsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let NotificationsService = class NotificationsService {
    async getUnread(userId) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                read: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
    }
    async getAll(userId) {
        return this.prisma.notification.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
    }
    async markAsRead(userId, notificationId) {
        if (notificationId) {
            await this.prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId
                },
                data: {
                    read: true
                }
            });
        } else {
            await this.prisma.notification.updateMany({
                where: {
                    userId,
                    read: false
                },
                data: {
                    read: true
                }
            });
        }
        return {
            success: true
        };
    }
    async create(userId, type, message, link) {
        return this.prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link
            }
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: {
                userId,
                read: false
            }
        });
    }
    async deleteOne(userId, id) {
        await this.prisma.notification.deleteMany({
            where: {
                id,
                userId
            }
        });
        return {
            success: true
        };
    }
    async deleteBulk(userId, ids) {
        const { count } = await this.prisma.notification.deleteMany({
            where: {
                id: {
                    in: ids
                },
                userId
            }
        });
        return {
            success: true,
            deleted: count
        };
    }
    async cleanupOld() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { count } = await this.prisma.notification.deleteMany({
            where: {
                read: true,
                createdAt: {
                    lt: thirtyDaysAgo
                }
            }
        });
        return {
            deleted: count
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
NotificationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], NotificationsService);
