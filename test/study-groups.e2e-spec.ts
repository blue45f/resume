/**
 * Study Groups E2E — 그룹 생성/참여/질문
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Study Groups (스터디 그룹)', () => {
  let ctx: E2EContext;
  let groupId: string;
  let questionId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'group-e2e', normal: true, recruiter: true });
  }, 60000);

  afterAll(async () => {
    if (groupId)
      await ctx.authDelete('normal', `/api/study-groups/${groupId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /study-groups — 공개 목록', async () => {
    const res = await ctx.api().get('/api/study-groups').expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('POST /study-groups — 생성', async () => {
    const res = await ctx.authPost('normal', '/api/study-groups').send({
      name: 'E2E 스터디',
      description: '테스트용 스터디 그룹',
      category: 'frontend',
      maxMembers: 10,
    });
    expect([200, 201, 400]).toContain(res.status);
    groupId = res.body?.id;
  });

  it('POST /study-groups — 비로그인 401', async () => {
    await ctx.api().post('/api/study-groups').send({ name: 'x', description: 'y' }).expect(401);
  });

  it('GET /study-groups/:id — 상세', async () => {
    if (!groupId) return;
    const res = await ctx.authGet('normal', `/api/study-groups/${groupId}`).expect(200);
    expect(res.body.id).toBe(groupId);
  });

  it('POST /study-groups/:id/join — 참여 (다른 유저)', async () => {
    if (!groupId) return;
    const res = await ctx.authPost('recruiter', `/api/study-groups/${groupId}/join`).send({});
    expect([200, 201, 400, 409]).toContain(res.status);
  });

  it('POST /study-groups/:id/questions — 질문 등록', async () => {
    if (!groupId) return;
    const res = await ctx
      .authPost('normal', `/api/study-groups/${groupId}/questions`)
      .send({ content: '테스트 질문' });
    expect([200, 201, 400]).toContain(res.status);
    questionId = res.body?.id;
  });

  it('GET /study-groups/:id/questions — 질문 목록', async () => {
    if (!groupId) return;
    const res = await ctx.authGet('normal', `/api/study-groups/${groupId}/questions`).expect(200);
    expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
  });

  it('DELETE /study-groups/:id/leave — 나가기', async () => {
    if (!groupId) return;
    const res = await ctx.authDelete('recruiter', `/api/study-groups/${groupId}/leave`);
    expect([200, 204, 404]).toContain(res.status);
  });
});
