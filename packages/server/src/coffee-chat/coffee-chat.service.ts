import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const ALLOWED_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'completed',
  'cancelled',
  'expired',
  'no_show',
] as const;
const ALLOWED_MODALITIES = ['voice', 'video', 'chat'] as const;
const SIGNAL_TTL_MS = 30 * 1000; // 30초 후 정리
const SIGNAL_DRAIN_LIMIT = 50; // poll 1회당 최대 50건

/**
 * Topic templates — 자주 쓰는 7개 주제. 신청 마찰 줄이고 호스트가 빠르게 컨텍스트 파악.
 * (Topmate.io 패턴) — 자유 입력도 가능, 이건 추천 카탈로그.
 */
export const COFFEE_CHAT_TOPICS = [
  { key: 'resume_review', label: '이력서 리뷰', icon: '📄' },
  { key: 'mock_interview', label: '모의 면접', icon: '🎤' },
  { key: 'career_advice', label: '커리어 상담', icon: '🧭' },
  { key: 'culture_fit', label: '컬처핏 / 회사 분위기', icon: '🏢' },
  { key: 'role_intro', label: '직무 소개 / 일상', icon: '💼' },
  { key: 'salary_nego', label: '연봉 / 처우 협의', icon: '💰' },
  { key: 'general', label: '자유 주제', icon: '☕' },
] as const;

const TOPIC_KEY_LABELS: Record<string, string> = COFFEE_CHAT_TOPICS.reduce(
  (acc, t) => ({ ...acc, [t.key]: `${t.icon} ${t.label}` }),
  {},
);

/** Rate limit — 같은 host 에게 30일 내 신청 횟수 (스팸 방지). */
const RATE_LIMIT_DAYS = 30;
const RATE_LIMIT_MAX = 3;
/** 7일 무응답 시 자동 expire */
const PENDING_EXPIRE_DAYS = 7;

@Injectable()
export class CoffeeChatService {
  private readonly logger = new Logger(CoffeeChatService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ──────── 커피챗 신청/관리 ────────

  async create(
    requesterId: string,
    body: {
      hostId: string;
      message?: string;
      topic?: string;
      modality?: string;
      durationMin?: number;
      scheduledAt?: string | null;
    },
  ) {
    if (!requesterId) throw new ForbiddenException('로그인이 필요합니다');
    if (!body.hostId) throw new BadRequestException('hostId 필요');
    if (body.hostId === requesterId) {
      throw new BadRequestException('본인에게 커피챗 신청할 수 없습니다');
    }
    const host = await this.prisma.user.findUnique({
      where: { id: body.hostId },
      select: { id: true, name: true },
    });
    if (!host) throw new NotFoundException('상대 사용자를 찾을 수 없습니다');

    const modality = ALLOWED_MODALITIES.includes(body.modality as 'voice')
      ? body.modality!
      : 'video';
    const durationMin = Math.min(120, Math.max(15, Number(body.durationMin) || 30));

    // 동일 요청자가 동일 호스트에게 pending 상태 중복 방지
    const existing = await this.prisma.coffeeChat.findFirst({
      where: { requesterId, hostId: body.hostId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException('이미 대기 중인 커피챗 신청이 있습니다');
    }

    // Rate limit — 같은 host 에게 30일 내 3회 max (스팸 방지)
    const since = new Date(Date.now() - RATE_LIMIT_DAYS * 24 * 60 * 60 * 1000);
    const recentCount = await this.prisma.coffeeChat.count({
      where: {
        requesterId,
        hostId: body.hostId,
        createdAt: { gte: since },
      },
    });
    if (recentCount >= RATE_LIMIT_MAX) {
      throw new BadRequestException(
        `${RATE_LIMIT_DAYS}일 내 같은 사용자에게 ${RATE_LIMIT_MAX}회까지만 신청할 수 있습니다`,
      );
    }

    const created = await this.prisma.coffeeChat.create({
      data: {
        hostId: body.hostId,
        requesterId,
        message: (body.message || '').slice(0, 1000),
        topic: (body.topic || '').slice(0, 100),
        modality,
        durationMin,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: 'pending',
      },
    });

    // host 에게 알림
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { name: true },
    });
    this.notifications
      .create(
        body.hostId,
        'coffee_chat_request',
        `${requester?.name || '사용자'}님이 커피챗을 신청했어요`,
        `/coffee-chats/${created.id}`,
      )
      .catch(() => {});

    return created;
  }

  /** 내가 보냈거나 받은 커피챗 목록. role=sent|received|all. */
  async listMine(userId: string, role: 'sent' | 'received' | 'all' = 'all', status?: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const where: Record<string, unknown> = {};
    if (role === 'sent') where.requesterId = userId;
    else if (role === 'received') where.hostId = userId;
    else where.OR = [{ requesterId: userId }, { hostId: userId }];
    if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    return this.prisma.coffeeChat.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        host: { select: { id: true, name: true, username: true, avatar: true } },
        requester: { select: { id: true, name: true, username: true, avatar: true } },
      },
      take: 100,
    });
  }

  async findOne(id: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const chat = await this.prisma.coffeeChat.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, name: true, username: true, avatar: true } },
        requester: { select: { id: true, name: true, username: true, avatar: true } },
      },
    });
    if (!chat) throw new NotFoundException('커피챗을 찾을 수 없습니다');
    if (chat.hostId !== userId && chat.requesterId !== userId) {
      throw new ForbiddenException('이 커피챗에 접근할 권한이 없습니다');
    }
    return chat;
  }

  /** host 가 수락/거절. 수락 시 roomId 발급 + 양쪽 알림. */
  async respond(id: string, hostId: string, decision: 'accepted' | 'rejected', note?: string) {
    if (!hostId) throw new ForbiddenException('로그인이 필요합니다');
    const chat = await this.prisma.coffeeChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('커피챗을 찾을 수 없습니다');
    if (chat.hostId !== hostId) {
      throw new ForbiddenException('호스트만 응답할 수 있습니다');
    }
    if (chat.status !== 'pending') {
      throw new BadRequestException(`이미 ${chat.status} 상태입니다`);
    }
    const data: Record<string, unknown> = {
      status: decision,
      hostNote: (note || '').slice(0, 500),
    };
    if (decision === 'accepted') {
      data.roomId = randomUUID();
    }
    const updated = await this.prisma.coffeeChat.update({ where: { id }, data });
    // requester 에게 알림
    this.notifications
      .create(
        chat.requesterId,
        'coffee_chat_response',
        decision === 'accepted' ? '커피챗 신청이 수락되었어요' : '커피챗 신청이 거절되었어요',
        `/coffee-chats/${id}`,
      )
      .catch(() => {});
    return updated;
  }

  /** 신청자가 자신의 신청을 취소. */
  async cancel(id: string, requesterId: string) {
    if (!requesterId) throw new ForbiddenException('로그인이 필요합니다');
    const chat = await this.prisma.coffeeChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException('커피챗을 찾을 수 없습니다');
    if (chat.requesterId !== requesterId) {
      throw new ForbiddenException('신청자만 취소할 수 있습니다');
    }
    if (chat.status !== 'pending' && chat.status !== 'accepted') {
      throw new BadRequestException('취소할 수 없는 상태입니다');
    }
    return this.prisma.coffeeChat.update({
      where: { id },
      data: { status: 'cancelled' },
    });
  }

  /** 양쪽 중 누구나 완료 표시. */
  async complete(id: string, userId: string) {
    const chat = await this.findOne(id, userId);
    if (chat.status !== 'accepted') {
      throw new BadRequestException('수락된 커피챗만 완료 처리할 수 있습니다');
    }
    return this.prisma.coffeeChat.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  // ──────── WebRTC signaling (P2P 미디어, 서버는 메시지 전달만) ────────

  async sendSignal(
    fromUserId: string,
    body: { roomId: string; toUserId: string; type: string; payload: unknown },
  ) {
    if (!fromUserId) throw new ForbiddenException('로그인이 필요합니다');
    if (!body.roomId || !body.toUserId || !body.type) {
      throw new BadRequestException('roomId, toUserId, type 필요');
    }
    if (!['offer', 'answer', 'ice', 'bye'].includes(body.type)) {
      throw new BadRequestException('유효하지 않은 type');
    }
    // roomId 가 활성 커피챗에 속하는지 검증 (보안: 임의 room 신호 발송 방지)
    const chat = await this.prisma.coffeeChat.findFirst({
      where: { roomId: body.roomId, status: 'accepted' },
    });
    if (!chat) {
      throw new ForbiddenException('유효하지 않은 room 또는 비활성 세션');
    }
    if (chat.hostId !== fromUserId && chat.requesterId !== fromUserId) {
      throw new ForbiddenException('이 room 의 참여자가 아닙니다');
    }
    const peerId = chat.hostId === fromUserId ? chat.requesterId : chat.hostId;
    if (peerId !== body.toUserId) {
      throw new ForbiddenException('toUserId 가 room peer 와 일치하지 않습니다');
    }

    // payload 크기 보호 (ICE candidate 평균 ~500B, offer/answer 수 KB)
    const payloadStr = JSON.stringify(body.payload || {});
    if (payloadStr.length > 50_000) {
      throw new BadRequestException('signal payload 가 너무 큽니다');
    }

    return this.prisma.webrtcSignal.create({
      data: {
        roomId: body.roomId,
        fromUserId,
        toUserId: body.toUserId,
        type: body.type,
        payload: payloadStr,
      },
    });
  }

  /** 내가 받을 신호를 drain (즉시 삭제, 한 번 읽으면 사라짐 — 폴링 모델). */
  async drainSignals(userId: string, roomId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    if (!roomId) throw new BadRequestException('roomId 필요');
    const signals = await this.prisma.webrtcSignal.findMany({
      where: { toUserId: userId, roomId },
      orderBy: { createdAt: 'asc' },
      take: SIGNAL_DRAIN_LIMIT,
    });
    if (signals.length > 0) {
      await this.prisma.webrtcSignal
        .deleteMany({ where: { id: { in: signals.map((s) => s.id) } } })
        .catch(() => {});
    }
    return signals.map((s) => ({
      id: s.id,
      type: s.type,
      fromUserId: s.fromUserId,
      payload: this.safeParse(s.payload),
      createdAt: s.createdAt,
    }));
  }

  private safeParse(s: string): unknown {
    try {
      return JSON.parse(s);
    } catch {
      return s;
    }
  }

  /**
   * WebRTC peer connection telemetry — 성공률/실패율 측정용.
   * DB 저장 없이 console.info 로 기록 → log aggregator 가 집계 (cost-min).
   * 향후 admin stats 에서 24h success rate 계산 시 이 라인을 grep.
   */
  async recordPeerTelemetry(
    userId: string,
    body: {
      roomId: string;
      state: string;
      modality?: string;
      durationMs?: number;
      errorName?: string;
    },
  ) {
    if (!body?.roomId || !body?.state) return { ok: false };
    // 구조화 로그 — log aggregator (Cloud Logging) 가 jsonPayload 로 인식

    console.info(
      JSON.stringify({
        event: 'webrtc_peer_state',
        userId,
        roomId: body.roomId,
        state: body.state,
        modality: body.modality || 'video',
        durationMs: body.durationMs ?? null,
        errorName: body.errorName || null,
        timestamp: new Date().toISOString(),
      }),
    );
    return { ok: true };
  }

  /** 만료 신호 정리 — 30초 이상 남은 stale signal 제거. WebRTC race condition 방지. */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupStaleSignals() {
    try {
      const cutoff = new Date(Date.now() - SIGNAL_TTL_MS);
      await this.prisma.webrtcSignal.deleteMany({ where: { createdAt: { lt: cutoff } } });
    } catch (err) {
      this.logger.warn(`signal cleanup 실패: ${(err as Error).message}`);
    }
  }

  /**
   * 커피챗 reminder — scheduledAt 기준 24시간 / 1시간 전 양쪽 참여자에게 알림.
   * 매 시간 실행. 같은 (chatId × kind) 알림 중복 방지 (link 에 ?reminder=24h 식 마킹).
   *
   * 정확도 ±30분 — cron 매 시간이라 24h±30min / 1h±30min 윈도우 검색.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async sendReminders() {
    try {
      const now = Date.now();
      // 24시간 전 reminder: scheduledAt 가 [now+23.5h, now+24.5h] 사이
      await this.sendReminderBatch(
        new Date(now + 23.5 * 60 * 60 * 1000),
        new Date(now + 24.5 * 60 * 60 * 1000),
        '24h',
      );
      // 1시간 전 reminder: [now+0.5h, now+1.5h]
      await this.sendReminderBatch(
        new Date(now + 0.5 * 60 * 60 * 1000),
        new Date(now + 1.5 * 60 * 60 * 1000),
        '1h',
      );
    } catch (err) {
      this.logger.warn(`reminder cron 실패: ${(err as Error).message}`);
    }
  }

  private async sendReminderBatch(start: Date, end: Date, kind: '24h' | '1h') {
    const chats = await this.prisma.coffeeChat.findMany({
      where: {
        status: 'accepted',
        scheduledAt: { gte: start, lte: end },
      },
      include: {
        host: { select: { name: true } },
        requester: { select: { name: true } },
      },
    });
    if (chats.length === 0) return;

    // 이미 같은 chat × kind reminder 받은 사용자 set 추출 (link 패턴 매칭)
    const linkPattern = chats.map((c) => `/coffee-chats/${c.id}/room?reminder=${kind}`);
    const existing = await this.prisma.notification.findMany({
      where: {
        type: 'coffee_chat_reminder',
        link: { in: linkPattern },
      },
      select: { userId: true, link: true },
    });
    const seenSet = new Set(existing.map((n) => `${n.userId}|${n.link}`));

    let sent = 0;
    for (const chat of chats) {
      const link = `/coffee-chats/${chat.id}/room?reminder=${kind}`;
      const when = kind === '24h' ? '내일' : '1시간 후';
      const modalityLabel =
        chat.modality === 'video' ? '화상' : chat.modality === 'voice' ? '음성' : '텍스트';

      // host 측
      if (!seenSet.has(`${chat.hostId}|${link}`)) {
        await this.notifications
          .create(
            chat.hostId,
            'coffee_chat_reminder',
            `${when} ${chat.requester.name || '신청자'}님과 ${modalityLabel} 커피챗`,
            link,
          )
          .catch(() => {});
        sent += 1;
      }
      // requester 측
      if (!seenSet.has(`${chat.requesterId}|${link}`)) {
        await this.notifications
          .create(
            chat.requesterId,
            'coffee_chat_reminder',
            `${when} ${chat.host.name || '코치'}님과 ${modalityLabel} 커피챗`,
            link,
          )
          .catch(() => {});
        sent += 1;
      }
    }
    if (sent > 0) {
      this.logger.log(`coffee chat ${kind} reminder: sent ${sent} notifications`);
    }
  }

  /** Topic templates 카탈로그 — public endpoint */
  listTopics() {
    return COFFEE_CHAT_TOPICS;
  }

  /**
   * 7일 무응답 pending → expired 자동 전환. 양쪽에 알림.
   * 매일 04:00 UTC cron.
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async expireStalePending() {
    const cutoff = new Date(Date.now() - PENDING_EXPIRE_DAYS * 24 * 60 * 60 * 1000);
    const stale = await this.prisma.coffeeChat.findMany({
      where: { status: 'pending', createdAt: { lt: cutoff } },
      select: { id: true, hostId: true, requesterId: true },
    });
    if (stale.length === 0) return;
    await this.prisma.coffeeChat.updateMany({
      where: { id: { in: stale.map((c) => c.id) } },
      data: { status: 'expired' },
    });
    for (const c of stale) {
      await this.notifications
        .create(
          c.requesterId,
          'coffee_chat_response',
          `${PENDING_EXPIRE_DAYS}일 무응답으로 커피챗 신청이 만료됐어요`,
          `/coffee-chats/${c.id}`,
        )
        .catch(() => {});
    }
    this.logger.log(`coffee chat expire: ${stale.length} pending → expired`);
  }

  /** WebRTC room 입장 시 host/requester 측 입장 시각 기록. no-show 추적용. */
  async recordJoin(id: string, userId: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const chat = await this.prisma.coffeeChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException();
    if (chat.status !== 'accepted') return chat; // 수락 후만 기록
    const data: Record<string, boolean> = {};
    if (chat.hostId === userId && !chat.hostJoined) data.hostJoined = true;
    else if (chat.requesterId === userId && !chat.requesterJoined) data.requesterJoined = true;
    if (Object.keys(data).length === 0) return chat;
    return this.prisma.coffeeChat.update({ where: { id }, data });
  }

  /** 커피챗 후 양쪽이 짧은 후기 남김 (max 500자). 본인 측 필드만 update. */
  async leaveFeedback(id: string, userId: string, feedback: string) {
    if (!userId) throw new ForbiddenException('로그인이 필요합니다');
    const trimmed = (feedback || '').slice(0, 500);
    const chat = await this.prisma.coffeeChat.findUnique({ where: { id } });
    if (!chat) throw new NotFoundException();
    if (chat.status !== 'completed' && chat.status !== 'accepted') {
      throw new BadRequestException('수락 또는 완료된 커피챗만 후기 남길 수 있습니다');
    }
    if (chat.hostId !== userId && chat.requesterId !== userId) {
      throw new ForbiddenException('이 커피챗에 참여한 사람만 후기 남길 수 있습니다');
    }
    const data: Record<string, string> = {};
    if (chat.hostId === userId) data.hostFeedback = trimmed;
    else data.requesterFeedback = trimmed;
    return this.prisma.coffeeChat.update({ where: { id }, data });
  }

  /**
   * Host 응답률 통계 — Adplist 패턴.
   * 받은 신청 수 / 응답 (accepted+rejected) 수 / 평균 응답 시간 / no-show 횟수.
   */
  async getHostStats(hostId: string) {
    if (!hostId) throw new BadRequestException('hostId 필요');
    const all = await this.prisma.coffeeChat.findMany({
      where: { hostId },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
        hostJoined: true,
      },
    });
    const total = all.length;
    const responded = all.filter((c) => ['accepted', 'rejected'].includes(c.status)).length;
    const completed = all.filter((c) => c.status === 'completed').length;
    const noShow = all.filter((c) => c.status === 'accepted' && !c.hostJoined).length;
    // 응답한 것만 평균 응답 시간 (createdAt → updatedAt)
    const respondedSet = all.filter((c) => ['accepted', 'rejected'].includes(c.status));
    const avgResponseHours =
      respondedSet.length > 0
        ? Math.round(
            (respondedSet.reduce(
              (sum, c) => sum + (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()),
              0,
            ) /
              respondedSet.length /
              (1000 * 60 * 60)) *
              10,
          ) / 10
        : null;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;
    return {
      total,
      responded,
      completed,
      noShow,
      responseRate,
      avgResponseHours,
    };
  }

  /** ICS calendar event 생성 — Google/Outlook 캘린더 등록용. accepted 만 export 가능. */
  async generateIcs(id: string, userId: string) {
    const chat = await this.prisma.coffeeChat.findUnique({
      where: { id },
      include: {
        host: { select: { name: true, email: true } },
        requester: { select: { name: true, email: true } },
      },
    });
    if (!chat) throw new NotFoundException();
    if (chat.hostId !== userId && chat.requesterId !== userId) {
      throw new ForbiddenException('참여자만 캘린더 export 가능');
    }
    if (chat.status !== 'accepted' && chat.status !== 'completed') {
      throw new BadRequestException('수락된 커피챗만 캘린더 export 가능');
    }
    const start = chat.scheduledAt || new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + chat.durationMin * 60 * 1000);
    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '') + ''; // 20260428T123456Z
    const escape = (s: string) => s.replace(/[\\;,\n]/g, (m) => (m === '\n' ? '\\n' : '\\' + m));
    const summary = `이력서공방 커피챗 — ${chat.host.name} & ${chat.requester.name}`;
    const description = [
      `주제: ${TOPIC_KEY_LABELS[chat.topic] || chat.topic || '자유 주제'}`,
      `방식: ${chat.modality === 'voice' ? '음성' : chat.modality === 'video' ? '화상' : '텍스트'}`,
      chat.message ? `메시지: ${chat.message}` : '',
      ``,
      `통화 방: https://resume-gongbang.vercel.app/coffee-chats/${chat.id}/room`,
    ]
      .filter(Boolean)
      .join('\\n');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//resume-gongbang//coffee-chat//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:coffee-chat-${chat.id}@resume-gongbang.vercel.app`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${escape(summary)}`,
      `DESCRIPTION:${escape(description)}`,
      `URL:https://resume-gongbang.vercel.app/coffee-chats/${chat.id}/room`,
      `ORGANIZER;CN=${escape(chat.host.name)}:mailto:${chat.host.email || 'noreply@resume-gongbang.vercel.app'}`,
      `ATTENDEE;CN=${escape(chat.requester.name)};RSVP=TRUE:mailto:${chat.requester.email || 'noreply@resume-gongbang.vercel.app'}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escape(summary)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    return ics;
  }
}
