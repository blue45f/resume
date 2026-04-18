/**
 * Community E2E — 게시글/댓글/좋아요/검색/정렬/필터
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Community (커뮤니티)', () => {
  let ctx: E2EContext;
  let postId: string;
  let secondPostId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'comm-e2e', normal: true, recruiter: true });
  }, 60000);

  afterAll(async () => {
    if (postId) await ctx.authDelete('normal', `/api/community/${postId}`).catch(() => undefined);
    if (secondPostId)
      await ctx.authDelete('normal', `/api/community/${secondPostId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /api/community — 공개 목록', async () => {
    const res = await ctx.api().get('/api/community?limit=5').expect(200);
    expect(res.body.items).toBeDefined();
    expect(typeof res.body.total).toBe('number');
  });

  it('POST /api/community — 게시글 작성', async () => {
    const res = await ctx
      .authPost('normal', '/api/community')
      .send({
        title: 'E2E 커뮤니티 테스트',
        content: '통합 테스트용 게시글 내용입니다.',
        category: 'free',
      })
      .expect(201);
    postId = res.body.id;
    expect(postId).toBeDefined();
  });

  it('POST /api/community — 비로그인 → 401', async () => {
    await ctx
      .api()
      .post('/api/community')
      .send({ title: 'x', content: 'test', category: 'free' })
      .expect(401);
  });

  it('GET /api/community/:id — 상세', async () => {
    const res = await ctx.authGet('normal', `/api/community/${postId}`).expect(200);
    expect(res.body.title).toBe('E2E 커뮤니티 테스트');
  });

  it('PATCH /api/community/:id — 수정', async () => {
    const res = await ctx.authPatch('normal', `/api/community/${postId}`).send({ title: '수정됨' });
    expect([200]).toContain(res.status);
  });

  it('PATCH /api/community/:id — 다른 유저 (IDOR) → 403 또는 404', async () => {
    const res = await ctx
      .authPatch('recruiter', `/api/community/${postId}`)
      .send({ title: '해킹' });
    expect([403, 404]).toContain(res.status);
  });

  it('POST /api/community/:id/like — 좋아요 토글', async () => {
    const res = await ctx.authPost('normal', `/api/community/${postId}/like`).expect(201);
    expect(typeof res.body.liked).toBe('boolean');
  });

  it('POST /api/community/:id/comments — 댓글 작성', async () => {
    const res = await ctx
      .authPost('normal', `/api/community/${postId}/comments`)
      .send({ content: '테스트 댓글' })
      .expect(201);
    expect(res.body.id).toBeDefined();
  });

  it('GET /api/community/:id/comments — 댓글 목록', async () => {
    const res = await ctx.api().get(`/api/community/${postId}/comments`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/community?category=free — 카테고리 필터', async () => {
    const res = await ctx.api().get('/api/community?category=free&limit=5').expect(200);
    expect(res.body.items).toBeDefined();
  });

  it('GET /api/community?search=E2E — 검색', async () => {
    const res = await ctx.api().get('/api/community?search=E2E&limit=5').expect(200);
    expect(res.body.items).toBeDefined();
  });

  it('GET /api/community?sort=popular — 인기순', async () => {
    const res = await ctx.api().get('/api/community?sort=popular&limit=5').expect(200);
    expect(res.body.items).toBeDefined();
  });

  it('DELETE /api/community/:id — 삭제 (본인)', async () => {
    const res = await ctx.authPost('normal', '/api/community').send({
      title: '삭제 테스트',
      content: '이 게시글은 즉시 삭제됩니다',
      category: 'free',
    });
    secondPostId = res.body.id;
    await ctx.authDelete('normal', `/api/community/${secondPostId}`).expect(200);
    secondPostId = '';
  });

  it('DELETE /api/community/:id — 다른 유저 → 403 또는 404', async () => {
    const res = await ctx.authDelete('recruiter', `/api/community/${postId}`);
    expect([403, 404]).toContain(res.status);
  });
});
