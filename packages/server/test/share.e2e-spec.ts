/**
 * Share E2E — 공유 링크 생성/조회/비밀번호/만료/IDOR
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('Share (공유 링크)', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let linkId: string;
  let tokenNoPassword: string;
  let tokenWithPassword: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'share-e2e', normal: true, recruiter: true });
    const r = await createTestResume(ctx, 'normal', { title: '공유 테스트' });
    resumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('POST /resumes/:id/share — 만료 시간 설정', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/share`)
      .send({ expiresInHours: 48 })
      .expect(201);
    tokenNoPassword = res.body.token;
    linkId = res.body.id;
    expect(tokenNoPassword.length).toBe(64);
    expect(res.body.expiresAt).toBeDefined();
    expect(res.body.hasPassword).toBe(false);
  });

  it('POST /resumes/:id/share — 비밀번호 보호', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/share`)
      .send({ password: 'secret' })
      .expect(201);
    tokenWithPassword = res.body.token;
    expect(res.body.hasPassword).toBe(true);
  });

  it('GET /resumes/:id/share — 목록', async () => {
    const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/share`).expect(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty('isExpired');
  });

  it('GET /shared/:token (비번 없음)', async () => {
    await ctx.api().get(`/api/shared/${tokenNoPassword}`).expect(200);
  });

  it('GET /shared/:token (비번 보호, 비번 없이) → 403', async () => {
    await ctx.api().get(`/api/shared/${tokenWithPassword}`).expect(403);
  });

  it('GET /shared/:token (틀린 비번) → 403', async () => {
    await ctx.api().get(`/api/shared/${tokenWithPassword}?password=wrong`).expect(403);
  });

  it('GET /shared/:token (맞는 비번) → 200', async () => {
    await ctx.api().get(`/api/shared/${tokenWithPassword}?password=secret`).expect(200);
  });

  it('GET /shared/nonexistent → 403 (정보 노출 방지)', async () => {
    await ctx.api().get('/api/shared/nonexistent-token').expect(403);
  });

  it('DELETE /share/:id — 다른 유저 → 404 또는 403', async () => {
    const res = await ctx.authDelete('recruiter', `/api/share/${linkId}`);
    expect([403, 404]).toContain(res.status);
  });

  it('DELETE /share/:id — 소유자 삭제', async () => {
    await ctx.authDelete('normal', `/api/share/${linkId}`).expect(200);
  });

  it('DELETE /share/fake → 404', async () => {
    await ctx.authDelete('normal', '/api/share/no-such-id').expect(404);
  });
});
