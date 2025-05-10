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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUserDashboard(userId) {
        const [resumes, totalViews, recentVersions, transformCount] = await Promise.all([
            this.prisma.resume.findMany({
                where: { userId },
                select: { id: true, title: true, viewCount: true, visibility: true, updatedAt: true },
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.resume.aggregate({
                where: { userId },
                _sum: { viewCount: true },
            }),
            this.prisma.resumeVersion.findMany({
                where: { resume: { userId } },
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, versionNumber: true, createdAt: true, resumeId: true },
            }),
            this.prisma.llmTransformation.count({
                where: { resume: { userId } },
            }),
        ]);
        const totalResumes = resumes.length;
        const publicResumes = resumes.filter(r => r.visibility === 'public').length;
        const views = totalViews._sum.viewCount || 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentActivity = await this.prisma.resumeVersion.count({
            where: { resume: { userId }, createdAt: { gte: sevenDaysAgo } },
        });
        return {
            summary: {
                totalResumes,
                publicResumes,
                totalViews: views,
                totalTransforms: transformCount,
                recentEdits: recentActivity,
            },
            resumes: resumes.map(r => ({
                id: r.id,
                title: r.title,
                viewCount: r.viewCount,
                visibility: r.visibility,
                updatedAt: r.updatedAt.toISOString(),
            })),
            recentVersions: recentVersions.map(v => ({
                id: v.id,
                versionNumber: v.versionNumber,
                resumeId: v.resumeId,
                createdAt: v.createdAt.toISOString(),
            })),
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
