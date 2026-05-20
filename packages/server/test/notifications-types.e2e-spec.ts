/// <reference types="jest" />
/// <reference types="node" />
/**
 * Notifications Types E2E — 신규 8개 type 발송/읽음 + 일괄 처리
 * (coaching_review_request/received, coffee_chat_*, job_application_received/stage)
 */
import { setupE2EApp, cleanupTestData, E2EContext } from './e2e-helper';

describe('Notifications by Type', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'notif-typ-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.prisma.notification
      .deleteMany({ where: { userId: { in: Object.values(ctx.userIds) } } })
      .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  const NEW_TYPES = [
    'coaching_review_request',
    'coaching_review_received',
    'coffee_chat_request',
    'coffee_chat_response',
    'coffee_chat_reminder',
    'job_application_received',
    'job_application_stage',
    'coaching_nudge',
  ];

  describe('8개 신규 type 모두 저장 + 조회 가능', () => {
    let createdIds: string[] = [];

    it('DB에 8개 type 알림 일괄 삽입', async () => {
      const userId = ctx.userIds.normal;
      const items = NEW_TYPES.map((type, i) => ({
        userId,
        type,
        message: `[${type}] 메시지 #${i}`,
        link: `/test/${type}`,
      }));
      await ctx.prisma.notification.createMany({ data: items });
      const all = await ctx.prisma.notification.findMany({
        where: { userId, type: { in: NEW_TYPES } },
        select: { id: true, type: true },
      });
      expect(all.length).toBe(NEW_TYPES.length);
      createdIds = all.map((n) => n.id);
    });

    it('GET /notifications — 8개 모두 보임', async () => {
      const res = await ctx.authGet('normal', '/api/notifications').expect(200);
      const types = res.body.map((n: any) => n.type);
      NEW_TYPES.forEach((t) => expect(types).toContain(t));
    });

    it('GET /notifications/unread — 읽지 않은 8개', async () => {
      const res = await ctx.authGet('normal', '/api/notifications/unread').expect(200);
      const unreadTypes = res.body.map((n: any) => n.type);
      NEW_TYPES.forEach((t) => expect(unreadTypes).toContain(t));
    });

    it('GET /notifications/count — 8 이상', async () => {
      const res = await ctx.authGet('normal', '/api/notifications/count').expect(200);
      expect(res.body.count).toBeGreaterThanOrEqual(NEW_TYPES.length);
    });

    it('POST /:id/read — 단건 읽음', async () => {
      const target = createdIds[0];
      const res = await ctx.authPost('normal', `/api/notifications/${target}/read`).send({});
      expect([200, 201]).toContain(res.status);
      const got = await ctx.prisma.notification.findUnique({ where: { id: target } });
      expect(got?.read).toBe(true);
    });

    it('POST /read-all — 전체 읽음', async () => {
      await ctx.authPost('normal', '/api/notifications/read-all').send({}).expect(201);
      const remaining = await ctx.prisma.notification.count({
        where: { userId: ctx.userIds.normal, read: false },
      });
      expect(remaining).toBe(0);
    });

    it('POST /delete-bulk — 모두 삭제', async () => {
      const res = await ctx
        .authPost('normal', '/api/notifications/delete-bulk')
        .send({ ids: createdIds })
        .expect(201);
      expect(res.body.success).toBe(true);
      const remaining = await ctx.prisma.notification.count({
        where: { id: { in: createdIds } },
      });
      expect(remaining).toBe(0);
    });

    it('DELETE /:id (자신의 알림) — soft pass', async () => {
      const fresh = await ctx.prisma.notification.create({
        data: {
          userId: ctx.userIds.normal,
          type: 'coffee_chat_request',
          message: '삭제 테스트',
          link: '/x',
        },
      });
      const res = await ctx.authDelete('normal', `/api/notifications/${fresh.id}`);
      expect([200, 204]).toContain(res.status);
      const after = await ctx.prisma.notification.findUnique({ where: { id: fresh.id } });
      expect(after).toBeNull();
    });

    it('다른 유저 알림 삭제 시도 → no-op (filter by userId)', async () => {
      // 별도 사용자 직접 생성
      const otherEmail = 'notif-typ-e2e-other@test.local';
      await ctx.prisma.user.deleteMany({ where: { email: otherEmail } }).catch(() => undefined);
      const other = await ctx.prisma.user.create({
        data: {
          email: otherEmail,
          name: 'other',
          passwordHash: 'x',
          provider: 'email',
          providerId: `email:${otherEmail}`,
        },
      });
      const orphan = await ctx.prisma.notification.create({
        data: {
          userId: other.id,
          type: 'coffee_chat_request',
          message: 'orphan',
        },
      });
      await ctx.authDelete('normal', `/api/notifications/${orphan.id}`);
      const stillThere = await ctx.prisma.notification.findUnique({ where: { id: orphan.id } });
      expect(stillThere).not.toBeNull();
      // cleanup
      await ctx.prisma.notification.delete({ where: { id: orphan.id } }).catch(() => undefined);
      await ctx.prisma.user.delete({ where: { id: other.id } }).catch(() => undefined);
    });
  });

  describe('비로그인 처리', () => {
    it('GET /notifications 비로그인 → 200 빈 배열 (controller soft-handle)', async () => {
      const res = await ctx.api().get('/api/notifications');
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('POST /read-all 비로그인 → 비인증 응답 (success:false 또는 401)', async () => {
      const res = await ctx.api().post('/api/notifications/read-all').send({});
      expect([200, 201, 401]).toContain(res.status);
      if ([200, 201].includes(res.status)) {
        expect(res.body.success).toBe(false);
      }
    });
  });
});
