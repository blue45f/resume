/**
 * Admin E2E — 관리자 전용 엔드포인트
 * - admin stats, users list, role change
 * - forbidden words CRUD
 * - banners CRUD
 * - notices CRUD + toggle comments + history
 * - system config get/set
 * - permissions matrix
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Admin (관리자)', () => {
  let ctx: E2EContext;
  const trashWords: string[] = [];
  const trashBanners: string[] = [];
  const trashNotices: string[] = [];

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'admin-e2e',
      normal: true,
      admin: true,
    });
  }, 60000);

  afterAll(async () => {
    for (const id of trashWords) {
      await ctx.authDelete('admin', `/api/forbidden-words/${id}`).catch(() => undefined);
    }
    for (const id of trashBanners) {
      await ctx.authDelete('admin', `/api/banners/${id}`).catch(() => undefined);
    }
    for (const id of trashNotices) {
      await ctx.authDelete('admin', `/api/notices/${id}`).catch(() => undefined);
    }
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('Admin 통계', () => {
    it('GET /api/health/admin/stats (비어드민) → 403', async () => {
      await ctx.authGet('normal', '/api/health/admin/stats').expect(403);
    });

    it('GET /api/health/admin/stats (어드민) → 200', async () => {
      const res = await ctx.authGet('admin', '/api/health/admin/stats').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('GET /api/health/admin/stats (비로그인) → 401', async () => {
      await ctx.api().get('/api/health/admin/stats').expect(401);
    });
  });

  describe('사용자 관리', () => {
    it('GET /api/auth/admin/users (비어드민) → 빈 배열', async () => {
      const res = await ctx.authGet('normal', '/api/auth/admin/users').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toEqual([]);
    });

    it('GET /api/auth/admin/users (어드민) → 유저 배열', async () => {
      const res = await ctx.authGet('admin', '/api/auth/admin/users').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/auth/admin/users?search=admin-e2e — 검색', async () => {
      const res = await ctx
        .authGet('admin', '/api/auth/admin/users')
        .query({ search: 'admin-e2e' })
        .expect(200);
      expect(res.body.some((u: any) => u.email.includes('admin-e2e'))).toBe(true);
    });

    it('POST /api/auth/admin/users/:id/role (superadmin 아님) → 403', async () => {
      const res = await ctx
        .authPost('admin', `/api/auth/admin/users/${ctx.userIds.normal}/role`)
        .send({ role: 'admin' });
      expect([403]).toContain(res.status);
    });
  });

  describe('금칙어 관리', () => {
    let wordId: string;

    it('POST /api/forbidden-words (어드민) — 생성', async () => {
      const res = await ctx
        .authPost('admin', '/api/forbidden-words')
        .send({ word: 'e2e-forbidden-word-' + Date.now(), category: 'test', severity: 'block' });
      expect([200, 201]).toContain(res.status);
      wordId = res.body?.id;
      if (wordId) trashWords.push(wordId);
    });

    it('POST /api/forbidden-words (일반 유저) → error 응답', async () => {
      const res = await ctx
        .authPost('normal', '/api/forbidden-words')
        .send({ word: 'should-not-work', category: 'test' });
      expect([200, 201]).toContain(res.status);
      expect(res.body?.error).toBeDefined();
    });

    it('GET /api/forbidden-words (어드민) — 목록', async () => {
      const res = await ctx.authGet('admin', '/api/forbidden-words').expect(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeDefined();
    });

    it('GET /api/forbidden-words (일반) → 빈 목록', async () => {
      const res = await ctx.authGet('normal', '/api/forbidden-words').expect(200);
      expect(res.body.items).toEqual([]);
    });

    it('GET /api/forbidden-words/stats (어드민)', async () => {
      const res = await ctx.authGet('admin', '/api/forbidden-words/stats').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('GET /api/forbidden-words/categories (어드민)', async () => {
      const res = await ctx.authGet('admin', '/api/forbidden-words/categories').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/forbidden-words/check — 정상 텍스트', async () => {
      const res = await ctx
        .authPost('normal', '/api/forbidden-words/check')
        .send({ text: '안녕하세요 정상 텍스트입니다' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.blocked).toBe(false);
    });

    it('PATCH /api/forbidden-words/:id — 수정', async () => {
      if (!wordId) return;
      const res = await ctx
        .authPatch('admin', `/api/forbidden-words/${wordId}`)
        .send({ severity: 'warn' });
      expect([200]).toContain(res.status);
    });
  });

  describe('배너 관리', () => {
    let bannerId: string;

    it('GET /api/banners/active — 공개', async () => {
      const res = await ctx.api().get('/api/banners/active').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/banners (어드민) — 생성', async () => {
      const res = await ctx.authPost('admin', '/api/banners').send({
        title: 'E2E 테스트 배너',
        imageUrl: 'https://example.com/a.png',
        linkUrl: 'https://example.com',
        isActive: true,
      });
      expect([200, 201]).toContain(res.status);
      bannerId = res.body?.id;
      if (bannerId) trashBanners.push(bannerId);
    });

    it('POST /api/banners (일반 유저) → 403', async () => {
      const res = await ctx.authPost('normal', '/api/banners').send({ title: 'X', imageUrl: 'x' });
      expect([403, 401]).toContain(res.status);
    });

    it('PATCH /api/banners/:id (어드민) — 수정', async () => {
      if (!bannerId) return;
      const res = await ctx
        .authPatch('admin', `/api/banners/${bannerId}`)
        .send({ title: '수정된 배너' });
      expect([200]).toContain(res.status);
    });

    it('GET /api/banners (어드민) — 전체 (비활성 포함)', async () => {
      const res = await ctx.authGet('admin', '/api/banners').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('공지사항 관리', () => {
    let noticeId: string;

    it('GET /api/notices — 공개 목록', async () => {
      const res = await ctx.api().get('/api/notices?limit=5').expect(200);
      expect(res.body.items || Array.isArray(res.body)).toBeTruthy();
    });

    it('GET /api/notices/popup — 팝업', async () => {
      const res = await ctx.api().get('/api/notices/popup').expect(200);
      expect(res.body === null || typeof res.body === 'object').toBe(true);
    });

    it('POST /api/notices (일반 유저) → 403', async () => {
      const res = await ctx
        .authPost('normal', '/api/notices')
        .send({ title: 'test', content: 'test', type: 'GENERAL' });
      expect([403]).toContain(res.status);
    });

    it('POST /api/notices (어드민) — 생성', async () => {
      const res = await ctx.authPost('admin', '/api/notices').send({
        title: 'E2E 관리자 공지',
        content: '테스트 공지 내용입니다',
        type: 'GENERAL',
      });
      expect([200, 201]).toContain(res.status);
      noticeId = res.body?.id;
      if (noticeId) trashNotices.push(noticeId);
    });

    it('PATCH /api/notices/:id (어드민) — 수정', async () => {
      if (!noticeId) return;
      const res = await ctx
        .authPatch('admin', `/api/notices/${noticeId}`)
        .send({ title: '수정된 공지', reason: '테스트 수정' });
      expect([200]).toContain(res.status);
    });

    it('PATCH /api/notices/:id/toggle-comments (어드민)', async () => {
      if (!noticeId) return;
      const res = await ctx
        .authPatch('admin', `/api/notices/${noticeId}/toggle-comments`)
        .send({ allow: false });
      expect([200]).toContain(res.status);
    });

    it('GET /api/notices/:id/history (어드민)', async () => {
      if (!noticeId) return;
      const res = await ctx.authGet('admin', `/api/notices/${noticeId}/history`);
      expect([200]).toContain(res.status);
    });

    it('GET /api/notices/:id/history (일반) → 403', async () => {
      if (!noticeId) return;
      const res = await ctx.authGet('normal', `/api/notices/${noticeId}/history`);
      expect([403]).toContain(res.status);
    });
  });

  describe('시스템 설정', () => {
    it('GET /api/system-config/public — 공개', async () => {
      const res = await ctx.api().get('/api/system-config/public').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('GET /api/system-config/permissions — 공개', async () => {
      const res = await ctx.api().get('/api/system-config/permissions').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('GET /api/system-config (어드민) — 전체 설정', async () => {
      const res = await ctx.authGet('admin', '/api/system-config');
      expect([200]).toContain(res.status);
    });

    it('GET /api/system-config (일반) → 403', async () => {
      const res = await ctx.authGet('normal', '/api/system-config');
      expect([401, 403]).toContain(res.status);
    });

    it('PATCH /api/system-config/content/:key (어드민) — 콘텐츠 설정', async () => {
      const res = await ctx
        .authPatch('admin', '/api/system-config/content/e2e_test_key')
        .send({ message: 'test' });
      expect([200]).toContain(res.status);
    });

    it('GET /api/system-config/content/e2e_test_key — 조회', async () => {
      const res = await ctx.api().get('/api/system-config/content/e2e_test_key');
      expect([200]).toContain(res.status);
    });

    it('PATCH /api/system-config/permissions (일반) → 403', async () => {
      const res = await ctx
        .authPatch('normal', '/api/system-config/permissions')
        .send({ 'resume.create': 'user' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
