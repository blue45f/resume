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
exports.ResumesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const FULL_INCLUDE = {
    personalInfo: true,
    experiences: { orderBy: { sortOrder: 'asc' } },
    educations: { orderBy: { sortOrder: 'asc' } },
    skills: { orderBy: { sortOrder: 'asc' } },
    projects: { orderBy: { sortOrder: 'asc' } },
    certifications: { orderBy: { sortOrder: 'asc' } },
    languages: { orderBy: { sortOrder: 'asc' } },
    awards: { orderBy: { sortOrder: 'asc' } },
    activities: { orderBy: { sortOrder: 'asc' } },
    tags: { include: { tag: true } },
};
async function replaceCollection(tx, model, resumeId, items, mapper) {
    if (items === undefined)
        return;
    await model.deleteMany({ where: { resumeId } });
    if (items.length > 0) {
        await model.createMany({
            data: items.map((item, i) => ({ resumeId, ...mapper(item, i) })),
        });
    }
}
let ResumesService = class ResumesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        const resumes = await this.prisma.resume.findMany({
            where: userId ? { userId } : {},
            include: { personalInfo: true, tags: { include: { tag: true } } },
            orderBy: { updatedAt: 'desc' },
        });
        return resumes.map((r) => this.formatSummary(r));
    }
    async findPublic() {
        const resumes = await this.prisma.resume.findMany({
            where: { visibility: 'public' },
            include: { personalInfo: true, tags: { include: { tag: true } } },
            orderBy: { updatedAt: 'desc' },
        });
        return resumes.map((r) => this.formatSummary(r));
    }
    async searchPublic(opts) {
        const where = { visibility: 'public' };
        if (opts.query) {
            where.OR = [
                { title: { contains: opts.query, mode: 'insensitive' } },
                { personalInfo: { name: { contains: opts.query, mode: 'insensitive' } } },
                { personalInfo: { summary: { contains: opts.query, mode: 'insensitive' } } },
            ];
        }
        if (opts.tag) {
            where.tags = { some: { tag: { name: opts.tag } } };
        }
        const [resumes, total] = await Promise.all([
            this.prisma.resume.findMany({
                where,
                include: { personalInfo: true, tags: { include: { tag: true } } },
                orderBy: { updatedAt: 'desc' },
                skip: (opts.page - 1) * opts.limit,
                take: opts.limit,
            }),
            this.prisma.resume.count({ where }),
        ]);
        return {
            data: resumes.map((r) => this.formatSummary(r)),
            total,
            page: opts.page,
            totalPages: Math.ceil(total / opts.limit),
        };
    }
    async findOne(id, _userId) {
        const resume = await this.prisma.resume.findUnique({
            where: { id },
            include: FULL_INCLUDE,
        });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        return this.formatFull(resume);
    }
    async setVisibility(id, visibility) {
        if (!['public', 'private', 'link-only'].includes(visibility)) {
            throw new common_1.NotFoundException('유효하지 않은 공개 설정입니다');
        }
        const existing = await this.prisma.resume.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        await this.prisma.resume.update({ where: { id }, data: { visibility } });
        return { id, visibility };
    }
    async create(dto, userId) {
        const resume = await this.prisma.resume.create({
            data: {
                title: dto.title || '',
                userId: userId || null,
                personalInfo: dto.personalInfo ? { create: dto.personalInfo } : undefined,
                experiences: dto.experiences?.length ? {
                    create: dto.experiences.map((e, i) => ({
                        company: e.company || '', position: e.position || '',
                        startDate: e.startDate || '', endDate: e.endDate || '',
                        current: e.current || false, description: e.description || '',
                        sortOrder: e.sortOrder ?? i,
                    })),
                } : undefined,
                educations: dto.educations?.length ? {
                    create: dto.educations.map((e, i) => ({
                        school: e.school || '', degree: e.degree || '', field: e.field || '',
                        startDate: e.startDate || '', endDate: e.endDate || '',
                        description: e.description || '', sortOrder: e.sortOrder ?? i,
                    })),
                } : undefined,
                skills: dto.skills?.length ? {
                    create: dto.skills.map((s, i) => ({
                        category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
                    })),
                } : undefined,
                projects: dto.projects?.length ? {
                    create: dto.projects.map((p, i) => ({
                        name: p.name || '', role: p.role || '',
                        startDate: p.startDate || '', endDate: p.endDate || '',
                        description: p.description || '', link: p.link || '',
                        sortOrder: p.sortOrder ?? i,
                    })),
                } : undefined,
                certifications: dto.certifications?.length ? {
                    create: dto.certifications.map((c, i) => ({
                        name: c.name || '', issuer: c.issuer || '',
                        issueDate: c.issueDate || '', expiryDate: c.expiryDate || '',
                        credentialId: c.credentialId || '', description: c.description || '',
                        sortOrder: c.sortOrder ?? i,
                    })),
                } : undefined,
                languages: dto.languages?.length ? {
                    create: dto.languages.map((l, i) => ({
                        name: l.name || '', testName: l.testName || '',
                        score: l.score || '', testDate: l.testDate || '',
                        sortOrder: l.sortOrder ?? i,
                    })),
                } : undefined,
                awards: dto.awards?.length ? {
                    create: dto.awards.map((a, i) => ({
                        name: a.name || '', issuer: a.issuer || '',
                        awardDate: a.awardDate || '', description: a.description || '',
                        sortOrder: a.sortOrder ?? i,
                    })),
                } : undefined,
                activities: dto.activities?.length ? {
                    create: dto.activities.map((a, i) => ({
                        name: a.name || '', organization: a.organization || '',
                        role: a.role || '', startDate: a.startDate || '',
                        endDate: a.endDate || '', description: a.description || '',
                        sortOrder: a.sortOrder ?? i,
                    })),
                } : undefined,
            },
            include: FULL_INCLUDE,
        });
        return this.formatFull(resume);
    }
    async update(id, dto) {
        const existing = await this.prisma.resume.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        await this.saveVersionSnapshot(id);
        await this.prisma.$transaction(async (tx) => {
            await tx.resume.update({ where: { id }, data: { title: dto.title ?? existing.title } });
            if (dto.personalInfo) {
                await tx.personalInfo.upsert({
                    where: { resumeId: id },
                    create: { resumeId: id, ...dto.personalInfo },
                    update: dto.personalInfo,
                });
            }
            await replaceCollection(tx, tx.experience, id, dto.experiences, (e, i) => ({
                company: e.company || '', position: e.position || '',
                startDate: e.startDate || '', endDate: e.endDate || '',
                current: e.current || false, description: e.description || '',
                sortOrder: e.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.education, id, dto.educations, (e, i) => ({
                school: e.school || '', degree: e.degree || '', field: e.field || '',
                startDate: e.startDate || '', endDate: e.endDate || '',
                description: e.description || '', sortOrder: e.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.skill, id, dto.skills, (s, i) => ({
                category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.project, id, dto.projects, (p, i) => ({
                name: p.name || '', role: p.role || '',
                startDate: p.startDate || '', endDate: p.endDate || '',
                description: p.description || '', link: p.link || '',
                sortOrder: p.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.certification, id, dto.certifications, (c, i) => ({
                name: c.name || '', issuer: c.issuer || '',
                issueDate: c.issueDate || '', expiryDate: c.expiryDate || '',
                credentialId: c.credentialId || '', description: c.description || '',
                sortOrder: c.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.language, id, dto.languages, (l, i) => ({
                name: l.name || '', testName: l.testName || '',
                score: l.score || '', testDate: l.testDate || '',
                sortOrder: l.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.award, id, dto.awards, (a, i) => ({
                name: a.name || '', issuer: a.issuer || '',
                awardDate: a.awardDate || '', description: a.description || '',
                sortOrder: a.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.activity, id, dto.activities, (a, i) => ({
                name: a.name || '', organization: a.organization || '',
                role: a.role || '', startDate: a.startDate || '',
                endDate: a.endDate || '', description: a.description || '',
                sortOrder: a.sortOrder ?? i,
            }));
        });
        return this.findOne(id);
    }
    async remove(id) {
        const existing = await this.prisma.resume.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        await this.prisma.resume.delete({ where: { id } });
        return { success: true };
    }
    async duplicate(id, userId) {
        const source = await this.prisma.resume.findUnique({ where: { id }, include: FULL_INCLUDE });
        if (!source)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        const f = this.formatFull(source);
        return this.create({
            title: `${f.title} (복사본)`,
            personalInfo: f.personalInfo, experiences: f.experiences,
            educations: f.educations, skills: f.skills, projects: f.projects,
            certifications: f.certifications, languages: f.languages,
            awards: f.awards, activities: f.activities,
        }, userId);
    }
    async saveVersionSnapshot(resumeId) {
        const current = await this.prisma.resume.findUnique({ where: { id: resumeId }, include: FULL_INCLUDE });
        if (!current)
            return;
        const lastVersion = await this.prisma.resumeVersion.findFirst({ where: { resumeId }, orderBy: { versionNumber: 'desc' } });
        await this.prisma.resumeVersion.create({
            data: { resumeId, versionNumber: (lastVersion?.versionNumber ?? 0) + 1, snapshot: JSON.stringify(this.formatFull(current)) },
        });
    }
    formatSummary(resume) {
        return {
            id: resume.id, title: resume.title, visibility: resume.visibility || 'private',
            personalInfo: resume.personalInfo
                ? { name: resume.personalInfo.name, email: resume.personalInfo.email, phone: resume.personalInfo.phone, address: resume.personalInfo.address, website: resume.personalInfo.website, summary: resume.personalInfo.summary }
                : { name: '', email: '', phone: '', address: '', website: '', summary: '' },
            tags: resume.tags?.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) ?? [],
            createdAt: resume.createdAt.toISOString(),
            updatedAt: resume.updatedAt.toISOString(),
        };
    }
    formatFull(resume) {
        const pick = (arr, fields) => arr?.map((item) => Object.fromEntries(fields.map(f => [f, item[f]]))) ?? [];
        return {
            ...this.formatSummary(resume),
            experiences: pick(resume.experiences, ['id', 'company', 'position', 'startDate', 'endDate', 'current', 'description']),
            educations: pick(resume.educations, ['id', 'school', 'degree', 'field', 'startDate', 'endDate', 'description']),
            skills: pick(resume.skills, ['id', 'category', 'items']),
            projects: pick(resume.projects, ['id', 'name', 'role', 'startDate', 'endDate', 'description', 'link']),
            certifications: pick(resume.certifications, ['id', 'name', 'issuer', 'issueDate', 'expiryDate', 'credentialId', 'description']),
            languages: pick(resume.languages, ['id', 'name', 'testName', 'score', 'testDate']),
            awards: pick(resume.awards, ['id', 'name', 'issuer', 'awardDate', 'description']),
            activities: pick(resume.activities, ['id', 'name', 'organization', 'role', 'startDate', 'endDate', 'description']),
        };
    }
};
exports.ResumesService = ResumesService;
exports.ResumesService = ResumesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResumesService);
