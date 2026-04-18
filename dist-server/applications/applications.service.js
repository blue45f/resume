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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const STATUS_LABEL = {
    applied: '지원 완료',
    screening: '서류 심사 중',
    interview: '면접 진행',
    offer: '오퍼 제안',
    rejected: '불합격',
    withdrawn: '지원 취소',
};
let ApplicationsService = class ApplicationsService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async findAll(userId) {
        const applications = await this.prisma.jobApplication.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
        return applications;
    }
    async getStats(userId) {
        const all = await this.prisma.jobApplication.findMany({ where: { userId } });
        const statusCounts = {};
        for (const app of all) {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        }
        return { total: all.length, byStatus: statusCounts };
    }
    async create(data, userId) {
        return this.prisma.jobApplication.create({
            data: { ...data, userId },
        });
    }
    async update(id, data, userId) {
        const app = await this.prisma.jobApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        const updated = await this.prisma.jobApplication.update({ where: { id }, data });
        if (data.status && data.status !== app.status && app.userId) {
            const label = STATUS_LABEL[data.status] || data.status;
            await this.notifications
                .create(app.userId, 'application_status', `"${app.company} ${app.position}" 지원 상태가 "${label}"로 변경되었습니다`, `/applications`)
                .catch(() => undefined);
        }
        return updated;
    }
    async remove(id, userId) {
        const app = await this.prisma.jobApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        await this.prisma.jobApplication.delete({ where: { id } });
        return { success: true };
    }
    async findOne(id) {
        return this.prisma.jobApplication.findUnique({ where: { id } });
    }
    async getComments(applicationId) {
        return this.prisma.applicationComment.findMany({
            where: { applicationId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async addComment(applicationId, content, userId) {
        const app = await this.prisma.jobApplication.findUnique({ where: { id: applicationId } });
        if (!app || app.visibility !== 'public') {
            throw new common_1.NotFoundException('공개된 지원 내역만 댓글을 작성할 수 있습니다');
        }
        if (!content || content.trim().length < 5) {
            throw new common_1.ForbiddenException('5자 이상 입력해주세요');
        }
        const cleanContent = content.trim().replace(/<[^>]*>/g, '');
        let authorName = '익명';
        if (userId) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user)
                authorName = user.name || user.email;
        }
        return this.prisma.applicationComment.create({
            data: { applicationId, userId, authorName, content: cleanContent },
        });
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ApplicationsService);
