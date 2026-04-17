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
exports.NoticesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NoticesService = class NoticesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAll(type, page = 1, limit = 10) {
        const where = {};
        if (type)
            where.type = type;
        const [items, total] = await Promise.all([
            this.prisma.notice.findMany({
                where,
                include: { author: { select: { id: true, name: true, avatar: true } }, _count: { select: { comments: true } } },
                orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.notice.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getPopup() {
        const now = new Date();
        return this.prisma.notice.findMany({
            where: {
                isPopup: true,
                OR: [{ startAt: null }, { startAt: { lte: now } }],
                AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
        });
    }
    async getOne(id) {
        const notice = await this.prisma.notice.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, avatar: true } },
                comments: {
                    include: { user: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { createdAt: 'asc' },
                },
                _count: { select: { comments: true } },
            },
        });
        if (!notice)
            throw new common_1.NotFoundException('공지사항을 찾을 수 없습니다');
        await this.prisma.notice.update({ where: { id }, data: { viewCount: { increment: 1 } } });
        return notice;
    }
    async create(data, authorId) {
        return this.prisma.notice.create({
            data: { ...data, authorId: authorId || null },
            include: { author: { select: { id: true, name: true } } },
        });
    }
    async update(id, data, editorId, reason) {
        const existing = await this.prisma.notice.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException();
        if (editorId) {
            await this.prisma.noticeHistory.create({
                data: {
                    noticeId: id,
                    editorId,
                    prevTitle: existing.title,
                    prevContent: existing.content,
                    prevType: existing.type,
                    reason: reason || '',
                },
            });
        }
        return this.prisma.notice.update({
            where: { id },
            data,
            include: { author: { select: { id: true, name: true } } },
        });
    }
    async remove(id) {
        return this.prisma.notice.delete({ where: { id } });
    }
    async addComment(noticeId, userId, content) {
        const notice = await this.prisma.notice.findUnique({ where: { id: noticeId } });
        if (!notice)
            throw new common_1.NotFoundException();
        if (!notice.allowComments)
            throw new common_1.ForbiddenException('댓글이 허용되지 않은 공지사항입니다');
        return this.prisma.noticeComment.create({
            data: { noticeId, userId, content },
            include: { user: { select: { id: true, name: true, avatar: true } } },
        });
    }
    async deleteComment(commentId, userId, role) {
        const comment = await this.prisma.noticeComment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new common_1.NotFoundException();
        if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin')
            throw new common_1.ForbiddenException();
        return this.prisma.noticeComment.delete({ where: { id: commentId } });
    }
    async toggleComments(noticeId, allow) {
        return this.prisma.notice.update({ where: { id: noticeId }, data: { allowComments: allow } });
    }
    async getHistory(noticeId) {
        return this.prisma.noticeHistory.findMany({
            where: { noticeId },
            include: { editor: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.NoticesService = NoticesService;
exports.NoticesService = NoticesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NoticesService);
