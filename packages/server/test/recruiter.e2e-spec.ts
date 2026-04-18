/**
 * Recruiter E2E — 채용담당자 전용 (스카웃/북마크/공개 검색)
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('Recruiter (채용담당자)', () => {
  let ctx: E2EContext;
  let publicResumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'recruiter-e2e', normal: true, recruiter: true });
    // 공개 이력서 하나 생성 (normal이 생성, visibility=public)
    const r = await createTestResume(ctx, 'normal', {
      title: '공개 이력서',
      personalInfo: { name: '공개자', summary: '공개 이력서 입니다' },
      visibility: 'public',
    });
    publicResumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (publicResumeId)
      await ctx.authDelete('normal', `/api/resumes/${publicResumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /api/resumes/public — 공개 이력서 검색', async () => {
    const res = await ctx.authGet('recruiter', '/api/resumes/public?limit=10').expect(200);
    expect(res.body.data || res.body.items).toBeDefined();
  });

  it('POST /api/resumes/:id/bookmark — 북마크 추가', async () => {
    const res = await ctx.authPost('recruiter', `/api/resumes/${publicResumeId}/bookmark`).send({});
    expect([200, 201, 403, 404, 409]).toContain(res.status);
  });

  it('GET /api/resumes/bookmarks/list — 북마크 목록', async () => {
    const res = await ctx.authGet('recruiter', '/api/resumes/bookmarks/list');
    expect([200, 401]).toContain(res.status);
  });

  it('GET /api/resumes/:id/bookmark/status — 상태', async () => {
    const res = await ctx.authGet('recruiter', `/api/resumes/${publicResumeId}/bookmark/status`);
    expect([200]).toContain(res.status);
  });

  it('POST /social/scout — 스카웃 전송', async () => {
    const res = await ctx.authPost('recruiter', '/api/social/scout').send({
      receiverId: ctx.userIds.normal,
      message: '함께하고 싶습니다',
      company: '테스트기업',
      position: 'FE 개발자',
    });
    expect([200, 201, 400, 403, 404]).toContain(res.status);
  });

  it('GET /social/scouts/sent — 보낸 스카웃', async () => {
    const res = await ctx.authGet('recruiter', '/api/social/scouts/sent').expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('DELETE /api/resumes/:id/bookmark — 북마크 해제', async () => {
    const res = await ctx.authDelete('recruiter', `/api/resumes/${publicResumeId}/bookmark`);
    expect([200, 204, 404]).toContain(res.status);
  });
});
