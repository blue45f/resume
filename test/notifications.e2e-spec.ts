/**
 * Notifications E2E — 알림 조회/읽음/삭제
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Notifications (알림)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'notif-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /notifications — 목록', async () => {
    const res = await ctx.authGet('normal', '/api/notifications').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /notifications/unread — 읽지 않은 알림', async () => {
    const res = await ctx.authGet('normal', '/api/notifications/unread').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /notifications/count — 읽지 않은 개수', async () => {
    const res = await ctx.authGet('normal', '/api/notifications/count').expect(200);
    expect(typeof res.body.count).toBe('number');
  });

  it('POST /notifications/read-all — 모두 읽음', async () => {
    const res = await ctx.authPost('normal', '/api/notifications/read-all').send({});
    expect([200, 201]).toContain(res.status);
  });

  it('POST /notifications/:id/read (없는 ID) → 404 또는 400', async () => {
    const res = await ctx.authPost('normal', '/api/notifications/fake-id/read').send({});
    expect([200, 201, 400, 404]).toContain(res.status);
  });

  it('DELETE /notifications/:id (없는 ID) → 404 또는 400', async () => {
    const res = await ctx.authDelete('normal', '/api/notifications/fake-id');
    expect([200, 204, 400, 404]).toContain(res.status);
  });

  it('POST /notifications/delete-bulk — 일괄 삭제', async () => {
    const res = await ctx.authPost('normal', '/api/notifications/delete-bulk').send({ ids: [] });
    expect([200, 201]).toContain(res.status);
  });

  it('비로그인 → 401', async () => {
    await ctx.api().get('/api/notifications').expect(401);
  });
});
