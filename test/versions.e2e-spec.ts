/**
 * Versions E2E — 버전 스냅샷 + 복원 + 소유권
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

describe('Versions (이력서 버전)', () => {
  let ctx: E2EContext;
  let resumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'version-e2e', normal: true, recruiter: true });
    const res = await createTestResume(ctx, 'normal', {
      title: '버전 테스트',
      personalInfo: { name: '원본', summary: '원본 요약' },
    });
    resumeId = res.id;
  }, 60000);

  afterAll(async () => {
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('수정할 때마다 버전 자동 생성', async () => {
    const before = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions`);
    const countBefore = before.body?.length || 0;

    await ctx.authPut('normal', `/api/resumes/${resumeId}`).send({ title: '변경1' }).expect(200);
    const after = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions`).expect(200);
    expect(after.body.length).toBeGreaterThan(countBefore);
  });

  it('버전 상세 조회', async () => {
    const versions = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions`).expect(200);
    expect(versions.body.length).toBeGreaterThan(0);
    const v = versions.body[0];
    const detail = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions/${v.id}`);
    expect([200]).toContain(detail.status);
  });

  it('복원 후 데이터 정확성', async () => {
    const versions = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions`);
    const oldest = versions.body[versions.body.length - 1];
    await ctx
      .authPost('normal', `/api/resumes/${resumeId}/versions/${oldest.id}/restore`)
      .expect(201);
    const restored = await ctx.authGet('normal', `/api/resumes/${resumeId}`);
    expect(restored.body.title).toBe('버전 테스트');
  });

  it('없는 버전 복원 → 404', async () => {
    await ctx
      .authPost('normal', `/api/resumes/${resumeId}/versions/fake-version-id/restore`)
      .expect(404);
  });

  it('다른 유저 → 버전 목록 조회 차단', async () => {
    const res = await ctx.authGet('recruiter', `/api/resumes/${resumeId}/versions`);
    expect([403, 404]).toContain(res.status);
  });

  it('다른 유저 → 버전 복원 시도 차단 (IDOR)', async () => {
    const versions = await ctx.authGet('normal', `/api/resumes/${resumeId}/versions`);
    const v = versions.body[0];
    if (!v) return;
    const res = await ctx.authPost(
      'recruiter',
      `/api/resumes/${resumeId}/versions/${v.id}/restore`,
    );
    expect([403, 404]).toContain(res.status);
  });
});
