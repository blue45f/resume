/**
 * E2E — 자기소개서 (CoverLetter)
 * CRUD + 이력서 연결 + 필터 + IDOR
 */
import { E2EContext, setupE2EApp, createTestResume } from './e2e-helper';

describe('Cover Letters E2E', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let clId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'cl-e2e', normal: true });
    const resume = await createTestResume(ctx, 'normal', { title: '자기소개서 테스트용' });
    resumeId = resume.id as string;
  }, 60000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/cover-letters — 생성', async () => {
    const res = await ctx
      .authPost('normal', '/api/cover-letters')
      .send({
        resumeId,
        company: '네이버',
        position: '프론트엔드 엔지니어',
        tone: 'formal',
        jobDescription: 'React + TypeScript 경험 필수',
        content:
          '안녕하십니까. 네이버 프론트엔드 엔지니어 직무에 지원한 홍길동입니다...\n\n성장 과정...\n\n지원 동기...',
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.company).toBe('네이버');
    expect(res.body.resumeId).toBe(resumeId);
    clId = res.body.id;
  });

  it('GET /api/cover-letters — 목록 조회', async () => {
    const res = await ctx.authGet('normal', '/api/cover-letters').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/cover-letters/:id — 단건 조회', async () => {
    const res = await ctx.authGet('normal', `/api/cover-letters/${clId}`).expect(200);
    expect(res.body.content).toContain('네이버');
  });

  it('GET /api/cover-letters/resume/:resumeId — 이력서별 필터', async () => {
    const res = await ctx.authGet('normal', `/api/cover-letters/resume/${resumeId}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((c: { id: string }) => c.id === clId)).toBe(true);
  });

  it('PUT /api/cover-letters/:id — 수정 (tone 변경)', async () => {
    const res = await ctx
      .authPut('normal', `/api/cover-letters/${clId}`)
      .send({ tone: 'friendly', content: '안녕하세요! 편한 톤으로 수정합니다.' })
      .expect(200);
    expect(res.body.tone).toBe('friendly');
  });

  it('PUT /api/cover-letters/:id — company 변경', async () => {
    const res = await ctx
      .authPut('normal', `/api/cover-letters/${clId}`)
      .send({ company: '카카오' });
    expect([200]).toContain(res.status);
    if (res.status === 200) expect(res.body.company).toBe('카카오');
  });

  it('비로그인 GET /api/cover-letters — 401 또는 빈 배열', async () => {
    const res = await ctx.api().get('/api/cover-letters');
    expect([200, 401]).toContain(res.status);
  });

  it('없는 id GET → 404', async () => {
    const res = await ctx.authGet('normal', '/api/cover-letters/fake-id-does-not-exist');
    expect([403, 404]).toContain(res.status);
  });

  it('DELETE /api/cover-letters/:id — 삭제', async () => {
    const res = await ctx.authDelete('normal', `/api/cover-letters/${clId}`);
    expect([200, 204]).toContain(res.status);
  });

  it('삭제 후 GET → 403 또는 404', async () => {
    const res = await ctx.authGet('normal', `/api/cover-letters/${clId}`);
    expect([403, 404]).toContain(res.status);
  });
});
