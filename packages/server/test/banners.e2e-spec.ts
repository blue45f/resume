/**
 * Banners E2E — 홈 배너
 * - 공개 active 목록
 * - 관리자 CRUD + reorder
 * - role 기반 getAll 분기
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Banners (홈 배너)', () => {
  let ctx: E2EContext;
  const createdIds: string[] = [];

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'banner-e2e', admin: true, normal: true });
  }, 60000);

  afterAll(async () => {
    if (createdIds.length > 0) {
      await ctx.prisma.banner
        .deleteMany({ where: { id: { in: createdIds } } })
        .catch(() => undefined);
    }
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /banners/active — 공개 활성 배너', async () => {
    const res = await ctx.api().get('/api/banners/active').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /banners — 일반 유저 401/403 (AdminGuard)', async () => {
    const res = await ctx.authPost('normal', '/api/banners').send({ title: 'E2E banner' });
    expect([401, 403]).toContain(res.status);
  });

  it('POST /banners — 관리자 생성', async () => {
    const first = await ctx.authPost('admin', '/api/banners').send({
      title: '[E2E] 첫 배너',
      imageUrl: 'https://x.com/1.png',
      linkUrl: 'https://x.com',
      order: 100,
      isActive: false,
    });
    expect([200, 201]).toContain(first.status);
    expect(first.body.id).toBeDefined();
    createdIds.push(first.body.id);

    const second = await ctx.authPost('admin', '/api/banners').send({
      title: '[E2E] 둘째 배너',
      imageUrl: 'https://x.com/2.png',
      linkUrl: 'https://x.com',
      order: 101,
      isActive: false,
    });
    expect([200, 201]).toContain(second.status);
    createdIds.push(second.body.id);
  });

  it('GET /banners — admin 은 전체, 일반 유저는 active fallback', async () => {
    const asAdmin = await ctx.authGet('admin', '/api/banners').expect(200);
    const asUser = await ctx.authGet('normal', '/api/banners').expect(200);
    // admin 에겐 방금 만든 inactive 배너 포함
    expect(asAdmin.body.length).toBeGreaterThanOrEqual(asUser.body.length);
    // 일반 유저에겐 isActive=false 배너 숨김
    expect(asUser.body.every((b: any) => b.isActive !== false)).toBe(true);
  });

  it('PATCH /banners/reorder — 관리자 순서 변경', async () => {
    if (createdIds.length < 2) return;
    const reversed = [...createdIds].reverse();
    const res = await ctx.authPatch('admin', '/api/banners/reorder').send({ ids: reversed });
    expect([200, 201]).toContain(res.status);

    // 순서가 0, 1 로 반영
    const all = await ctx.authGet('admin', '/api/banners').expect(200);
    const updated = all.body.filter((b: any) => createdIds.includes(b.id));
    const byId = Object.fromEntries(updated.map((b: any) => [b.id, b.order]));
    expect(byId[reversed[0]]).toBe(0);
    expect(byId[reversed[1]]).toBe(1);
  });

  it('PATCH /banners/:id — 개별 수정', async () => {
    if (createdIds.length === 0) return;
    const id = createdIds[0];
    const res = await ctx
      .authPatch('admin', `/api/banners/${id}`)
      .send({ title: '[E2E] 수정됨', isActive: true });
    expect([200, 201]).toContain(res.status);
    expect(res.body.title).toBe('[E2E] 수정됨');
    expect(res.body.isActive).toBe(true);
  });

  it('DELETE /banners/:id — 관리자 삭제', async () => {
    if (createdIds.length === 0) return;
    const id = createdIds.pop()!;
    const res = await ctx.authDelete('admin', `/api/banners/${id}`);
    expect([200, 201, 204]).toContain(res.status);
  });

  it('DELETE /banners/:id — 일반 유저는 차단', async () => {
    if (createdIds.length === 0) return;
    const id = createdIds[0];
    const res = await ctx.authDelete('normal', `/api/banners/${id}`);
    expect([401, 403]).toContain(res.status);
  });
});
