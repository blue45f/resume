"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CommentsService", {
    enumerable: true,
    get: function() {
        return CommentsService;
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
let CommentsService = class CommentsService {
    async findByResume(resumeId) {
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId
            }
        });
        if (!resume || resume.visibility !== 'public') {
            throw new _common.NotFoundException('공개 이력서를 찾을 수 없습니다');
        }
        return this.prisma.comment.findMany({
            where: {
                resumeId
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }
    async create(resumeId, content, userId, authorName, parentId) {
        await this.forbiddenWords.validateOrThrow(content);
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId
            }
        });
        if (!resume || resume.visibility !== 'public') {
            throw new _common.NotFoundException('공개 이력서에만 의견을 남길 수 있습니다');
        }
        if (!content || content.trim().length < 5) {
            throw new _common.ForbiddenException('의견은 5자 이상 입력해주세요');
        }
        if (content.length > 500) {
            throw new _common.ForbiddenException('의견은 500자 이내로 입력해주세요');
        }
        const cleanContent = content.trim().replace(/<[^>]*>/g, '');
        let name = authorName || '익명';
        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: userId
                }
            });
            if (user) name = user.name || user.email;
        }
        const comment = await this.prisma.comment.create({
            data: {
                resumeId,
                userId,
                authorName: name,
                content: cleanContent,
                parentId: parentId || null
            }
        });
        if (parentId) {
            const parent = await this.prisma.comment.findUnique({
                where: {
                    id: parentId
                },
                select: {
                    userId: true
                }
            });
            if (parent?.userId && parent.userId !== userId) {
                await this.notificationsService.create(parent.userId, 'comment', `${name}님이 내 의견에 답글을 달았습니다.`, `/resumes/${resumeId}/preview`).catch(()=>{});
            }
        } else if (resume.userId && resume.userId !== userId) {
            await this.notificationsService.create(resume.userId, 'comment', `${name}님이 이력서에 의견을 남겼습니다: "${content.slice(0, 50)}..."`, `/resumes/${resumeId}/preview`);
        }
        return comment;
    }
    async remove(id, userId, role) {
        const comment = await this.prisma.comment.findUnique({
            where: {
                id
            }
        });
        if (!comment) throw new _common.NotFoundException('의견을 찾을 수 없습니다');
        // Author or admin can delete
        if (comment.userId !== userId && role !== 'admin' && role !== 'superadmin') {
            throw new _common.ForbiddenException('삭제 권한이 없습니다');
        }
        await this.prisma.comment.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    constructor(prisma, notificationsService, forbiddenWords){
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.forbiddenWords = forbiddenWords;
    }
};
CommentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _forbiddenwordsservice.ForbiddenWordsService === "undefined" ? Object : _forbiddenwordsservice.ForbiddenWordsService
    ])
], CommentsService);
