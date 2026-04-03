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
exports.CoverLettersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CoverLettersService = class CoverLettersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        return this.prisma.coverLetter.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true, company: true, position: true, tone: true,
                content: true, resumeId: true, applicationId: true,
                createdAt: true, updatedAt: true,
            },
        });
    }
    async findOne(id, userId) {
        const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
        if (!cl)
            throw new common_1.NotFoundException('자소서를 찾을 수 없습니다');
        if (cl.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        return cl;
    }
    async create(userId, data) {
        return this.prisma.coverLetter.create({
            data: { userId, ...data },
        });
    }
    async update(id, userId, data) {
        const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
        if (!cl)
            throw new common_1.NotFoundException();
        if (cl.userId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.coverLetter.update({ where: { id }, data });
    }
    async remove(id, userId) {
        const cl = await this.prisma.coverLetter.findUnique({ where: { id } });
        if (!cl)
            throw new common_1.NotFoundException();
        if (cl.userId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.coverLetter.delete({ where: { id } });
        return { success: true };
    }
    async getByResume(resumeId, userId) {
        return this.prisma.coverLetter.findMany({
            where: { resumeId, userId },
            orderBy: { updatedAt: 'desc' },
        });
    }
};
exports.CoverLettersService = CoverLettersService;
exports.CoverLettersService = CoverLettersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoverLettersService);
