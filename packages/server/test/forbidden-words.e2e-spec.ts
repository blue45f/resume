/**
 * ForbiddenWords E2E — 금칙어 관리
 * - 관리자 CRUD
 * - 공개 /check 엔드포인트
 * - 일반 유저는 조회/쓰기 모두 차단
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('ForbiddenWords (금칙어)', () => {
  let ctx: E2EContext;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'fw-e2e', admin: true, normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.prisma.forbiddenWord
      .deleteMany({ where: { word: { startsWith: 'e2e-' } } })
      .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('비관리자 — 빈 응답 반환', () => {
    it('GET /forbidden-words — { items: [], total: 0 }', async () => {
      const res = await ctx.authGet('normal', '/api/forbidden-words').expect(200);
      expect(res.body).toEqual({ items: [], total: 0 });
    });

    it('GET /forbidden-words/stats — 빈 객체', async () => {
      const res = await ctx.authGet('normal', '/api/forbidden-words/stats').expect(200);
      expect(res.body).toEqual({});
    });

    it('GET /forbidden-words/categories — 빈 배열', async () => {
      const res = await ctx.authGet('normal', '/api/forbidden-words/categories').expect(200);
      expect(res.body).toEqual([]);
    });

    it('POST /forbidden-words — error 객체', async () => {
      const res = await ctx
        .authPost('normal', '/api/forbidden-words')
        .send({ word: '테스트' })
        .expect(201);
      expect(res.body).toEqual({ error: '권한이 없습니다' });
    });
  });

  describe('공개 /check 엔드포인트', () => {
    it('권한 없이도 콘텐츠 검사 가능', async () => {
      const res = await ctx.api().post('/api/forbidden-words/check').send({ text: '안녕' });
      expect([200, 201]).toContain(res.status);
      // checkContent 결과는 보통 { hasForbidden: boolean, matched: [] } 형태
      expect(typeof res.body).toBe('object');
    });
  });

  describe('관리자 CRUD', () => {
    it('POST /forbidden-words — 관리자 등록', async () => {
      const res = await ctx.authPost('admin', '/api/forbidden-words').send({
        word: 'e2e-bad-word',
        category: 'sexual',
        severity: 'block',
      });
      expect([200, 201]).toContain(res.status);
      expect(res.body.id).toBeDefined();
      expect(res.body.word).toBe('e2e-bad-word');
      expect(res.body.category).toBe('sexual');
      createdIds.push(res.body.id);
    });

    it('POST /forbidden-words/bulk — { created, skipped } 리턴 + 중복 skip', async () => {
      const res = await ctx.authPost('admin', '/api/forbidden-words/bulk').send({
        words: ['e2e-bulk-1', 'e2e-bulk-2', 'e2e-bulk-3'],
        category: 'general',
        severity: 'mask',
      });
      expect([200, 201]).toContain(res.status);
      expect(res.body.created).toBeGreaterThanOrEqual(1);
      expect(typeof res.body.skipped).toBe('number');

      // 중복 재등록 — 전부 skip 되어야 함
      const dup = await ctx.authPost('admin', '/api/forbidden-words/bulk').send({
        words: ['e2e-bulk-1', 'e2e-bulk-2'],
        category: 'general',
        severity: 'mask',
      });
      expect(dup.body.created).toBe(0);
      expect(dup.body.skipped).toBe(2);

      // bulk 로 만든 IDs 를 DB 에서 가져와 createdIds 에 누적
      const rows = await ctx.prisma.forbiddenWord.findMany({
        where: { word: { startsWith: 'e2e-bulk-' } },
        select: { id: true },
      });
      for (const row of rows) createdIds.push(row.id);
    });

    it('GET /forbidden-words?search=e2e-bad — 검색', async () => {
      const res = await ctx.authGet('admin', '/api/forbidden-words?search=e2e-bad').expect(200);
      expect(res.body.items.some((w: any) => w.word === 'e2e-bad-word')).toBe(true);
    });

    it('GET /forbidden-words/stats — 통계 조회', async () => {
      const res = await ctx.authGet('admin', '/api/forbidden-words/stats').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('PATCH /:id — 개별 수정', async () => {
      if (createdIds.length === 0) return;
      const id = createdIds[0];
      const res = await ctx
        .authPatch('admin', `/api/forbidden-words/${id}`)
        .send({ isActive: false });
      expect([200, 201]).toContain(res.status);
      expect(res.body.isActive).toBe(false);
    });

    it('DELETE /bulk — 일괄 삭제', async () => {
      const bulkIds = createdIds.slice(1, 3);
      if (bulkIds.length === 0) return;
      const res = await ctx.authDelete('admin', '/api/forbidden-words/bulk').send({ ids: bulkIds });
      expect([200, 201]).toContain(res.status);
      // 삭제된 것은 목록에서 제거
      for (const id of bulkIds) {
        const idx = createdIds.indexOf(id);
        if (idx >= 0) createdIds.splice(idx, 1);
      }
    });

    it('DELETE /:id — 개별 삭제', async () => {
      if (createdIds.length === 0) return;
      const id = createdIds[0];
      const res = await ctx.authDelete('admin', `/api/forbidden-words/${id}`);
      expect([200, 201, 204]).toContain(res.status);
    });
  });
});
