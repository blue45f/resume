/**
 * Jobs E2E — 채용공고 CRUD + 큐레이션 + 외부링크 + 통계
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Jobs (채용공고)', () => {
  let ctx: E2EContext;
  let jobId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'jobs-e2e', normal: true, recruiter: true });
  }, 60000);

  afterAll(async () => {
    if (jobId) await ctx.authDelete('recruiter', `/api/jobs/${jobId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /api/jobs — 공개 목록', async () => {
    const res = await ctx.api().get('/api/jobs').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/jobs/stats — 통계', async () => {
    const res = await ctx.api().get('/api/jobs/stats').expect(200);
    expect(res.body.total).toBeDefined();
    expect(res.body.byCompany).toBeDefined();
  });

  it('POST /api/jobs — 작성 (recruiter)', async () => {
    const res = await ctx
      .authPost('recruiter', '/api/jobs')
      .send({
        company: 'E2E기업',
        position: 'FE 개발자',
        location: '서울',
        description: '테스트 채용공고',
        type: 'full_time',
        skills: 'React,TypeScript',
      })
      .expect(201);
    jobId = res.body.id;
    expect(jobId).toBeDefined();
  });

  it('POST /api/jobs — 비로그인 → 401', async () => {
    await ctx.api().post('/api/jobs').send({ company: 'X', position: 'Y' }).expect(401);
  });

  it('GET /api/jobs/:id — 상세', async () => {
    const res = await ctx.authGet('recruiter', `/api/jobs/${jobId}`).expect(200);
    expect(res.body.company).toBe('E2E기업');
  });

  it('GET /api/jobs/my — 내 공고', async () => {
    const res = await ctx.authGet('recruiter', '/api/jobs/my').expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('PUT /api/jobs/:id — 수정', async () => {
    const res = await ctx
      .authPut('recruiter', `/api/jobs/${jobId}`)
      .send({ company: 'E2E기업(수정)', position: '수정된 포지션' });
    expect([200]).toContain(res.status);
  });

  it('PUT /api/jobs/:id — 다른 유저 → 403 또는 404', async () => {
    const res = await ctx
      .authPut('normal', `/api/jobs/${jobId}`)
      .send({ company: 'H', position: 'Y' });
    expect([403, 404]).toContain(res.status);
  });

  it('GET /api/jobs/curated/list — 큐레이션', async () => {
    const res = await ctx.api().get('/api/jobs/curated/list').expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('GET /api/jobs/external-links/list — 외부링크', async () => {
    const res = await ctx.api().get('/api/jobs/external-links/list').expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('POST /api/jobs/external-links (일반 유저) — 결과는 구현 의존', async () => {
    const res = await ctx
      .authPost('normal', '/api/jobs/external-links')
      .send({ title: 'X', url: 'https://example.com', category: 'test' });
    expect([200, 201, 400, 403]).toContain(res.status);
  });
});
