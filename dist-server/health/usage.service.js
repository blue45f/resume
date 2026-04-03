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
exports.UsageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PLAN_LIMITS = {
    free: { ai_transform: 5, cover_letter: 0, translation: 0, ai_coaching: 0 },
    pro: { ai_transform: -1, cover_letter: -1, translation: -1, ai_coaching: -1 },
    enterprise: { ai_transform: -1, cover_letter: -1, translation: -1, ai_coaching: -1 },
};
let UsageService = class UsageService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkAndLog(userId, feature) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.ForbiddenException('사용자를 찾을 수 없습니다');
        const role = user.role || 'user';
        if (role === 'admin' || role === 'superadmin') {
            await this.prisma.usageLog.create({ data: { userId, feature } });
            return;
        }
        const plan = user.plan || 'free';
        const limit = PLAN_LIMITS[plan]?.[feature] ?? 0;
        if (limit === 0) {
            throw new common_1.ForbiddenException(`이 기능은 ${plan === 'free' ? '프로' : '엔터프라이즈'} 플랜에서 사용 가능합니다`);
        }
        if (limit > 0) {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const count = await this.prisma.usageLog.count({
                where: { userId, feature, createdAt: { gte: startOfMonth } },
            });
            if (count >= limit) {
                throw new common_1.ForbiddenException(`월 ${limit}회 사용 한도에 도달했습니다. 프로 플랜으로 업그레이드하세요.`);
            }
        }
        await this.prisma.usageLog.create({ data: { userId, feature } });
    }
    async getUsage(userId) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const usage = await this.prisma.usageLog.groupBy({
            by: ['feature'],
            where: { userId, createdAt: { gte: startOfMonth } },
            _count: true,
        });
        return usage.map(u => ({ feature: u.feature, count: u._count }));
    }
};
exports.UsageService = UsageService;
exports.UsageService = UsageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsageService);
