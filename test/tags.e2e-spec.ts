/**
 * Tags E2E — CRUD + 연결 + resumeCount
 */
import { E2EContext, setupE2EApp, cleanupTestData, createTestResume } from './e2e-helper';

const TAG_NAMES = ['e2e-tagA', 'e2e-tagB', 'e2e-tagC'];

describe('Tags (태그)', () => {
  let ctx: E2EContext;
  let resumeId: string;
  let tagA: string;
  let tagB: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'tag-e2e',
      normal: true,
      tagNames: TAG_NAMES,
    });
    const r = await createTestResume(ctx, 'normal', { title: '태그 테스트' });
    resumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
      TAG_NAMES,
    );
    await ctx.app.close();
  });

  it('GET /api/tags — 공개 목록 (비로그인)', async () => {
    const res = await ctx.api().get('/api/tags').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/tags — 태그 생성 (A)', async () => {
    const res = await ctx
      .authPost('normal', '/api/tags')
      .send({ name: TAG_NAMES[0], color: '#ff0000' })
      .expect(201);
    tagA = res.body.id;
    expect(res.body.name).toBe(TAG_NAMES[0]);
  });

  it('POST /api/tags — 두 번째 태그 (B)', async () => {
    const res = await ctx
      .authPost('normal', '/api/tags')
      .send({ name: TAG_NAMES[1], color: '#00ff00' })
      .expect(201);
    tagB = res.body.id;
  });

  it('POST /api/tags — 빈 이름 → 400', async () => {
    await ctx.authPost('normal', '/api/tags').send({ name: '' }).expect(400);
    await ctx.authPost('normal', '/api/tags').send({}).expect(400);
  });

  it('POST /api/tags — 중복 → 409', async () => {
    await ctx.authPost('normal', '/api/tags').send({ name: TAG_NAMES[0] }).expect(409);
  });

  it('POST /api/tags/:tagId/resumes/:resumeId — 태그 부착', async () => {
    await ctx.authPost('normal', `/api/tags/${tagA}/resumes/${resumeId}`).expect(201);
    await ctx.authPost('normal', `/api/tags/${tagB}/resumes/${resumeId}`).expect(201);
  });

  it('태그 목록의 resumeCount 업데이트', async () => {
    const list = await ctx.authGet('normal', '/api/tags').expect(200);
    const foundA = list.body.find((t: any) => t.id === tagA);
    expect(foundA.resumeCount).toBe(1);
  });

  it('이력서 조회 시 tags 배열 포함', async () => {
    const res = await ctx.authGet('normal', `/api/resumes/${resumeId}`).expect(200);
    expect(res.body.tags).toHaveLength(2);
  });

  it('DELETE /api/tags/:tagId/resumes/:resumeId — 태그 분리', async () => {
    await ctx.authDelete('normal', `/api/tags/${tagA}/resumes/${resumeId}`).expect(200);
    const res = await ctx.authGet('normal', `/api/resumes/${resumeId}`);
    expect(res.body.tags.length).toBe(1);
  });

  it('DELETE /api/tags/:id — 태그 삭제', async () => {
    await ctx.authDelete('normal', `/api/tags/${tagA}`).expect(200);
    await ctx.authDelete('normal', `/api/tags/${tagB}/resumes/${resumeId}`);
    await ctx.authDelete('normal', `/api/tags/${tagB}`).expect(200);
  });

  it('없는 태그 삭제 → 404', async () => {
    const res = await ctx.authDelete('normal', '/api/tags/fake-id');
    expect([404, 400]).toContain(res.status);
  });
});
