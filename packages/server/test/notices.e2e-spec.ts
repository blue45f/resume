/**
 * Notices E2E — 공지사항
 * - 공개 목록/상세 조회 (viewCount 증가)
 * - 관리자 전용 CRUD + 댓글 허용 토글
 * - 편집 이력 추적
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Notices (공지사항)', () => {
  let ctx: E2EContext;
  let noticeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'notice-e2e', admin: true, normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.prisma.notice
      .deleteMany({ where: { title: { contains: '[E2E-TEST]' } } })
      .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /notices — 공개 목록 (비로그인)', async () => {
    const res = await ctx.api().get('/api/notices').expect(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('GET /notices/popup — 활성 팝업만 (공개)', async () => {
    const res = await ctx.api().get('/api/notices/popup').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /notices — 일반 유저 403', async () => {
    const res = await ctx
      .authPost('normal', '/api/notices')
      .send({ title: '[E2E-TEST]', content: 'x' });
    expect(res.status).toBe(403);
  });

  it('POST /notices — 관리자 생성', async () => {
    const res = await ctx.authPost('admin', '/api/notices').send({
      title: '[E2E-TEST] 테스트 공지',
      content: '본문',
      type: 'GENERAL',
      allowComments: true,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.id).toBeDefined();
    noticeId = res.body.id;
  });

  it('GET /notices/:id — 상세 조회 시 viewCount 증가', async () => {
    if (!noticeId) return;
    const first = await ctx.api().get(`/api/notices/${noticeId}`).expect(200);
    const second = await ctx.api().get(`/api/notices/${noticeId}`).expect(200);
    expect(second.body.viewCount).toBeGreaterThan(first.body.viewCount);
  });

  it('PATCH /notices/:id — 관리자 수정 + reason → 이력 저장', async () => {
    if (!noticeId) return;
    const res = await ctx.authPatch('admin', `/api/notices/${noticeId}`).send({
      title: '[E2E-TEST] 수정됨',
      reason: '오타 수정',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.body.title).toBe('[E2E-TEST] 수정됨');
  });

  it('GET /notices/:id/history — 관리자만 이력 조회', async () => {
    if (!noticeId) return;
    const nonAdmin = await ctx.authGet('normal', `/api/notices/${noticeId}/history`);
    expect(nonAdmin.status).toBe(403);

    const res = await ctx.authGet('admin', `/api/notices/${noticeId}/history`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].prevTitle).toBe('[E2E-TEST] 테스트 공지');
    expect(res.body[0].reason).toBe('오타 수정');
  });

  it('POST /notices/:id/comments — allowComments=true 상태에서 일반 유저 댓글', async () => {
    if (!noticeId) return;
    const res = await ctx
      .authPost('normal', `/api/notices/${noticeId}/comments`)
      .send({ content: 'E2E 댓글' });
    expect([200, 201]).toContain(res.status);
  });

  it('비로그인 → 댓글 작성 403', async () => {
    if (!noticeId) return;
    await ctx
      .api()
      .post(`/api/notices/${noticeId}/comments`)
      .send({ content: '익명 댓글' })
      .expect(403);
  });

  it('PATCH /notices/:id/toggle-comments — 관리자 댓글 비허용 전환', async () => {
    if (!noticeId) return;
    const res = await ctx
      .authPatch('admin', `/api/notices/${noticeId}/toggle-comments`)
      .send({ allow: false });
    expect([200, 201]).toContain(res.status);
    expect(res.body.allowComments).toBe(false);
  });

  it('POST /notices/:id/comments — 비허용 전환 후 403', async () => {
    if (!noticeId) return;
    const res = await ctx
      .authPost('normal', `/api/notices/${noticeId}/comments`)
      .send({ content: '불가' });
    expect(res.status).toBe(403);
  });

  it('DELETE /notices/:id — 일반 유저 403, 관리자 허용', async () => {
    if (!noticeId) return;
    const nonAdmin = await ctx.authDelete('normal', `/api/notices/${noticeId}`);
    expect(nonAdmin.status).toBe(403);

    const res = await ctx.authDelete('admin', `/api/notices/${noticeId}`);
    expect([200, 201, 204]).toContain(res.status);
  });
});
