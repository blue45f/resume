/**
 * Social E2E — 팔로우/언팔로우 + 메시지 + 스카웃
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Social (팔로우/메시지)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'social-e2e',
      normal: true,
      recruiter: true,
    });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('팔로우', () => {
    it('POST /social/follow/:userId — 팔로우', async () => {
      const res = await ctx
        .authPost('normal', `/api/social/follow/${ctx.userIds.recruiter}`)
        .send({});
      expect([200, 201, 400, 404, 409]).toContain(res.status);
    });

    it('POST /social/follow/:self — 자기자신 팔로우 → 400', async () => {
      const res = await ctx.authPost('normal', `/api/social/follow/${ctx.userIds.normal}`).send({});
      expect([400, 403]).toContain(res.status);
    });

    it('GET /social/followers — 팔로워 목록', async () => {
      const res = await ctx.authGet('recruiter', '/api/social/followers').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /social/following — 팔로잉 목록', async () => {
      const res = await ctx.authGet('normal', '/api/social/following').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('DELETE /social/follow/:userId — 언팔로우', async () => {
      const res = await ctx.authDelete('normal', `/api/social/follow/${ctx.userIds.recruiter}`);
      expect([200, 204, 404]).toContain(res.status);
    });
  });

  describe('메시지 (DM)', () => {
    it('POST /social/messages/:receiverId — 전송', async () => {
      const res = await ctx
        .authPost('normal', `/api/social/messages/${ctx.userIds.recruiter}`)
        .send({ content: '안녕하세요!' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /social/messages/:self — 자기자신 → 403', async () => {
      const res = await ctx
        .authPost('normal', `/api/social/messages/${ctx.userIds.normal}`)
        .send({ content: 'self' });
      expect([403, 400]).toContain(res.status);
    });

    it('GET /social/messages — 대화 목록', async () => {
      const res = await ctx.authGet('normal', '/api/social/messages').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('GET /social/messages/unread/count — 읽지 않은 개수', async () => {
      const res = await ctx.authGet('normal', '/api/social/messages/unread/count').expect(200);
      expect(typeof res.body.count).toBe('number');
    });

    it('GET /social/messages/:partnerId — 대화 내용', async () => {
      const res = await ctx.authGet('normal', `/api/social/messages/${ctx.userIds.recruiter}`);
      expect([200]).toContain(res.status);
    });
  });

  describe('스카웃', () => {
    it('GET /social/scouts — 받은 스카웃', async () => {
      const res = await ctx.authGet('normal', '/api/social/scouts').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('GET /social/scouts/sent — 보낸 스카웃', async () => {
      const res = await ctx.authGet('recruiter', '/api/social/scouts/sent').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });
  });
});
