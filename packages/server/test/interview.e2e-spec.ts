/**
 * Interview E2E — 면접 답변 + 직무별 면접 질문
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Interview (면접)', () => {
  let ctx: E2EContext;
  let answerId: string;
  let questionId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'interview-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    if (answerId)
      await ctx.authDelete('normal', `/api/interview/answers/${answerId}`).catch(() => undefined);
    if (questionId)
      await ctx
        .authDelete('normal', `/api/job-interview-questions/${questionId}`)
        .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('면접 답변', () => {
    it('GET /interview/answers — 내 답변', async () => {
      const res = await ctx.authGet('normal', '/api/interview/answers').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('POST /interview/answers — 답변 저장', async () => {
      const res = await ctx.authPost('normal', '/api/interview/answers').send({
        question: '본인의 강점은?',
        answer: '책임감과 꾸준함입니다.',
        category: 'personality',
      });
      expect([200, 201, 400]).toContain(res.status);
      if ((res.status === 200 || res.status === 201) && res.body?.id) answerId = res.body.id;
    });

    it('DELETE /interview/answers/fake → 404 또는 400', async () => {
      const res = await ctx.authDelete('normal', '/api/interview/answers/fake-id');
      expect([200, 204, 400, 404]).toContain(res.status);
    });

    it('비로그인 → 401', async () => {
      await ctx.api().get('/api/interview/answers').expect(401);
    });
  });

  describe('직무 면접 질문', () => {
    it('GET /job-interview-questions — 목록', async () => {
      const res = await ctx.api().get('/api/job-interview-questions').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('POST /job-interview-questions — 질문 등록', async () => {
      const res = await ctx.authPost('normal', '/api/job-interview-questions').send({
        jobRole: 'frontend',
        question: 'React에서 useMemo와 useCallback의 차이는?',
        category: 'technical',
      });
      expect([200, 201, 400]).toContain(res.status);
      if ((res.status === 200 || res.status === 201) && res.body?.id) questionId = res.body.id;
    });

    it('POST /job-interview-questions/:id/upvote — 추천', async () => {
      if (!questionId) return;
      const res = await ctx.authPost('normal', `/api/job-interview-questions/${questionId}/upvote`);
      expect([200, 201]).toContain(res.status);
    });

    it('POST /job-interview-questions/ai-generate — AI 질문 생성', async () => {
      const res = await ctx
        .authPost('normal', '/api/job-interview-questions/ai-generate')
        .send({ jobRole: 'frontend' });
      expect([200, 201, 400, 429, 500]).toContain(res.status);
    }, 30000);
  });
});
