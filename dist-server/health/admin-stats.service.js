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
exports.AdminStatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminStatsService = class AdminStatsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [totalUsers, totalResumes, totalTemplates, totalTags, totalComments, totalApplications, totalVersions, totalTransforms, newUsersToday, newUsersWeek, newUsersMonth, newResumesToday, newResumesWeek, totalViews, publicResumes,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.resume.count(),
            this.prisma.template.count(),
            this.prisma.tag.count(),
            this.prisma.comment.count(),
            this.prisma.jobApplication.count(),
            this.prisma.resumeVersion.count(),
            this.prisma.llmTransformation.count(),
            this.prisma.user.count({ where: { createdAt: { gte: today } } }),
            this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
            this.prisma.resume.count({ where: { createdAt: { gte: today } } }),
            this.prisma.resume.count({ where: { createdAt: { gte: weekAgo } } }),
            this.prisma.resume.aggregate({ _sum: { viewCount: true } }),
            this.prisma.resume.count({ where: { visibility: 'public' } }),
        ]);
        const recentUsers = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: { id: true, name: true, email: true, provider: true, createdAt: true },
        });
        return {
            users: { total: totalUsers, today: newUsersToday, week: newUsersWeek, month: newUsersMonth },
            resumes: { total: totalResumes, today: newResumesToday, week: newResumesWeek, public: publicResumes },
            content: { templates: totalTemplates, tags: totalTags, comments: totalComments, versions: totalVersions },
            activity: { applications: totalApplications, transforms: totalTransforms, totalViews: totalViews._sum.viewCount || 0 },
            recentUsers: recentUsers.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                provider: u.provider,
                createdAt: u.createdAt.toISOString(),
            })),
        };
    }
};
exports.AdminStatsService = AdminStatsService;
exports.AdminStatsService = AdminStatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminStatsService);
