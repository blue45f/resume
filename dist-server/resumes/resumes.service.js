"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    async findAll(userId, page = 1, limit = 20) {
        const where = userId ? { userId } : {};
        const [resumes, total] = await Promise.all([
            this.prisma.resume.findMany({
                where,
                include: {
                    personalInfo: {
                        select: { name: true, email: true, phone: true, summary: true, photo: true },
                    },
                    tags: { include: { tag: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.resume.count({ where }),
        ]);
        return {
            data: resumes.map((r) => this.formatSummary(r)),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
        };
    }
    async findPublic(page = 1, limit = 20) {
        const where = { visibility: 'public' };
        const [resumes, total] = await Promise.all([
            this.prisma.resume.findMany({
                where,
                include: {
                    personalInfo: {
                        select: { name: true, email: true, phone: true, summary: true, photo: true },
                    },
                    tags: { include: { tag: true } },
                },
                orderBy: { updatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.resume.count({ where }),
        ]);
        return {
            data: resumes.map((r) => this.formatSummary(r)),
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
        };
    }
    async searchPublic(opts) {
        const where = { visibility: 'public' };
        if (opts.query) {
            where.OR = [
                { title: { contains: opts.query, mode: 'insensitive' } },
                { personalInfo: { name: { contains: opts.query, mode: 'insensitive' } } },
                { personalInfo: { summary: { contains: opts.query, mode: 'insensitive' } } },
                { skills: { some: { items: { contains: opts.query, mode: 'insensitive' } } } },
            ];
        }
        if (opts.tag) {
            where.tags = { some: { tag: { name: opts.tag } } };
        }
        const orderBy = opts.sort === 'views'
            ? { viewCount: 'desc' }
            : { updatedAt: 'desc' };
        const [resumes, total] = await Promise.all([
            this.prisma.resume.findMany({
                where,
                include: {
                    personalInfo: {
                        select: { name: true, email: true, phone: true, summary: true, photo: true },
                    },
                    tags: { include: { tag: true } },
                    skills: { select: { id: true, category: true, items: true }, take: 5 },
                },
                orderBy,
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
            limit: opts.limit,
        };
    }
    async findBySlug(username, slug) {
        const user = await this.prisma.user.findFirst({ where: { username } });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다');
        const resume = await this.prisma.resume.findFirst({
            where: { userId: user.id, slug },
            include: FULL_INCLUDE,
        });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        if (resume.visibility === 'private') {
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        }
        this.prisma.resume.update({ where: { id: resume.id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
        return this.formatFull(resume);
    }
    async findOne(id, userId) {
        const resume = await this.prisma.resume.findUnique({
            where: { id },
            include: FULL_INCLUDE,
        });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        if (resume.visibility === 'private' && resume.userId && resume.userId !== userId) {
            throw new common_1.ForbiddenException('이 이력서에 접근할 권한이 없습니다');
        }
        if (!userId || resume.userId !== userId) {
            this.prisma.resume.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
        }
        const result = this.formatFull(resume);
        const bookmarkCount = await this.prisma.bookmark.count({ where: { resumeId: id } });
        return { ...result, bookmarkCount };
    }
    async verifyOwnership(resumeId, userId, role) {
        const resume = await this.prisma.resume.findUnique({ where: { id: resumeId } });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        if (role === 'admin' || role === 'superadmin')
            return resume;
        if (resume.userId && resume.userId !== userId) {
            throw new common_1.ForbiddenException('이 이력서를 수정할 권한이 없습니다');
        }
        return resume;
    }
    async setVisibility(id, visibility, userId, role) {
        if (!['public', 'private', 'link-only'].includes(visibility)) {
            throw new common_1.BadRequestException('유효하지 않은 공개 설정입니다. public, private, link-only 중 하나를 선택하세요');
        }
        await this.verifyOwnership(id, userId, role);
        await this.prisma.resume.update({ where: { id }, data: { visibility } });
        return { id, visibility };
    }
    async updateSlug(id, slug, userId, role) {
        await this.verifyOwnership(id, userId, role);
        const sanitized = slug
            .toLowerCase()
            .replace(/[^\w가-힣-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60);
        if (!sanitized)
            throw new common_1.BadRequestException('유효한 슬러그를 입력해 주세요');
        const existing = await this.prisma.resume.findFirst({
            where: { slug: sanitized, id: { not: id } },
        });
        if (existing)
            throw new common_1.BadRequestException('이미 사용 중인 슬러그입니다');
        await this.prisma.resume.update({ where: { id }, data: { slug: sanitized } });
        return { id, slug: sanitized };
    }
    generateSlug(title) {
        return (title || 'untitled')
            .replace(/[^\w가-힣\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase()
            .slice(0, 60) || 'untitled';
    }
    async create(dto, userId) {
        const slug = this.generateSlug(dto.title || '');
        const resume = await this.prisma.resume.create({
            data: {
                title: dto.title || '',
                slug,
                userId: userId || null,
                personalInfo: dto.personalInfo ? { create: {
                        ...dto.personalInfo,
                        links: dto.personalInfo.links ? JSON.stringify(dto.personalInfo.links) : '[]',
                    } } : undefined,
                experiences: dto.experiences?.length ? {
                    create: dto.experiences.map((e, i) => ({
                        company: e.company || '', position: e.position || '',
                        department: e.department || '',
                        startDate: e.startDate || '', endDate: e.endDate || '',
                        current: e.current || false, description: e.description || '',
                        achievements: e.achievements || '', techStack: e.techStack || '',
                        sortOrder: e.sortOrder ?? i,
                    })),
                } : undefined,
                educations: dto.educations?.length ? {
                    create: dto.educations.map((e, i) => ({
                        school: e.school || '', degree: e.degree || '', field: e.field || '',
                        gpa: e.gpa || '',
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
                        name: p.name || '', company: p.company || '', role: p.role || '',
                        startDate: p.startDate || '', endDate: p.endDate || '',
                        description: p.description || '', techStack: p.techStack || '',
                        link: p.link || '', sortOrder: p.sortOrder ?? i,
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
    async update(id, dto, userId) {
        const existing = await this.verifyOwnership(id, userId);
        await this.saveVersionSnapshot(id);
        await this.prisma.$transaction(async (tx) => {
            await tx.resume.update({ where: { id }, data: { title: dto.title ?? existing.title } });
            if (dto.personalInfo) {
                const piData = {
                    ...dto.personalInfo,
                    links: dto.personalInfo.links ? JSON.stringify(dto.personalInfo.links) : undefined,
                };
                await tx.personalInfo.upsert({
                    where: { resumeId: id },
                    create: { resumeId: id, ...piData, links: piData.links || '[]' },
                    update: piData,
                });
            }
            await replaceCollection(tx, tx.experience, id, dto.experiences, (e, i) => ({
                company: e.company || '', position: e.position || '',
                department: e.department || '',
                startDate: e.startDate || '', endDate: e.endDate || '',
                current: e.current || false, description: e.description || '',
                achievements: e.achievements || '', techStack: e.techStack || '',
                sortOrder: e.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.education, id, dto.educations, (e, i) => ({
                school: e.school || '', degree: e.degree || '', field: e.field || '',
                gpa: e.gpa || '',
                startDate: e.startDate || '', endDate: e.endDate || '',
                description: e.description || '', sortOrder: e.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.skill, id, dto.skills, (s, i) => ({
                category: s.category || '', items: s.items || '', sortOrder: s.sortOrder ?? i,
            }));
            await replaceCollection(tx, tx.project, id, dto.projects, (p, i) => ({
                name: p.name || '', company: p.company || '', role: p.role || '',
                startDate: p.startDate || '', endDate: p.endDate || '',
                description: p.description || '', techStack: p.techStack || '',
                link: p.link || '', sortOrder: p.sortOrder ?? i,
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
    async transferOwnership(id, newUserId) {
        const resume = await this.prisma.resume.findUnique({ where: { id } });
        if (!resume)
            throw new common_1.NotFoundException('이력서를 찾을 수 없습니다');
        const user = await this.prisma.user.findUnique({ where: { id: newUserId } });
        if (!user)
            throw new common_1.NotFoundException('대상 사용자를 찾을 수 없습니다');
        await this.prisma.resume.update({ where: { id }, data: { userId: newUserId } });
        return { success: true, message: `이력서가 ${user.name}에게 이전되었습니다` };
    }
    async remove(id, userId, role) {
        await this.verifyOwnership(id, userId, role);
        try {
            const { v2: cloudinary } = await Promise.resolve().then(() => __importStar(require('cloudinary')));
            const attachments = await this.prisma.attachment.findMany({
                where: { resumeId: id },
                select: { filename: true },
            });
            for (const att of attachments) {
                if (att.filename?.startsWith('http')) {
                    const parts = att.filename.split('/upload/');
                    if (parts[1]) {
                        const publicId = parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '');
                        cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }).catch(() => { });
                    }
                }
            }
        }
        catch { }
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
    incrementViewCount(id) {
        this.prisma.resume.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => { });
    }
    async addBookmark(resumeId, userId) {
        try {
            await this.prisma.bookmark.create({ data: { userId, resumeId } });
        }
        catch { }
        return { bookmarked: true };
    }
    async removeBookmark(resumeId, userId) {
        await this.prisma.bookmark.deleteMany({ where: { userId, resumeId } });
        return { bookmarked: false };
    }
    async getBookmarks(userId) {
        const bookmarks = await this.prisma.bookmark.findMany({
            where: { userId },
            include: { resume: { include: { personalInfo: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' },
        });
        return bookmarks.map(b => ({
            id: b.id,
            resumeId: b.resume.id,
            title: b.resume.title,
            name: b.resume.personalInfo?.name || '',
            createdAt: b.createdAt.toISOString(),
        }));
    }
    async isBookmarked(resumeId, userId) {
        const bookmark = await this.prisma.bookmark.findFirst({ where: { userId, resumeId } });
        return !!bookmark;
    }
    formatSummary(resume) {
        const pi = resume.personalInfo;
        return {
            id: resume.id, title: resume.title, slug: resume.slug || '', userId: resume.userId || '', viewCount: resume.viewCount || 0, visibility: resume.visibility || 'private',
            personalInfo: pi
                ? {
                    name: pi.name, email: pi.email, phone: pi.phone, address: pi.address,
                    website: pi.website, github: pi.github || '', summary: pi.summary, photo: pi.photo || '',
                    birthYear: pi.birthYear || '',
                    links: pi.links ? (typeof pi.links === 'string' ? JSON.parse(pi.links || '[]') : pi.links) : [],
                    military: pi.military || '',
                }
                : { name: '', email: '', phone: '', address: '', website: '', github: '', summary: '', photo: '', birthYear: '', links: [], military: '' },
            tags: resume.tags?.map((t) => ({ id: t.tag.id, name: t.tag.name, color: t.tag.color })) ?? [],
            skills: resume.skills?.map((s) => ({ id: s.id, category: s.category, items: s.items })) ?? [],
            createdAt: resume.createdAt.toISOString(),
            updatedAt: resume.updatedAt.toISOString(),
        };
    }
    formatFull(resume) {
        const pick = (arr, fields) => arr?.map((item) => Object.fromEntries(fields.map(f => [f, item[f]]))) ?? [];
        return {
            ...this.formatSummary(resume),
            experiences: pick(resume.experiences, ['id', 'company', 'position', 'department', 'startDate', 'endDate', 'current', 'description', 'achievements', 'techStack']),
            educations: pick(resume.educations, ['id', 'school', 'degree', 'field', 'gpa', 'startDate', 'endDate', 'description']),
            skills: pick(resume.skills, ['id', 'category', 'items']),
            projects: pick(resume.projects, ['id', 'name', 'company', 'role', 'startDate', 'endDate', 'description', 'techStack', 'link']),
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
