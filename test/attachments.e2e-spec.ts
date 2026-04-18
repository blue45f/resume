/**
 * Attachments E2E — upload/list/download/delete + IDOR
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('Attachments (첨부파일)', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let attId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'att-e2e', normal: true, recruiter: true });
    const r = await createTestResume(ctx, 'normal', { title: '첨부 테스트' });
    resumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (attId) await ctx.authDelete('normal', `/api/attachments/${attId}`).catch(() => undefined);
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('POST /resumes/:id/attachments — 업로드', async () => {
    const res = await ctx
      .authPost('normal', `/api/resumes/${resumeId}/attachments`)
      .field('category', 'portfolio')
      .field('description', '포트폴리오')
      .attach('file', Buffer.from('pdf-content'), {
        filename: 'portfolio.pdf',
        contentType: 'application/pdf',
      })
      .expect(201);
    attId = res.body.id;
    expect(res.body.originalName).toBe('portfolio.pdf');
    expect(res.body.mimeType).toBe('application/pdf');
    expect(res.body.category).toBe('portfolio');
  });

  it('POST — 파일 없이 업로드 → 400', async () => {
    await ctx
      .authPost('normal', `/api/resumes/${resumeId}/attachments`)
      .field('category', 'document')
      .expect(400);
  });

  it('POST — 없는 이력서 → 404', async () => {
    await ctx
      .authPost('normal', '/api/resumes/fake-id/attachments')
      .field('category', 'document')
      .attach('file', Buffer.from('x'), { filename: 'x.txt', contentType: 'text/plain' })
      .expect(404);
  });

  it('GET /resumes/:id/attachments — 목록', async () => {
    const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/attachments`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /attachments/:id/download — 다운로드', async () => {
    const res = await ctx.authGet('normal', `/api/attachments/${attId}/download`);
    expect([200, 302]).toContain(res.status);
  });

  it('GET /attachments/:id/download — 다른 유저 (IDOR 차단)', async () => {
    const res = await ctx.authGet('recruiter', `/api/attachments/${attId}/download`);
    expect([403, 404]).toContain(res.status);
  });

  it('DELETE /attachments/:id — 다른 유저 (IDOR 차단)', async () => {
    const res = await ctx.authDelete('recruiter', `/api/attachments/${attId}`);
    expect([403, 404]).toContain(res.status);
  });

  it('DELETE /attachments/fake → 404', async () => {
    await ctx.authDelete('normal', '/api/attachments/no-such-id').expect(404);
  });

  it('DELETE /attachments/:id — 소유자 삭제 → 200', async () => {
    await ctx.authDelete('normal', `/api/attachments/${attId}`).expect(200);
    // 삭제 후 다운로드 404
    await ctx.authGet('normal', `/api/attachments/${attId}/download`).expect(404);
    attId = ''; // afterAll에서 double-delete 방지
  });
});
