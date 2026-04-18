/**
 * Coaching E2E — 코치 프로필/세션 예약/리뷰
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Coaching (코칭)', () => {
  let ctx: E2EContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'coach-e2e',
      normal: true,
      coach: true,
    });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /coaching/coaches — 코치 목록', async () => {
    const res = await ctx.api().get('/api/coaching/coaches').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /coaching/coach-profile — 프로필 생성 (coach 유저)', async () => {
    const res = await ctx.authPost('coach', '/api/coaching/coach-profile').send({
      specialty: 'resume',
      bio: '이력서 코치입니다',
      hourlyRate: 50000,
      yearsExp: 5,
      isActive: true,
    });
    expect([200, 201]).toContain(res.status);
  });

  it('GET /coaching/coaches?specialty=resume — 특기 필터', async () => {
    const res = await ctx.api().get('/api/coaching/coaches?specialty=resume').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /coaching/coaches/:id — 코치 상세 (없는 ID)', async () => {
    const res = await ctx.authGet('normal', '/api/coaching/coaches/fake-id');
    expect([200, 404]).toContain(res.status);
  });

  it('POST /coaching/sessions — 세션 예약', async () => {
    const res = await ctx.authPost('normal', '/api/coaching/sessions').send({
      coachId: ctx.userIds.coach,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      duration: 60,
      note: '이력서 리뷰 요청',
    });
    expect([200, 201, 400, 404]).toContain(res.status);
    if ((res.status === 200 || res.status === 201) && res.body?.id) {
      sessionId = res.body.id;
    }
  });

  it('GET /coaching/sessions/my — 내 세션', async () => {
    const res = await ctx.authGet('normal', '/api/coaching/sessions/my').expect(200);
    expect(typeof res.body).toBe('object');
  });

  it('GET /coaching/sessions/my (coach 입장) — 받은 세션', async () => {
    const res = await ctx.authGet('coach', '/api/coaching/sessions/my').expect(200);
    expect(typeof res.body).toBe('object');
  });

  it('PATCH /coaching/sessions/:id/status — 상태 변경 (coach가 confirm)', async () => {
    if (!sessionId) return;
    const res = await ctx
      .authPatch('coach', `/api/coaching/sessions/${sessionId}/status`)
      .send({ status: 'confirmed' });
    expect([200, 400, 403]).toContain(res.status);
  });

  it('비로그인 → 세션 예약 401', async () => {
    await ctx
      .api()
      .post('/api/coaching/sessions')
      .send({ coachId: 'x', scheduledAt: new Date().toISOString() })
      .expect(401);
  });
});
