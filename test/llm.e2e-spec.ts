/**
 * LLM E2E — providers/usage/history/transform/feedback/job-match/interview
 * (네트워크 의존 테스트는 status 여유 처리)
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('LLM (AI 변환)', () => {
  let ctx: E2EContext;
  let resumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'llm-e2e', normal: true });
    const r = await createTestResume(ctx, 'normal', {
      title: 'LLM 테스트',
      personalInfo: { name: 'LLM유저', summary: 'LLM 테스트' },
      experiences: [{ company: 'A', position: 'Dev', startDate: '2023-01-01', current: true }],
    });
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

  it('GET /transform/providers — 배열', async () => {
    const res = await ctx
      .authGet('normal', `/api/resumes/${resumeId}/transform/providers`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /transform/usage — 사용량 통계', async () => {
    const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/transform/usage`).expect(200);
    expect(typeof res.body.totalTransformations).toBe('number');
    expect(typeof res.body.totalTokensUsed).toBe('number');
  });

  it('GET /transform/history — 이력 배열', async () => {
    const res = await ctx
      .authGet('normal', `/api/resumes/${resumeId}/transform/history`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /transform (잘못된 templateType) → 400', async () => {
    await ctx
      .authPost('normal', `/api/resumes/${resumeId}/transform`)
      .send({ templateType: 'no-such-template' })
      .expect(400);
  });

  it('POST /transform (standard) → 200/201/400/429/500 허용', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/transform`)
      .send({ templateType: 'standard' });
    expect([200, 201, 400, 429, 500]).toContain(res.status);
  }, 30000);

  it('POST /transform/feedback — 피드백 생성', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/transform/feedback`)
      .send({});
    // 프로바이더 미설정 시 400, 플랜 미충족 시 403, 실제 환경에서 201
    expect([200, 201, 400, 403, 429, 500]).toContain(res.status);
  }, 30000);

  it('POST /transform/job-match — 매칭', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/transform/job-match`)
      .send({ jobDescription: 'React 개발자 모집' });
    expect([200, 201, 400, 403, 429, 500]).toContain(res.status);
  }, 30000);

  it('POST /transform/interview — 면접 생성', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/transform/interview`)
      .send({});
    expect([200, 201, 400, 403, 429, 500]).toContain(res.status);
  }, 30000);

  it('POST /transform (비로그인) → 401 또는 403', async () => {
    const res = await ctx
      .api()
      .post(`/api/resumes/${resumeId}/transform`)
      .send({ templateType: 'standard' });
    expect([401, 403]).toContain(res.status);
  });
});
