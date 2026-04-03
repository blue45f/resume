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
exports.VersionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VersionsService = class VersionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(resumeId) {
        const versions = await this.prisma.resumeVersion.findMany({
            where: { resumeId },
            orderBy: { versionNumber: 'desc' },
            select: {
                id: true,
                versionNumber: true,
                description: true,
                createdAt: true,
            },
        });
        return versions.map((v) => ({
            ...v,
            createdAt: v.createdAt.toISOString(),
        }));
    }
    async findOne(resumeId, versionId) {
        const version = await this.prisma.resumeVersion.findFirst({
            where: { id: versionId, resumeId },
        });
        if (!version)
            throw new common_1.NotFoundException('버전을 찾을 수 없습니다');
        return {
            ...version,
            snapshot: JSON.parse(version.snapshot),
            createdAt: version.createdAt.toISOString(),
        };
    }
    async restore(resumeId, versionId, userId) {
        const version = await this.prisma.resumeVersion.findFirst({
            where: { id: versionId, resumeId },
            include: { resume: { select: { userId: true } } },
        });
        if (!version)
            throw new common_1.NotFoundException('버전을 찾을 수 없습니다');
        if (version.resume.userId && version.resume.userId !== userId) {
            throw new common_1.ForbiddenException('이 이력서의 버전을 복원할 권한이 없습니다');
        }
        let snapshot;
        try {
            snapshot = JSON.parse(version.snapshot);
        }
        catch {
            throw new common_1.BadRequestException('버전 데이터가 손상되었습니다');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.resume.update({
                where: { id: resumeId },
                data: { title: snapshot.title },
            });
            if (snapshot.personalInfo) {
                const piData = { ...snapshot.personalInfo };
                if (Array.isArray(piData.links))
                    piData.links = JSON.stringify(piData.links);
                delete piData.id;
                await tx.personalInfo.upsert({
                    where: { resumeId },
                    create: { resumeId, ...piData },
                    update: piData,
                });
            }
            await tx.experience.deleteMany({ where: { resumeId } });
            if (snapshot.experiences?.length) {
                await tx.experience.createMany({
                    data: snapshot.experiences.map((e, i) => ({
                        resumeId,
                        company: e.company || '',
                        position: e.position || '',
                        department: e.department || '',
                        startDate: e.startDate || '',
                        endDate: e.endDate || '',
                        current: e.current || false,
                        description: e.description || '',
                        achievements: e.achievements || '',
                        techStack: e.techStack || '',
                        sortOrder: i,
                    })),
                });
            }
            await tx.education.deleteMany({ where: { resumeId } });
            if (snapshot.educations?.length) {
                await tx.education.createMany({
                    data: snapshot.educations.map((e, i) => ({
                        resumeId,
                        school: e.school || '',
                        degree: e.degree || '',
                        field: e.field || '',
                        gpa: e.gpa || '',
                        startDate: e.startDate || '',
                        endDate: e.endDate || '',
                        description: e.description || '',
                        sortOrder: i,
                    })),
                });
            }
            await tx.skill.deleteMany({ where: { resumeId } });
            if (snapshot.skills?.length) {
                await tx.skill.createMany({
                    data: snapshot.skills.map((s, i) => ({
                        resumeId,
                        category: s.category || '',
                        items: s.items || '',
                        sortOrder: i,
                    })),
                });
            }
            await tx.project.deleteMany({ where: { resumeId } });
            if (snapshot.projects?.length) {
                await tx.project.createMany({
                    data: snapshot.projects.map((p, i) => ({
                        resumeId,
                        name: p.name || '',
                        company: p.company || '',
                        role: p.role || '',
                        startDate: p.startDate || '',
                        endDate: p.endDate || '',
                        description: p.description || '',
                        techStack: p.techStack || '',
                        link: p.link || '',
                        sortOrder: i,
                    })),
                });
            }
        });
        return { success: true, restoredVersion: version.versionNumber };
    }
};
exports.VersionsService = VersionsService;
exports.VersionsService = VersionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VersionsService);
