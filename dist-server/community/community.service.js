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
exports.CommunityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const forbidden_words_service_1 = require("../forbidden-words/forbidden-words.service");
let CommunityService = class CommunityService {
    prisma;
    notifications;
    forbiddenWords;
    constructor(prisma, notifications, forbiddenWords) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.forbiddenWords = forbiddenWords;
    }
    async getPosts(category, search, page = 1, limit = 20, showHidden = false, sort = 'recent') {
        const where = {};
        if (!showHidden)
            where.isHidden = false;
        if (category && category !== 'all')
            where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.communityPost.findMany({
                where,
                orderBy: [
                    { isPinned: 'desc' },
                    ...(sort === 'popular' ? [{ likeCount: 'desc' }, { viewCount: 'desc' }] :
                        sort === 'views' ? [{ viewCount: 'desc' }] :
                            sort === 'comments' ? [] :
                                [{ createdAt: 'desc' }]),
                ],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { id: true, name: true, username: true, avatar: true } },
                    _count: { select: { comments: true, likes: true } },
                },
            }),
            this.prisma.communityPost.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getPost(id, viewerId) {
        await this.prisma.communityPost.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        });
        const post = await this.prisma.communityPost.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: { post: false },
                    take: 100,
                },
                _count: { select: { likes: true, comments: true } },
            },
        });
        if (!post)
            return null;
        let liked = false;
        if (viewerId) {
            const like = await this.prisma.communityLike.findUnique({
                where: { postId_userId: { postId: id, userId: viewerId } },
            });
            liked = !!like;
        }
        return { ...post, liked };
    }
    async createPost(userId, body) {
        await this.forbiddenWords.validateOrThrow(body.title, body.content);
        return this.prisma.communityPost.create({
            data: {
                title: body.title,
                content: body.content,
                category: body.category || 'free',
                userId,
                attachments: body.attachments || [],
            },
            include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
            },
        });
    }
    async updatePost(id, userId, role, body) {
        const post = await this.prisma.communityPost.findUnique({ where: { id } });
        if (!post)
            throw new Error('Not found');
        if (post.userId !== userId && role !== 'admin' && role !== 'superadmin')
            throw new Error('Forbidden');
        const data = {};
        if (body.title !== undefined)
            data.title = body.title;
        if (body.content !== undefined)
            data.content = body.content;
        if (body.category !== undefined)
            data.category = body.category;
        if (body.attachments !== undefined)
            data.attachments = body.attachments;
        if ((role === 'admin' || role === 'superadmin') && body.isPinned !== undefined) {
            data.isPinned = body.isPinned;
        }
        if ((role === 'admin' || role === 'superadmin') && body.isHidden !== undefined) {
            data.isHidden = body.isHidden;
        }
        return this.prisma.communityPost.update({ where: { id }, data });
    }
    async deletePost(id, userId, role) {
        const post = await this.prisma.communityPost.findUnique({ where: { id } });
        if (!post)
            throw new Error('Not found');
        if (post.userId !== userId && role !== 'admin' && role !== 'superadmin')
            throw new Error('Forbidden');
        return this.prisma.communityPost.delete({ where: { id } });
    }
    async toggleLike(postId, userId) {
        const existing = await this.prisma.communityLike.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        if (existing) {
            await this.prisma.communityLike.delete({ where: { id: existing.id } });
            await this.prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
            return { liked: false };
        }
        else {
            await this.prisma.communityLike.create({ data: { postId, userId } });
            await this.prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
            return { liked: true };
        }
    }
    async getComments(postId) {
        return this.prisma.communityComment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async addComment(postId, userId, content, authorName, parentId) {
        await this.forbiddenWords.validateOrThrow(content);
        const comment = await this.prisma.communityComment.create({
            data: { postId, userId: userId || null, content, authorName: authorName || null, parentId: parentId || null },
        });
        const post = await this.prisma.communityPost.findUnique({ where: { id: postId }, select: { userId: true, title: true } });
        const commenterName = authorName || '익명';
        if (parentId) {
            const parent = await this.prisma.communityComment.findUnique({ where: { id: parentId }, select: { userId: true } });
            if (parent?.userId && parent.userId !== userId) {
                await this.notifications.create(parent.userId, 'comment', `${commenterName}님이 내 댓글에 답글을 달았습니다.`, `/community/${postId}`).catch(() => { });
            }
        }
        else if (post?.userId && post.userId !== userId) {
            await this.notifications.create(post.userId, 'comment', `"${post.title.slice(0, 30)}" 게시글에 ${commenterName}님이 댓글을 달았습니다.`, `/community/${postId}`).catch(() => { });
        }
        return comment;
    }
    async deleteComment(commentId, userId, role) {
        const comment = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
        if (!comment)
            throw new Error('Not found');
        if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin')
            throw new Error('Forbidden');
        return this.prisma.communityComment.delete({ where: { id: commentId } });
    }
};
exports.CommunityService = CommunityService;
exports.CommunityService = CommunityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        forbidden_words_service_1.ForbiddenWordsService])
], CommunityService);
