/**
 * JobInterviewQuestions E2E
 * - 공개 목록 조회
 * - 로그인 유저 질문 등록 / upvote 토글 / 삭제
 * - 관리자 approve / reject / setUpvotes / 전체 목록
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('JobInterviewQuestions (예상 면접 질문)', () => {
  let ctx: E2EContext;
  let questionId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'jiq-e2e',
      admin: true,
      normal: true,
    });
  }, 60000);

  afterAll(async () => {
    // 테스트로 생성한 질문 정리
    await ctx.prisma.jobInterviewQuestion
      .deleteMany({ where: { companyName: '테스트회사-jiq' } })
      .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /job-interview-questions — 공개 목록 (비로그인)', async () => {
    const res = await ctx.api().get('/api/job-interview-questions').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    // 비로그인 응답은 모든 항목에 myVote=false
    for (const q of res.body.slice(0, 5)) {
      expect(q.myVote).toBe(false);
    }
  });

  it('POST /job-interview-questions — 비로그인 401', async () => {
    await ctx
      .api()
      .post('/api/job-interview-questions')
      .send({ companyName: '네이버', position: 'FE', question: '왜?' })
      .expect(401);
  });

  it('POST /job-interview-questions — 로그인 유저 등록', async () => {
    const res = await ctx.authPost('normal', '/api/job-interview-questions').send({
      companyName: '테스트회사-jiq',
      position: '프론트엔드',
      question: 'React 훅의 렌더링 규칙을 설명해주세요',
      sampleAnswer: '훅은 최상위 레벨에서만...',
      category: '기술',
      difficulty: 'intermediate',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeDefined();
    expect(res.body.companyName).toBe('테스트회사-jiq');
    expect(res.body.source).toBe('user');
    questionId = res.body.id;
  });

  it('POST /job-interview-questions — 공백 question BadRequest', async () => {
    await ctx
      .authPost('normal', '/api/job-interview-questions')
      .send({ companyName: 'T', position: 'P', question: '   ' })
      .expect(400);
  });

  it('POST /:id/upvote — 토글 (신규 업보트)', async () => {
    if (!questionId) return;
    const res = await ctx.authPost('normal', `/api/job-interview-questions/${questionId}/upvote`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.upvoted).toBe(true);
  });

  it('POST /:id/upvote — 두 번째 호출 시 취소', async () => {
    if (!questionId) return;
    const res = await ctx.authPost('normal', `/api/job-interview-questions/${questionId}/upvote`);
    expect([200, 201]).toContain(res.status);
    expect(res.body.upvoted).toBe(false);
  });

  it('GET /job-interview-questions?company=테스트회사-jiq — 필터', async () => {
    const res = await ctx
      .api()
      .get('/api/job-interview-questions?company=테스트회사-jiq')
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((q: any) => q.companyName.includes('테스트회사'))).toBe(true);
  });

  it('PATCH /admin/:id/approve — 관리자 채택', async () => {
    if (!questionId) return;
    const res = await ctx.authPatch(
      'admin',
      `/api/job-interview-questions/admin/${questionId}/approve`,
    );
    expect([200, 201]).toContain(res.status);
    expect(res.body.isApproved).toBe(true);
    expect(res.body.isRejected).toBe(false);
  });

  it('PATCH /admin/:id/reject — 관리자 반려 (배타적 플래그)', async () => {
    if (!questionId) return;
    const res = await ctx.authPatch(
      'admin',
      `/api/job-interview-questions/admin/${questionId}/reject`,
    );
    expect([200, 201]).toContain(res.status);
    expect(res.body.isRejected).toBe(true);
    expect(res.body.isApproved).toBe(false);
  });

  it('PATCH /admin/:id/upvotes — 관리자 수동 조정 (음수는 0으로)', async () => {
    if (!questionId) return;
    const res = await ctx
      .authPatch('admin', `/api/job-interview-questions/admin/${questionId}/upvotes`)
      .send({ upvotes: -5 });
    expect([200, 201]).toContain(res.status);
    expect(res.body.upvotes).toBe(0);
  });

  it('GET /admin/all?status=pending — 관리자 대기열', async () => {
    const res = await ctx
      .authGet('admin', '/api/job-interview-questions/admin/all?status=pending&limit=10')
      .expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });

  it('일반 유저는 /admin/ 엔드포인트 접근 차단', async () => {
    const res = await ctx.authGet('normal', '/api/job-interview-questions/admin/all');
    expect([401, 403]).toContain(res.status);
  });

  it('DELETE /:id — 작성자 삭제', async () => {
    if (!questionId) return;
    const res = await ctx.authDelete('normal', `/api/job-interview-questions/${questionId}`);
    expect([200, 201, 204]).toContain(res.status);
  });
});
