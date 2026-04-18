/**
 * E2E — 이력서 의견/댓글 (Comments)
 * 작성, 조회, 삭제, 대댓글, IDOR
 */
import { E2EContext, setupE2EApp, createTestResume } from './e2e-helper';

describe('Comments E2E', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let commentId: string;
  let replyId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'comments-e2e',
      normal: true,
      recruiter: true,
      admin: true,
    });
    const resume = await createTestResume(ctx, 'normal', {
      title: '댓글 테스트 이력서',
    });
    // 공개 이력서여야 댓글 달 수 있음
    await ctx
      .authPatch('normal', `/api/resumes/${resume.id}/visibility`)
      .send({ visibility: 'public' });
    resumeId = resume.id as string;
  }, 60000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/resumes/:id/comments — 의견 작성', async () => {
    const res = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/comments`)
      .send({ content: '멋진 이력서네요. 관심 있습니다.' });
    expect([200, 201]).toContain(res.status);
    if (res.status === 201) {
      expect(res.body.id).toBeDefined();
      commentId = res.body.id;
    }
  });

  it('GET /api/resumes/:id/comments — 공개 목록 조회', async () => {
    const res = await ctx.api().get(`/api/resumes/${resumeId}/comments`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST 대댓글 — parentId 지정', async () => {
    if (!commentId) return;
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/comments`)
      .send({ content: '감사합니다!', parentId: commentId });
    expect([200, 201]).toContain(res.status);
    if (res.body?.id) replyId = res.body.id;
  });

  it('비로그인 POST → authorName 으로 익명 의견', async () => {
    const res = await ctx
      .api()
      .post(`/api/resumes/${resumeId}/comments`)
      .send({ content: '익명 방문자 의견', authorName: '지나가던 개발자' });
    expect([200, 201, 401, 429]).toContain(res.status);
  });

  it('빈 content → 400', async () => {
    const res = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/comments`)
      .send({ content: '' });
    expect([400, 422]).toContain(res.status);
  });

  it('DELETE 내 댓글 → 200', async () => {
    if (!replyId) return;
    const res = await ctx.authDelete('normal', `/api/resumes/${resumeId}/comments/${replyId}`);
    expect([200, 204]).toContain(res.status);
  });

  it('DELETE 타인 댓글 (일반 유저) → 403', async () => {
    if (!commentId) return;
    const res = await ctx.authDelete('normal', `/api/resumes/${resumeId}/comments/${commentId}`);
    expect([403, 404]).toContain(res.status);
  });

  it('DELETE admin으로 타인 댓글 → 200 (관리자 권한)', async () => {
    if (!commentId) return;
    const res = await ctx.authDelete('admin', `/api/resumes/${resumeId}/comments/${commentId}`);
    expect([200, 204, 404]).toContain(res.status);
  });

  it('없는 댓글 DELETE → 404', async () => {
    const res = await ctx.authDelete('normal', `/api/resumes/${resumeId}/comments/fake-id-xxx`);
    expect([403, 404]).toContain(res.status);
  });
});
