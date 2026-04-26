import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface UpsertCoachProfileDto {
  specialty: string;
  bio?: string;
  hourlyRate?: number;
  yearsExp?: number;
  languages?: string;
  availableHours?: string;
  isActive?: boolean;
}

export interface CreateSessionDto {
  coachId: string;
  scheduledAt: string; // ISO
  duration?: number;
  note?: string;
  resumeId?: string; // 공유할 이력서 (코치만 열람 허용)
}

export interface ListCoachesQuery {
  specialty?: string;
  minRate?: number;
  maxRate?: number;
}

export interface UpdateSessionStatusDto {
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  meetingUrl?: string;
}

export interface ReviewSessionDto {
  rating: number;
  review?: string;
}

const COMMISSION_RATE = 0.15; // 플랫폼 수수료 15%
const VALID_STATUSES = ['requested', 'confirmed', 'completed', 'cancelled', 'refunded'];

@Injectable()
export class CoachingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private get coach() {
    return (this.prisma as any).coachProfile;
  }

  private get session() {
    return (this.prisma as any).coachingSession;
  }

  // ── Coach listing ─────────────────────────────────────────
  async listCoaches(query: ListCoachesQuery) {
    const where: any = { isActive: true };
    if (query.specialty) where.specialty = query.specialty;
    if (query.minRate != null || query.maxRate != null) {
      where.hourlyRate = {};
      if (query.minRate != null) where.hourlyRate.gte = Number(query.minRate);
      if (query.maxRate != null) where.hourlyRate.lte = Number(query.maxRate);
    }
    return this.coach.findMany({
      where,
      orderBy: [{ avgRating: 'desc' }, { totalSessions: 'desc' }],
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
  }

  async getCoach(id: string) {
    const coach = await this.coach.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
    if (!coach) throw new NotFoundException('코치를 찾을 수 없습니다');
    return coach;
  }

  // ── Coach profile upsert (coach-only) ─────────────────────
  async upsertCoachProfile(userId: string, data: UpsertCoachProfileDto) {
    if (!data?.specialty || !data.specialty.trim()) {
      throw new BadRequestException('전문분야(specialty)는 필수입니다');
    }
    // 유저 타입을 coach로 승격
    await this.prisma.user.update({
      where: { id: userId },
      data: { userType: 'coach' },
    });

    const payload: any = {
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

  // ── Sessions ──────────────────────────────────────────────
  async createSession(clientId: string, data: CreateSessionDto) {
    if (!data.coachId) throw new BadRequestException('coachId가 필요합니다');
    if (!data.scheduledAt) throw new BadRequestException('예약 일시(scheduledAt)가 필요합니다');

    const coach = await this.coach.findUnique({ where: { id: data.coachId } });
    if (!coach) throw new NotFoundException('코치를 찾을 수 없습니다');
    if (!coach.isActive) throw new BadRequestException('비활성 코치입니다');
    if (coach.userId === clientId) throw new BadRequestException('본인에게는 예약할 수 없습니다');

    const duration = Math.max(15, Number(data.duration ?? 60));
    const totalPrice = Math.round((coach.hourlyRate * duration) / 60);
    const commission = Math.round(totalPrice * COMMISSION_RATE);
    const coachEarn = totalPrice - commission;

    // resumeId가 있으면 clientId 소유인지 검증 (권한 상승 방지)
    let resumeId: string | null = null;
    if (data.resumeId) {
      const resume = await this.prisma.resume.findUnique({ where: { id: data.resumeId } });
      if (!resume) throw new BadRequestException('이력서를 찾을 수 없습니다');
      if (resume.userId !== clientId) {
        throw new BadRequestException('본인 이력서만 공유할 수 있습니다');
      }
      resumeId = data.resumeId;
    }

    return this.session.create({
      data: {
        coachId: data.coachId,
        clientId,
        resumeId,
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

  async mySessions(userId: string) {
    // 내가 클라이언트인 세션
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

    // 내가 코치인 세션
    const coachProfile = await this.coach.findUnique({ where: { userId } });
    let asCoach: any[] = [];
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

  async updateStatus(sessionId: string, userId: string, data: UpdateSessionStatusDto) {
    if (!VALID_STATUSES.includes(data.status)) {
      throw new BadRequestException('유효하지 않은 상태값');
    }
    const session = await this.session.findUnique({
      where: { id: sessionId },
      include: { coach: true },
    });
    if (!session) throw new NotFoundException('세션을 찾을 수 없습니다');

    const isCoach = session.coach.userId === userId;
    const isClient = session.clientId === userId;
    if (!isCoach && !isClient) throw new ForbiddenException('권한이 없습니다');

    // 상태 변경 규칙
    // - confirmed: 코치만 가능 (requested → confirmed)
    // - completed: 코치만 가능 (confirmed → completed)
    // - cancelled: 양쪽 가능 (requested/confirmed → cancelled)
    // - refunded: 코치만 (cancelled/completed → refunded)
    if (data.status === 'confirmed' && !isCoach) {
      throw new ForbiddenException('확정은 코치만 가능합니다');
    }
    if (data.status === 'completed' && !isCoach) {
      throw new ForbiddenException('완료 처리는 코치만 가능합니다');
    }
    if (data.status === 'refunded' && !isCoach) {
      throw new ForbiddenException('환불은 코치만 가능합니다');
    }

    // 전이 검증: 허용된 전이만 진행
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      requested: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: ['refunded'],
      cancelled: ['refunded'],
      refunded: [],
    };
    const allowed = ALLOWED_TRANSITIONS[session.status] || [];
    if (!allowed.includes(data.status) && session.status !== data.status) {
      throw new BadRequestException(
        `'${session.status}' 상태에서 '${data.status}'(으)로 변경할 수 없습니다`,
      );
    }

    const updated = await this.session.update({
      where: { id: sessionId },
      data: {
        status: data.status,
        ...(data.meetingUrl != null ? { meetingUrl: data.meetingUrl } : {}),
      },
    });

    // 완료되면 코치의 totalSessions 증가 + 클라이언트에게 리뷰 요청 알림
    if (data.status === 'completed') {
      await this.coach.update({
        where: { id: session.coachId },
        data: { totalSessions: { increment: 1 } },
      });
      // 이미 리뷰가 있는 세션에는 보내지 않음 (refunded → completed 같은 edge case 방지)
      if (session.rating == null) {
        await this.notifications
          .create(
            session.clientId,
            'coaching_review_request',
            `코칭 세션이 완료됐어요. 평점/리뷰를 남겨주세요`,
            `/coaching/sessions?focus=${sessionId}`,
          )
          .catch(() => {});
      }
    }

    return updated;
  }

  async reviewSession(sessionId: string, userId: string, data: ReviewSessionDto) {
    const rating = Number(data.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('평점은 1~5 사이여야 합니다');
    }
    const session = await this.session.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('세션을 찾을 수 없습니다');
    if (session.clientId !== userId) throw new ForbiddenException('클라이언트만 리뷰 가능');
    if (session.status !== 'completed') {
      throw new BadRequestException('완료된 세션만 리뷰할 수 있습니다');
    }

    const updated = await this.session.update({
      where: { id: sessionId },
      data: { rating, review: data.review ?? '' },
    });

    // 코치 평균 평점 재계산
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
}
