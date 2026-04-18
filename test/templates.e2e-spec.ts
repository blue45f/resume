/**
 * Templates E2E — 템플릿 CRUD + 로컬 변환 + 프리셋
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('Templates (템플릿)', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let tplId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'tpl-e2e', normal: true });
    const r = await createTestResume(ctx, 'normal', {
      title: '템플릿 테스트',
      personalInfo: { name: '템플러', email: 'tpl@test.local', summary: '요약' },
      experiences: [{ company: 'Acme', position: 'Dev', startDate: '2022-01-01', current: true }],
      skills: [{ category: 'FE', items: 'React,TypeScript' }],
      certifications: [{ name: 'SQLD', issuer: '데이콘', issueDate: '2023-01-01' }],
      languages: [{ name: '영어', testName: 'TOEIC', score: '900' }],
    });
    resumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (tplId) await ctx.authDelete('normal', `/api/templates/${tplId}`).catch(() => undefined);
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('템플릿 CRUD', () => {
    it('GET /api/templates — 목록 (공개)', async () => {
      const res = await ctx.api().get('/api/templates').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/templates/public — 공개만', async () => {
      const res = await ctx.api().get('/api/templates/public').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/templates — 이름 없으면 400', async () => {
      await ctx.authPost('normal', '/api/templates').send({ description: '노네임' }).expect(400);
    });

    it('POST /api/templates — 생성 (layout 포함)', async () => {
      const res = await ctx
        .authPost('normal', '/api/templates')
        .send({
          name: 'E2E 템플릿 ' + Date.now(),
          description: 'E2E 테스트용',
          category: 'developer',
          prompt: '프롬프트',
          layout: JSON.stringify({
            sections: ['personalInfo', 'skills', 'experiences'],
            dateFormat: 'text-day',
            style: 'modern',
          }),
        })
        .expect(201);
      tplId = res.body.id;
      const layout = JSON.parse(res.body.layout);
      expect(layout.sections).toContain('skills');
    });

    it('GET /api/templates/:id — 조회', async () => {
      const res = await ctx.authGet('normal', `/api/templates/${tplId}`).expect(200);
      expect(res.body.id).toBe(tplId);
    });

    it('PUT /api/templates/:id — 수정', async () => {
      const res = await ctx
        .authPut('normal', `/api/templates/${tplId}`)
        .send({ name: '수정된 템플릿' })
        .expect(200);
      expect(res.body.name).toBe('수정된 템플릿');
    });

    it('PUT /api/templates/fake → 404', async () => {
      await ctx.authPut('normal', '/api/templates/no-such-id').send({ name: 'x' }).expect(404);
    });

    it('DELETE /api/templates/fake → 404', async () => {
      await ctx.authDelete('normal', '/api/templates/no-such-id').expect(404);
    });
  });

  describe('프리셋 / 로컬 변환', () => {
    it('GET /api/templates/presets/list — 5개 프리셋', async () => {
      const res = await ctx.authGet('normal', '/api/templates/presets/list').expect(200);
      expect(res.body.length).toBe(5);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).toEqual(
        expect.arrayContaining(['standard', 'developer', 'career-focused', 'academic', 'minimal']),
      );
    });

    it('standard 변환 — 전체 섹션', async () => {
      const res = await ctx
        .authPost('normal', `/api/templates/local-transform/${resumeId}`)
        .send({ preset: 'standard' })
        .expect(201);
      expect(res.body.text).toContain('템플러');
    });

    it('minimal 변환 — 제한된 섹션', async () => {
      const res = await ctx
        .authPost('normal', `/api/templates/local-transform/${resumeId}`)
        .send({ preset: 'minimal' })
        .expect(201);
      expect(res.body.text).toContain('템플러');
    });

    it('커스텀 템플릿 변환', async () => {
      const res = await ctx
        .authPost('normal', `/api/templates/local-transform/${resumeId}`)
        .send({ templateId: tplId })
        .expect(201);
      expect(res.body.method).toBe('template');
    });

    it('없는 이력서 변환 → 404', async () => {
      await ctx
        .authPost('normal', '/api/templates/local-transform/fake-id')
        .send({ preset: 'standard' })
        .expect(404);
    });
  });
});
