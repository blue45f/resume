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
exports.InterviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InterviewService = class InterviewService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, data) {
        if (!data?.question || typeof data.question !== 'string' || !data.question.trim()) {
            throw new common_1.BadRequestException('질문은 필수입니다');
        }
        if (!data?.answer || typeof data.answer !== 'string' || !data.answer.trim()) {
            throw new common_1.BadRequestException('답변은 필수입니다');
        }
        return this.prisma.interviewAnswer.create({
            data: {
                userId,
                question: data.question,
                answer: data.answer,
                resumeId: data.resumeId ?? null,
                jobRole: data.jobRole ?? null,
            },
        });
    }
    async findAll(userId) {
        return this.prisma.interviewAnswer.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                question: true,
                answer: true,
                resumeId: true,
                jobRole: true,
                createdAt: true,
            },
        });
    }
    async remove(id, userId) {
        const item = await this.prisma.interviewAnswer.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('답변을 찾을 수 없습니다');
        if (item.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        await this.prisma.interviewAnswer.delete({ where: { id } });
        return { success: true };
    }
};
exports.InterviewService = InterviewService;
exports.InterviewService = InterviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InterviewService);
