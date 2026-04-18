/**
 * SystemConfig E2E — 전역 설정 + 권한 관리
 * - 공개 엔드포인트 (public, permissions)
 * - 관리자 전용 set / 권한 관리
 * - content 키 JSON 직렬화
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('SystemConfig (전역 설정)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'sysconf-e2e', admin: true, normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.prisma.systemConfig
      .deleteMany({ where: { key: { startsWith: 'content_e2e-' } } })
      .catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  it('GET /system-config/public — 공개 설정 (비로그인)', async () => {
    const res = await ctx.api().get('/api/system-config/public').expect(200);
    expect(typeof res.body).toBe('object');
  });

  it('GET /system-config/permissions — 공개 권한 맵 조회', async () => {
    const res = await ctx.api().get('/api/system-config/permissions').expect(200);
    // 기본 권한 키 존재
    expect(res.body['perm.community.create']).toBeDefined();
    expect(res.body['perm.notices.create']).toBeDefined();
  });

  describe('관리자 content 설정', () => {
    it('일반 유저 PATCH 차단', async () => {
      const res = await ctx
        .authPatch('normal', '/api/system-config/content/e2e-home')
        .send({ hero: '환영합니다' });
      expect([401, 403]).toContain(res.status);
    });

    it('admin 이 JSON 객체 저장', async () => {
      const res = await ctx
        .authPatch('admin', '/api/system-config/content/e2e-home')
        .send({ hero: '환영합니다', count: 42 });
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('GET /content/:key — 저장된 JSON 을 객체로 파싱해 반환', async () => {
      const res = await ctx.api().get('/api/system-config/content/e2e-home').expect(200);
      expect(res.body).toEqual({ hero: '환영합니다', count: 42 });
    });

    it('GET /content/:key — 없는 키는 빈 응답', async () => {
      const res = await ctx.api().get('/api/system-config/content/e2e-nonexistent');
      expect(res.status).toBe(200);
      // express 는 null 을 빈 body 로 직렬화 → supertest body 는 {} 또는 null
      const empty = res.body === null || JSON.stringify(res.body) === '{}';
      expect(empty).toBe(true);
    });
  });

  describe('관리자 전역 설정', () => {
    it('GET /system-config — 일반 유저 차단', async () => {
      const res = await ctx.authGet('normal', '/api/system-config');
      expect([401, 403]).toContain(res.status);
    });

    it('GET /system-config — admin 전체 조회', async () => {
      const res = await ctx.authGet('admin', '/api/system-config').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('권한 설정', () => {
    it('admin 이 perm.community.create 를 admin 전용으로 변경 후 복구', async () => {
      const backup = (await ctx.api().get('/api/system-config/permissions')).body[
        'perm.community.create'
      ];

      const change = await ctx
        .authPatch('admin', '/api/system-config/permissions')
        .send({ 'perm.community.create': 'admin' });
      expect([200, 201]).toContain(change.status);
      expect(change.body['perm.community.create']).toBe('admin');

      // 화이트리스트 외 키는 저장 안 됨
      const injection = await ctx
        .authPatch('admin', '/api/system-config/permissions')
        .send({ 'evil.injection': 'admin' });
      expect([200, 201]).toContain(injection.status);
      expect(injection.body['evil.injection']).toBeUndefined();

      // 복구
      if (backup) {
        await ctx
          .authPatch('admin', '/api/system-config/permissions')
          .send({ 'perm.community.create': backup });
      }
    });

    it('일반 유저 PATCH /permissions 차단', async () => {
      const res = await ctx
        .authPatch('normal', '/api/system-config/permissions')
        .send({ 'perm.community.create': 'admin' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
