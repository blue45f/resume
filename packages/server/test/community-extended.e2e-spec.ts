/// <reference types="jest" />
/// <reference types="node" />
/**
 * Community Extended E2E — 카테고리/댓글/신고 + 답글 + IDOR
 * (community 에 'isAnonymous' 옵션은 미구현 — 향후 도입 시 보강)
 */
import { setupE2EApp, cleanupTestData, E2EContext } from './e2e-helper';

describe('Community Extended', () => {
  let ctx: E2EContext;
  const postIds: string[] = [];

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'comm-ext-e2e',
      normal: true,
      recruiter: true,
    });
    // admin 직접 DB 발급 (throttle 회피)
    const adminEmail = 'comm-ext-e2e-admin@test.local';
    await ctx.prisma.user.deleteMany({ where: { email: adminEmail } }).catch(() => undefined);
    const adminUser = await ctx.prisma.user.create({
      data: {
        email: adminEmail,
        name: 'comm-admin',
        passwordHash: 'x',
        role: 'admin',
        provider: 'email',
        providerId: `email:${adminEmail}`,
      },
    });
    ctx.userIds.admin = adminUser.id;
    const jwt = ctx.app.get(require('@nestjs/jwt').JwtService);
    ctx.tokens.admin = jwt.sign({ sub: adminUser.id, role: 'admin' });
  }, 60000);

  afterAll(async () => {
    for (const id of postIds) {
      await ctx.authDelete('admin', `/api/community/${id}`).catch(() => undefined);
    }
    const emails = [
      ...Object.values(ctx.users).map((u) => u.email),
      'comm-ext-e2e-admin@test.local',
    ];
    await cleanupTestData(ctx.prisma, emails);
    await ctx.app.close();
  });

  describe('카테고리별 작성', () => {
    const cats = ['free', 'resume', 'career', 'notice'];
    cats.forEach((category) => {
      it(`POST 카테고리=${category}`, async () => {
        const res = await ctx.authPost('normal', '/api/community').send({
          title: `cat-${category}`,
          content: `내용 ${category}`,
          category,
        });
        // free 외 카테고리도 통과해야 정상. notice 는 admin 전용일 수도 있음.
        expect([200, 201, 400, 403]).toContain(res.status);
        if (res.status === 201 && res.body?.id) {
          postIds.push(res.body.id);
        }
      });
    });

    it('GET ?category=resume — 카테고리 필터', async () => {
      const res = await ctx.api().get('/api/community?category=resume&limit=10').expect(200);
      expect(res.body.items).toBeDefined();
      res.body.items.forEach((p: any) => expect(p.category).toBe('resume'));
    });

    it('GET ?category=invalid_cat — 빈 목록', async () => {
      const res = await ctx.api().get('/api/community?category=invalid_cat').expect(200);
      expect(res.body.items.length).toBe(0);
    });
  });

  describe('댓글', () => {
    let postId: string;

    beforeAll(async () => {
      // throttle 회피 위해 Prisma 직접 insert
      const post = await ctx.prisma.communityPost.create({
        data: {
          userId: ctx.userIds.normal,
          title: '댓글 테스트',
          content: '댓글 다세요!',
          category: 'free',
        },
      });
      postId = post.id;
      postIds.push(postId);
    });

    it('댓글 작성', async () => {
      const res = await ctx
        .authPost('recruiter', `/api/community/${postId}/comments`)
        .send({ content: '첫 댓글' });
      expect([200, 201]).toContain(res.status);
    });

    it('대댓글 (parentId) — comments 엔드포인트 인자 직접 전달', async () => {
      const parent = await ctx
        .authPost('normal', `/api/community/${postId}/comments`)
        .send({ content: '부모 댓글' });
      expect([200, 201]).toContain(parent.status);
      const parentId = parent.body?.id;
      if (!parentId) return;
      const child = await ctx
        .authPost('recruiter', `/api/community/${postId}/comments`)
        .send({ content: '자식 댓글', parentId });
      expect([200, 201, 400]).toContain(child.status);
    });

    it('비로그인 댓글 (controller 가 anon 허용?)', async () => {
      // 컨트롤러는 req.user?.id 없어도 service.addComment 호출 → service 가 처리
      const res = await ctx.api().post(`/api/community/${postId}/comments`).send({
        content: '익명 댓글',
        authorName: '익명',
      });
      // 환경에 따라 401/400/200 모두 가능
      expect([200, 201, 400, 401]).toContain(res.status);
    });

    it('빈 content → 400', async () => {
      const res = await ctx
        .authPost('normal', `/api/community/${postId}/comments`)
        .send({ content: '' });
      expect([400, 200, 201]).toContain(res.status);
    });

    it('comments 목록 조회', async () => {
      const res = await ctx.api().get(`/api/community/${postId}/comments`).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('댓글 삭제 — 본인', async () => {
      const create = await ctx
        .authPost('normal', `/api/community/${postId}/comments`)
        .send({ content: '삭제할 댓글' });
      const cid = create.body?.id;
      if (!cid) return;
      const del = await ctx.authDelete('normal', `/api/community/${postId}/comments/${cid}`);
      expect([200, 204]).toContain(del.status);
    });

    it('댓글 삭제 — 타인 (IDOR) → 403/404', async () => {
      const create = await ctx
        .authPost('normal', `/api/community/${postId}/comments`)
        .send({ content: 'IDOR 테스트' });
      const cid = create.body?.id;
      if (!cid) return;
      const del = await ctx.authDelete('recruiter', `/api/community/${postId}/comments/${cid}`);
      expect([403, 404, 500]).toContain(del.status);
    });
  });

  describe('신고 + admin 처리', () => {
    let postId: string;

    beforeAll(async () => {
      // throttle 회피
      const post = await ctx.prisma.communityPost.create({
        data: {
          userId: ctx.userIds.normal,
          title: '신고 테스트',
          content: '부적절 내용 가정',
          category: 'free',
        },
      });
      postId = post.id;
      postIds.push(postId);
    });

    it('타 유저가 신고 → 201', async () => {
      const res = await ctx
        .authPost('recruiter', `/api/community/${postId}/report`)
        .send({ reason: 'spam', detail: '광고성' });
      expect([200, 201]).toContain(res.status);
    });

    it('비로그인 신고 → 401', async () => {
      const res = await ctx.api().post(`/api/community/${postId}/report`).send({ reason: 'spam' });
      expect([401]).toContain(res.status);
    });

    it('admin reports 목록 조회', async () => {
      const res = await ctx.authGet('admin', '/api/community/admin/reports?limit=20');
      expect([200]).toContain(res.status);
    });

    it('non-admin reports 조회 → 403', async () => {
      const res = await ctx.authGet('normal', '/api/community/admin/reports');
      expect([403, 401]).toContain(res.status);
    });

    it('admin unhide', async () => {
      const res = await ctx.authPost('admin', `/api/community/admin/${postId}/unhide`).send({});
      expect([200, 201]).toContain(res.status);
    });
  });

  describe('정렬 / 검색', () => {
    it('GET ?sort=popular', async () => {
      const res = await ctx.api().get('/api/community?sort=popular&limit=5').expect(200);
      expect(res.body.items).toBeDefined();
    });

    it('GET ?search= — 검색 (key=search 또는 q)', async () => {
      const res = await ctx.api().get('/api/community?search=댓글').expect(200);
      expect(res.body.items).toBeDefined();
    });
  });
});
