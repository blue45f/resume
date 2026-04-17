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
exports.CoachingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const COMMISSION_RATE = 0.15;
const VALID_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'refunded'];
let CoachingService = class CoachingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    get coach() {
        return this.prisma.coachProfile;
    }
    get session() {
        return this.prisma.coachingSession;
    }
    async listCoaches(query) {
        const where = { isActive: true };
        if (query.specialty)
            where.specialty = query.specialty;
        if (query.minRate != null || query.maxRate != null) {
            where.hourlyRate = {};
            if (query.minRate != null)
                where.hourlyRate.gte = Number(query.minRate);
            if (query.maxRate != null)
                where.hourlyRate.lte = Number(query.maxRate);
        }
        return this.coach.findMany({
            where,
            orderBy: [{ avgRating: 'desc' }, { totalSessions: 'desc' }],
            include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
            },
        });
    }
    async getCoach(id) {
        const coach = await this.coach.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, username: true, avatar: true } },
            },
        });
        if (!coach)
            throw new common_1.NotFoundException('코치를 찾을 수 없습니다');
        return coach;
    }
    async upsertCoachProfile(userId, data) {
        if (!data?.specialty || !data.specialty.trim()) {
            throw new common_1.BadRequestException('전문분야(specialty)는 필수입니다');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { userType: 'coach' },
        });
        const payload = {
            specialty: data.specialty,
            bio: data.bio ?? '',
            hourlyRate: data.hourlyRate ?? 50000,
            yearsExp: data.yearsExp ?? 0,
            languages: data.languages ?? 'ko',
            availableHours: data.availableHours ?? '',
            isActive: data.isActive ?? true,
        };
        return this.coach.upsert({
            where: { userId },
            create: { userId, ...payload },
            update: payload,
        });
    }
    async createSession(clientId, data) {
        if (!data.coachId)
            throw new common_1.BadRequestException('coachId가 필요합니다');
        if (!data.scheduledAt)
            throw new common_1.BadRequestException('예약 일시(scheduledAt)가 필요합니다');
        const coach = await this.coach.findUnique({ where: { id: data.coachId } });
        if (!coach)
            throw new common_1.NotFoundException('코치를 찾을 수 없습니다');
        if (!coach.isActive)
            throw new common_1.BadRequestException('비활성 코치입니다');
        if (coach.userId === clientId)
            throw new common_1.BadRequestException('본인에게는 예약할 수 없습니다');
        const duration = Math.max(15, Number(data.duration ?? 60));
        const totalPrice = Math.round((coach.hourlyRate * duration) / 60);
        const commission = Math.round(totalPrice * COMMISSION_RATE);
        const coachEarn = totalPrice - commission;
        return this.session.create({
            data: {
                coachId: data.coachId,
                clientId,
                scheduledAt: new Date(data.scheduledAt),
                duration,
                totalPrice,
                commission,
                coachEarn,
                status: 'requested',
                note: data.note ?? '',
            },
        });
    }
    async mySessions(userId) {
        const asClient = await this.session.findMany({
            where: { clientId: userId },
            orderBy: { scheduledAt: 'desc' },
            include: {
                coach: {
                    include: {
                        user: { select: { id: true, name: true, username: true, avatar: true } },
                    },
                },
            },
        });
        const coachProfile = await this.coach.findUnique({ where: { userId } });
        let asCoach = [];
        if (coachProfile) {
            asCoach = await this.session.findMany({
                where: { coachId: coachProfile.id },
                orderBy: { scheduledAt: 'desc' },
                include: {
                    client: { select: { id: true, name: true, username: true, avatar: true } },
                },
            });
        }
        return { asClient, asCoach };
    }
    async updateStatus(sessionId, userId, data) {
        if (!VALID_STATUSES.includes(data.status)) {
            throw new common_1.BadRequestException('유효하지 않은 상태값');
        }
        const session = await this.session.findUnique({
            where: { id: sessionId },
            include: { coach: true },
        });
        if (!session)
            throw new common_1.NotFoundException('세션을 찾을 수 없습니다');
        const isCoach = session.coach.userId === userId;
        const isClient = session.clientId === userId;
        if (!isCoach && !isClient)
            throw new common_1.ForbiddenException('권한이 없습니다');
        if (data.status === 'confirmed' && !isCoach) {
            throw new common_1.ForbiddenException('확정은 코치만 가능합니다');
        }
        if (data.status === 'completed' && !isCoach) {
            throw new common_1.ForbiddenException('완료 처리는 코치만 가능합니다');
        }
        if (data.status === 'refunded' && !isCoach) {
            throw new common_1.ForbiddenException('환불은 코치만 가능합니다');
        }
        const updated = await this.session.update({
            where: { id: sessionId },
            data: {
                status: data.status,
                ...(data.meetingUrl != null ? { meetingUrl: data.meetingUrl } : {}),
            },
        });
        if (data.status === 'completed') {
            await this.coach.update({
                where: { id: session.coachId },
                data: { totalSessions: { increment: 1 } },
            });
        }
        return updated;
    }
    async reviewSession(sessionId, userId, data) {
        const rating = Number(data.rating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('평점은 1~5 사이여야 합니다');
        }
        const session = await this.session.findUnique({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('세션을 찾을 수 없습니다');
        if (session.clientId !== userId)
            throw new common_1.ForbiddenException('클라이언트만 리뷰 가능');
        if (session.status !== 'completed') {
            throw new common_1.BadRequestException('완료된 세션만 리뷰할 수 있습니다');
        }
        const updated = await this.session.update({
            where: { id: sessionId },
            data: { rating, review: data.review ?? '' },
        });
        const aggregate = await this.session.aggregate({
            where: { coachId: session.coachId, rating: { not: null } },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.coach.update({
            where: { id: session.coachId },
            data: { avgRating: aggregate._avg.rating ?? 0 },
        });
        return updated;
    }
};
exports.CoachingService = CoachingService;
exports.CoachingService = CoachingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoachingService);
