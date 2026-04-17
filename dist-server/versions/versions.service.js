"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "VersionsService", {
    enumerable: true,
    get: function() {
        return VersionsService;
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
let VersionsService = class VersionsService {
    async findAll(resumeId) {
        const versions = await this.prisma.resumeVersion.findMany({
            where: {
                resumeId
            },
            orderBy: {
                versionNumber: 'desc'
            },
            select: {
                id: true,
                versionNumber: true,
                description: true,
                createdAt: true
            }
        });
        return versions.map((v)=>({
                ...v,
                createdAt: v.createdAt.toISOString()
            }));
    }
    async findOne(resumeId, versionId) {
        const version = await this.prisma.resumeVersion.findFirst({
            where: {
                id: versionId,
                resumeId
            }
        });
        if (!version) throw new _common.NotFoundException('버전을 찾을 수 없습니다');
        return {
            ...version,
            snapshot: JSON.parse(version.snapshot),
            createdAt: version.createdAt.toISOString()
        };
    }
    async restore(resumeId, versionId, userId) {
        const version = await this.prisma.resumeVersion.findFirst({
            where: {
                id: versionId,
                resumeId
            },
            include: {
                resume: {
                    select: {
                        userId: true
                    }
                }
            }
        });
        if (!version) throw new _common.NotFoundException('버전을 찾을 수 없습니다');
        // 소유권 검증
        if (version.resume.userId && version.resume.userId !== userId) {
            throw new _common.ForbiddenException('이 이력서의 버전을 복원할 권한이 없습니다');
        }
        let snapshot;
        try {
            snapshot = JSON.parse(version.snapshot);
        } catch  {
            throw new _common.BadRequestException('버전 데이터가 손상되었습니다');
        }
        // Use a transaction to restore
        await this.prisma.$transaction(async (tx)=>{
            await tx.resume.update({
                where: {
                    id: resumeId
                },
                data: {
                    title: snapshot.title
                }
            });
            if (snapshot.personalInfo) {
                const piData = {
                    ...snapshot.personalInfo
                };
                // links가 배열이면 JSON으로 변환
                if (Array.isArray(piData.links)) piData.links = JSON.stringify(piData.links);
                // id 필드 제거 (Prisma가 자동 생성)
                delete piData.id;
                await tx.personalInfo.upsert({
                    where: {
                        resumeId
                    },
                    create: {
                        resumeId,
                        ...piData
                    },
                    update: piData
                });
            }
            // Replace collections
            await tx.experience.deleteMany({
                where: {
                    resumeId
                }
            });
            if (snapshot.experiences?.length) {
                await tx.experience.createMany({
                    data: snapshot.experiences.map((e, i)=>({
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
                            sortOrder: i
                        }))
                });
            }
            await tx.education.deleteMany({
                where: {
                    resumeId
                }
            });
            if (snapshot.educations?.length) {
                await tx.education.createMany({
                    data: snapshot.educations.map((e, i)=>({
                            resumeId,
                            school: e.school || '',
                            degree: e.degree || '',
                            field: e.field || '',
                            gpa: e.gpa || '',
                            startDate: e.startDate || '',
                            endDate: e.endDate || '',
                            description: e.description || '',
                            sortOrder: i
                        }))
                });
            }
            await tx.skill.deleteMany({
                where: {
                    resumeId
                }
            });
            if (snapshot.skills?.length) {
                await tx.skill.createMany({
                    data: snapshot.skills.map((s, i)=>({
                            resumeId,
                            category: s.category || '',
                            items: s.items || '',
                            sortOrder: i
                        }))
                });
            }
            await tx.project.deleteMany({
                where: {
                    resumeId
                }
            });
            if (snapshot.projects?.length) {
                await tx.project.createMany({
                    data: snapshot.projects.map((p, i)=>({
                            resumeId,
                            name: p.name || '',
                            company: p.company || '',
                            role: p.role || '',
                            startDate: p.startDate || '',
                            endDate: p.endDate || '',
                            description: p.description || '',
                            techStack: p.techStack || '',
                            link: p.link || '',
                            sortOrder: i
                        }))
                });
            }
        });
        return {
            success: true,
            restoredVersion: version.versionNumber
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
VersionsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], VersionsService);
