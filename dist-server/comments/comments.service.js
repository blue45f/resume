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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const forbidden_words_service_1 = require("../forbidden-words/forbidden-words.service");
let CommentsService = class CommentsService {
    prisma;
    notificationsService;
    forbiddenWords;
    constructor(prisma, notificationsService, forbiddenWords) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.forbiddenWords = forbiddenWords;
    }
    async findByResume(resumeId) {
        const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume || resume.visibility !== 'public') {
            throw new common_1.NotFoundException('공개 이력서를 찾을 수 없습니다');
        }
        return this.prisma.comment.findMany({
            where: { resumeId },
            orderBy: { createdAt: 'asc' },
        });
    }
    async create(resumeId, content, userId, authorName, parentId) {
        await this.forbiddenWords.validateOrThrow(content);
        const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume || resume.visibility !== 'public') {
            throw new common_1.NotFoundException('공개 이력서에만 의견을 남길 수 있습니다');
        }
        if (!content || content.trim().length < 5) {
            throw new common_1.ForbiddenException('의견은 5자 이상 입력해주세요');
        }
        if (content.length > 500) {
            throw new common_1.ForbiddenException('의견은 500자 이내로 입력해주세요');
        }
        const cleanContent = content.trim().replace(/<[^>]*>/g, '');
        let name = authorName || '익명';
        if (userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user)
                name = user.name || user.email;
        }
        const comment = await this.prisma.comment.create({
            data: { resumeId, userId, authorName: name, content: cleanContent, parentId: parentId || null },
        });
        if (parentId) {
            const parent = await this.prisma.comment.findUnique({ where: { id: parentId }, select: { userId: true } });
            if (parent?.userId && parent.userId !== userId) {
                await this.notificationsService.create(parent.userId, 'comment', `${name}님이 내 의견에 답글을 달았습니다.`, `/resumes/${resumeId}/preview`).catch(() => { });
            }
        }
        else if (resume.userId && resume.userId !== userId) {
            await this.notificationsService.create(resume.userId, 'comment', `${name}님이 이력서에 의견을 남겼습니다: "${content.slice(0, 50)}..."`, `/resumes/${resumeId}/preview`);
        }
        return comment;
    }
    async remove(id, userId, role) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });
        if (!comment)
            throw new common_1.NotFoundException('의견을 찾을 수 없습니다');
        if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin') {
            throw new common_1.ForbiddenException('삭제 권한이 없습니다');
        }
        await this.prisma.comment.delete({ where: { id } });
        return { success: true };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        forbidden_words_service_1.ForbiddenWordsService])
], CommentsService);
