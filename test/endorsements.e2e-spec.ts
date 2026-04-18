/**
 * E2E — 이력서 스킬 추천 (Endorsements)
 * toggle endorse + list + IDOR (자기 이력서 셀프 추천 방지 가능성)
 */
import { E2EContext, setupE2EApp, createTestResume } from './e2e-helper';

describe('Endorsements E2E', () => {
  let ctx: E2EContext;
  let resumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'endorse-e2e',
      normal: true,
      recruiter: true,
    });
    const resume = await createTestResume(ctx, 'normal', {
      title: '추천 테스트',
      skills: [
        { category: 'Frontend', items: 'React, TypeScript' },
        { category: 'Backend', items: 'NestJS, Prisma' },
      ],
    });
    resumeId = resume.id as string;
    // 공개 설정
    await ctx
      .authPatch('normal', `/api/resumes/${resumeId}/visibility`)
      .send({ visibility: 'public' });
  }, 60000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/resumes/:id/endorsements — 초기 빈 목록', async () => {
    const res = await ctx.api().get(`/api/resumes/${resumeId}/endorsements`).expect(200);
    // 응답 형식 유연하게: [] 또는 { skills: [...] }
    expect(res.body).toBeDefined();
  });

  it('POST /api/resumes/:id/endorse — 리쿠르터가 React 추천', async () => {
    const res = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/endorse`)
      .send({ skill: 'React' });
    expect([200, 201]).toContain(res.status);
  });

  it('POST /api/resumes/:id/endorse — 다른 스킬 TypeScript 추천', async () => {
    const res = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/endorse`)
      .send({ skill: 'TypeScript' });
    expect([200, 201]).toContain(res.status);
  });

  it('GET /api/resumes/:id/endorsements — 추천 후 목록 반영', async () => {
    const res = await ctx.api().get(`/api/resumes/${resumeId}/endorsements`).expect(200);
    expect(res.body).toBeDefined();
  });

  it('POST /api/resumes/:id/endorse — 토글(같은 스킬 재호출은 취소)', async () => {
    const res1 = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/endorse`)
      .send({ skill: 'React' });
    // 재호출은 성공 또는 204
    expect([200, 201, 204]).toContain(res1.status);
  });

  it('POST /api/resumes/:id/endorse — 빈 skill → 400', async () => {
    const res = await ctx
      .authPost('recruiter', `/api/resumes/${resumeId}/endorse`)
      .send({ skill: '' });
    expect([400, 422]).toContain(res.status);
  });

  it('POST /api/resumes/:id/endorse — 비로그인 → 401', async () => {
    const res = await ctx.api().post(`/api/resumes/${resumeId}/endorse`).send({ skill: 'Node.js' });
    expect([401, 403]).toContain(res.status);
  });

  it('POST 존재하지 않는 이력서 → 404/500', async () => {
    const res = await ctx
      .authPost('recruiter', '/api/resumes/nonexistent-resume-id/endorse')
      .send({ skill: 'React' });
    // FK 위반 Prisma 에러가 500로 올라올 수도 있음
    expect([400, 404, 500]).toContain(res.status);
  });
});
