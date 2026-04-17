"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JobsService", {
    enumerable: true,
    get: function() {
        return JobsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _systemconfigservice = require("../system-config/system-config.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let JobsService = class JobsService {
    async findAll(status = 'active', query) {
        const where = {
            status
        };
        if (query) {
            where.OR = [
                {
                    position: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    company: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    skills: {
                        contains: query,
                        mode: 'insensitive'
                    }
                },
                {
                    location: {
                        contains: query,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        return this.prisma.jobPost.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        avatar: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });
    }
    async findOne(id) {
        const job = await this.prisma.jobPost.findUnique({
            where: {
                id
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true,
                        avatar: true,
                        email: true
                    }
                }
            }
        });
        if (!job) throw new _common.NotFoundException('채용 공고를 찾을 수 없습니다');
        return job;
    }
    async findByUser(userId) {
        return this.prisma.jobPost.findMany({
            where: {
                userId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async create(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user || user.userType === 'personal') {
            throw new _common.ForbiddenException('채용 공고는 리크루터 또는 기업 회원만 등록할 수 있습니다');
        }
        return this.prisma.jobPost.create({
            data: {
                userId,
                company: data.company || user.companyName || '',
                position: data.position || '',
                location: data.location || '',
                salary: data.salary || '',
                description: data.description || '',
                requirements: data.requirements || '',
                benefits: data.benefits || '',
                type: data.type || 'fulltime',
                skills: data.skills || '',
                status: data.status || 'active'
            }
        });
    }
    async update(id, userId, data) {
        const job = await this.prisma.jobPost.findUnique({
            where: {
                id
            }
        });
        if (!job) throw new _common.NotFoundException();
        if (job.userId !== userId) throw new _common.ForbiddenException();
        return this.prisma.jobPost.update({
            where: {
                id
            },
            data
        });
    }
    async remove(id, userId, role) {
        const job = await this.prisma.jobPost.findUnique({
            where: {
                id
            }
        });
        if (!job) throw new _common.NotFoundException();
        if (job.userId !== userId && role !== 'admin' && role !== 'superadmin') throw new _common.ForbiddenException();
        await this.prisma.jobPost.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    // ── External Job Links ──────────────────────────────────────────────
    async getExternalLinks(filters) {
        const andClauses = [
            {
                isActive: true
            }
        ];
        if (filters.category && filters.category !== 'all') {
            andClauses.push({
                category: filters.category
            });
        }
        if (filters.companySize && filters.companySize !== 'all') {
            andClauses.push({
                OR: [
                    {
                        companySize: filters.companySize
                    },
                    {
                        companySize: 'all'
                    }
                ]
            });
        }
        if (filters.careerLevel && filters.careerLevel !== 'all') {
            andClauses.push({
                OR: [
                    {
                        careerLevel: filters.careerLevel
                    },
                    {
                        careerLevel: 'all'
                    }
                ]
            });
        }
        if (filters.location && filters.location !== 'all') {
            andClauses.push({
                OR: [
                    {
                        location: filters.location
                    },
                    {
                        location: 'nationwide'
                    },
                    {
                        location: 'all'
                    }
                ]
            });
        }
        if (filters.jobCategory && filters.jobCategory !== 'all') {
            andClauses.push({
                OR: [
                    {
                        jobCategory: filters.jobCategory
                    },
                    {
                        jobCategory: 'all'
                    }
                ]
            });
        }
        if (filters.jobType && filters.jobType !== 'all') {
            andClauses.push({
                OR: [
                    {
                        jobTypes: {
                            contains: filters.jobType
                        }
                    },
                    {
                        jobTypes: 'all'
                    }
                ]
            });
        }
        if (filters.q) {
            const q = filters.q;
            andClauses.push({
                OR: [
                    {
                        name: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    },
                    {
                        badgeText: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        }
        return this.prisma.externalJobLink.findMany({
            where: {
                AND: andClauses
            },
            orderBy: [
                {
                    order: 'asc'
                },
                {
                    clickCount: 'desc'
                }
            ]
        });
    }
    async recordExternalLinkClick(id) {
        const link = await this.prisma.externalJobLink.findUnique({
            where: {
                id
            }
        });
        if (!link) throw new _common.NotFoundException();
        await this.prisma.externalJobLink.update({
            where: {
                id
            },
            data: {
                clickCount: {
                    increment: 1
                }
            }
        });
        return {
            url: link.url
        };
    }
    async createExternalLink(data, user) {
        const allowed = await this.config.checkPermission('perm.externalLinks.create', user);
        if (!allowed) throw new _common.ForbiddenException('채용 링크 등록 권한이 없습니다');
        return this.prisma.externalJobLink.create({
            data
        });
    }
    async updateExternalLink(id, data, user) {
        const allowed = await this.config.checkPermission('perm.externalLinks.edit', user);
        if (!allowed) throw new _common.ForbiddenException();
        return this.prisma.externalJobLink.update({
            where: {
                id
            },
            data
        });
    }
    async deleteExternalLink(id, user) {
        const allowed = await this.config.checkPermission('perm.externalLinks.delete', user);
        if (!allowed) throw new _common.ForbiddenException();
        await this.prisma.externalJobLink.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    // ── Curated Jobs (외부 채용 정보 카드) ─────────────────────────────
    async getCuratedJobs(filters) {
        const where = {
            status: 'active'
        };
        if (filters.jobType && filters.jobType !== 'all') {
            where.jobType = filters.jobType;
        }
        if (filters.experienceLevel && filters.experienceLevel !== 'all') {
            where.experienceLevel = filters.experienceLevel;
        }
        if (filters.companySize && filters.companySize !== 'all') {
            where.companySize = filters.companySize;
        }
        if (filters.industry && filters.industry !== 'all') {
            where.industry = filters.industry;
        }
        if (filters.location && filters.location !== 'all') {
            where.location = {
                contains: filters.location,
                mode: 'insensitive'
            };
        }
        if (filters.q) {
            where.OR = [
                {
                    company: {
                        contains: filters.q,
                        mode: 'insensitive'
                    }
                },
                {
                    position: {
                        contains: filters.q,
                        mode: 'insensitive'
                    }
                },
                {
                    skills: {
                        contains: filters.q,
                        mode: 'insensitive'
                    }
                },
                {
                    summary: {
                        contains: filters.q,
                        mode: 'insensitive'
                    }
                }
            ];
        }
        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 20, 50);
        const [items, total] = await Promise.all([
            this.prisma.curatedJob.findMany({
                where,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            companyName: true
                        }
                    }
                },
                orderBy: [
                    {
                        deadline: 'asc'
                    },
                    {
                        createdAt: 'desc'
                    }
                ],
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.curatedJob.count({
                where
            })
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async getCuratedJob(id) {
        const job = await this.prisma.curatedJob.findUnique({
            where: {
                id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        companyName: true
                    }
                }
            }
        });
        if (!job) throw new _common.NotFoundException();
        await this.prisma.curatedJob.update({
            where: {
                id
            },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        });
        return job;
    }
    async createCuratedJob(data, userId, userRole, userType) {
        const allowed = await this.config.checkPermission('perm.curatedJobs.create', {
            id: userId,
            role: userRole,
            userType
        });
        if (!allowed) throw new _common.ForbiddenException('채용 정보 등록 권한이 없습니다');
        return this.prisma.curatedJob.create({
            data: {
                company: data.company || '',
                companyLogo: data.companyLogo || '',
                position: data.position || '',
                department: data.department || '',
                summary: data.summary || '',
                requirements: data.requirements || '',
                benefits: data.benefits || '',
                skills: data.skills || '',
                jobType: data.jobType || 'fulltime',
                experienceLevel: data.experienceLevel || 'any',
                education: data.education || '',
                salary: data.salary || '',
                location: data.location || '',
                companySize: data.companySize || '',
                industry: data.industry || '',
                sourceUrl: data.sourceUrl || '',
                sourceSite: data.sourceSite || '',
                deadline: data.deadline ? new Date(data.deadline) : null,
                isRolling: data.isRolling || false,
                authorId: userId
            }
        });
    }
    async updateCuratedJob(id, data, userId, userRole, userType) {
        const job = await this.prisma.curatedJob.findUnique({
            where: {
                id
            }
        });
        if (!job) throw new _common.NotFoundException();
        const allowed = await this.config.checkPermission('perm.curatedJobs.edit', {
            id: userId,
            role: userRole,
            userType
        }, job.authorId);
        if (!allowed) throw new _common.ForbiddenException();
        const updateData = {
            ...data
        };
        if (data.deadline) updateData.deadline = new Date(data.deadline);
        delete updateData.id;
        delete updateData.authorId;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        return this.prisma.curatedJob.update({
            where: {
                id
            },
            data: updateData
        });
    }
    async deleteCuratedJob(id, userId, userRole, userType) {
        const job = await this.prisma.curatedJob.findUnique({
            where: {
                id
            }
        });
        if (!job) throw new _common.NotFoundException();
        const allowed = await this.config.checkPermission('perm.curatedJobs.delete', {
            id: userId,
            role: userRole,
            userType
        }, job.authorId);
        if (!allowed) throw new _common.ForbiddenException();
        await this.prisma.curatedJob.delete({
            where: {
                id
            }
        });
        return {
            success: true
        };
    }
    async getJobStats(location, type, skill) {
        const where = {
            status: 'active'
        };
        if (location) where.location = {
            contains: location,
            mode: 'insensitive'
        };
        if (type) where.type = type;
        const jobs = await this.prisma.jobPost.findMany({
            where,
            select: {
                company: true,
                position: true,
                location: true,
                type: true,
                skills: true,
                salary: true,
                createdAt: true
            }
        });
        const companyCount = {};
        const locationCount = {};
        const typeCount = {};
        const skillCount = {};
        const monthlyCount = {};
        for (const job of jobs){
            if (job.company) companyCount[job.company] = (companyCount[job.company] || 0) + 1;
            if (job.location) {
                const loc = job.location.split(' ')[0];
                locationCount[loc] = (locationCount[loc] || 0) + 1;
            }
            if (job.type) typeCount[job.type] = (typeCount[job.type] || 0) + 1;
            if (job.skills) {
                for (const s of job.skills.split(',').map((s)=>s.trim()).filter(Boolean)){
                    if (!skill || s.toLowerCase().includes(skill.toLowerCase())) {
                        skillCount[s] = (skillCount[s] || 0) + 1;
                    }
                }
            }
            const month = new Date(job.createdAt).toISOString().slice(0, 7);
            monthlyCount[month] = (monthlyCount[month] || 0) + 1;
        }
        const toRanked = (obj, limit = 10)=>Object.entries(obj).sort((a, b)=>b[1] - a[1]).slice(0, limit).map(([name, count])=>({
                    name,
                    count
                }));
        return {
            total: jobs.length,
            byCompany: toRanked(companyCount),
            byLocation: toRanked(locationCount),
            byType: toRanked(typeCount),
            bySkill: toRanked(skillCount, 20),
            byMonth: Object.entries(monthlyCount).sort().map(([month, count])=>({
                    month,
                    count
                }))
        };
    }
    async recordCuratedJobClick(id) {
        const job = await this.prisma.curatedJob.findUnique({
            where: {
                id
            }
        });
        if (!job) throw new _common.NotFoundException();
        await this.prisma.curatedJob.update({
            where: {
                id
            },
            data: {
                clickCount: {
                    increment: 1
                }
            }
        });
        return {
            sourceUrl: job.sourceUrl
        };
    }
    constructor(prisma, config){
        this.prisma = prisma;
        this.config = config;
    }
};
JobsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _systemconfigservice.SystemConfigService === "undefined" ? Object : _systemconfigservice.SystemConfigService
    ])
], JobsService);
