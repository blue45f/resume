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
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let JobsService = class JobsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(status = 'active', query) {
        const where = { status };
        if (query) {
            where.OR = [
                { position: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { skills: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
            ];
        }
        return this.prisma.jobPost.findMany({
            where,
            include: { user: { select: { id: true, name: true, companyName: true, avatar: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async findOne(id) {
        const job = await this.prisma.jobPost.findUnique({
            where: { id },
            include: { user: { select: { id: true, name: true, companyName: true, avatar: true, email: true } } },
        });
        if (!job)
            throw new common_1.NotFoundException('채용 공고를 찾을 수 없습니다');
        return job;
    }
    async findByUser(userId) {
        return this.prisma.jobPost.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.userType === 'personal') {
            throw new common_1.ForbiddenException('채용 공고는 리크루터 또는 기업 회원만 등록할 수 있습니다');
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
                status: data.status || 'active',
            },
        });
    }
    async update(id, userId, data) {
        const job = await this.prisma.jobPost.findUnique({ where: { id } });
        if (!job)
            throw new common_1.NotFoundException();
        if (job.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.jobPost.update({ where: { id }, data });
    }
    async remove(id, userId, role) {
        const job = await this.prisma.jobPost.findUnique({ where: { id } });
        if (!job)
            throw new common_1.NotFoundException();
        if (job.userId !== userId && role !== 'admin' && role !== 'superadmin')
            throw new common_1.ForbiddenException();
        await this.prisma.jobPost.delete({ where: { id } });
        return { success: true };
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobsService);
