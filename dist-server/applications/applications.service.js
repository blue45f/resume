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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ApplicationsService = class ApplicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(userId) {
        const applications = await this.prisma.jobApplication.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
        return applications;
    }
    async getStats(userId) {
        const all = await this.prisma.jobApplication.findMany({ where: { userId } });
        const statusCounts = {};
        for (const app of all) {
            statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
        }
        return { total: all.length, byStatus: statusCounts };
    }
    async create(data, userId) {
        return this.prisma.jobApplication.create({
            data: { ...data, userId },
        });
    }
    async update(id, data, userId) {
        const app = await this.prisma.jobApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        return this.prisma.jobApplication.update({ where: { id }, data });
    }
    async remove(id, userId) {
        const app = await this.prisma.jobApplication.findUnique({ where: { id } });
        if (!app)
            throw new common_1.NotFoundException('지원 내역을 찾을 수 없습니다');
        if (app.userId !== userId)
            throw new common_1.ForbiddenException('권한이 없습니다');
        await this.prisma.jobApplication.delete({ where: { id } });
        return { success: true };
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationsService);
