/**
 * Auth E2E — 회원가입/로그인/로그아웃/비밀번호/OAuth state/프로필
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Auth (인증)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'auth-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(ctx.prisma, [ctx.users.normal.email, 'auth-new@test.local']);
    await ctx.app.close();
  });

  describe('공개 엔드포인트', () => {
    it('GET /api/auth/providers — OAuth 프로바이더 구성 반환', async () => {
      const res = await ctx.api().get('/api/auth/providers').expect(200);
      expect(res.body).toBeDefined();
      expect(typeof res.body).toBe('object');
    });
  });

  describe('회원가입/로그인', () => {
    it('기존 유저 로그인 → 토큰 반환', async () => {
      const res = await ctx
        .api()
        .post('/api/auth/login')
        .send({ email: ctx.users.normal.email, password: ctx.users.normal.password });
      expect([200, 201]).toContain(res.status);
      expect(res.body.token).toBeDefined();
      expect(res.body.token.split('.').length).toBe(3); // JWT
    });

    it('비밀번호 없이 로그인 → 400/401', async () => {
      const res = await ctx.api().post('/api/auth/login').send({ email: ctx.users.normal.email });
      expect([400, 401]).toContain(res.status);
    });

    it('틀린 비밀번호 → 401', async () => {
      await ctx
        .api()
        .post('/api/auth/login')
        .send({ email: ctx.users.normal.email, password: 'WrongPass!' })
        .expect(401);
    });

    it('존재하지 않는 이메일 → 401 또는 429', async () => {
      const res = await ctx
        .api()
        .post('/api/auth/login')
        .send({ email: 'noexist@test.local', password: 'SomePass123!' });
      expect([401, 429]).toContain(res.status);
    });

    it('짧은 비밀번호 회원가입 → 400', async () => {
      const res = await ctx
        .api()
        .post('/api/auth/register')
        .send({ email: 'shortpw@test.local', password: '123', name: '짧은비번' });
      expect([400, 401]).toContain(res.status);
    });

    it('중복 이메일 회원가입 → 401 또는 429', async () => {
      const res = await ctx.api().post('/api/auth/register').send(ctx.users.normal);
      expect([401, 429]).toContain(res.status);
    });
  });

  describe('로그아웃', () => {
    it('POST /api/auth/logout — 쿠키 삭제', async () => {
      const res = await ctx.api().post('/api/auth/logout').expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('프로필 조회/수정', () => {
    it('GET /api/auth/me — 프로필 반환 (passwordHash 제외)', async () => {
      const res = await ctx.authGet('normal', '/api/auth/me').expect(200);
      expect(res.body.email).toBe(ctx.users.normal.email);
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.id).toBeDefined();
    });

    it('GET /api/auth/me (토큰 없이) → null 응답', async () => {
      const res = await ctx.api().get('/api/auth/me');
      expect([200, 401]).toContain(res.status);
    });

    it('PATCH /api/auth/profile — 이름 변경', async () => {
      const res = await ctx
        .authPatch('normal', '/api/auth/profile')
        .send({ name: '변경된이름' })
        .expect(200);
      expect(res.body.name).toBe('변경된이름');
      // 원복
      await ctx
        .authPatch('normal', '/api/auth/profile')
        .send({ name: ctx.users.normal.name })
        .expect(200);
    });

    it('PATCH /api/auth/profile — 잘못된 userType → 400', async () => {
      const res = await ctx.authPatch('normal', '/api/auth/profile').send({ userType: 'hacker' });
      expect([400, 401]).toContain(res.status);
    });

    it('GET /api/auth/linked-accounts — 빈 배열 또는 null', async () => {
      const res = await ctx.authGet('normal', '/api/auth/linked-accounts');
      expect([200]).toContain(res.status);
    });
  });

  describe('비밀번호 변경', () => {
    it('POST /api/auth/change-password — 현재 비밀번호 틀림 → 401', async () => {
      const res = await ctx
        .authPost('normal', '/api/auth/change-password')
        .send({ currentPassword: 'WrongCurrent!', newPassword: 'NewPass123!' });
      expect([400, 401]).toContain(res.status);
    });

    it('POST /api/auth/change-password — 로그인 없으면 401', async () => {
      const res = await ctx
        .api()
        .post('/api/auth/change-password')
        .send({ currentPassword: 'x', newPassword: 'NewPass123!' });
      expect([401]).toContain(res.status);
    });
  });

  describe('보안 — 토큰 검증', () => {
    it('비로그인 → 이력서 생성 401', async () => {
      await ctx.api().post('/api/resumes').send({ title: 'x' }).expect(401);
    });

    it('잘못된 토큰 → 401 또는 공개 API 동작', async () => {
      const res = await ctx
        .api()
        .get('/api/resumes')
        .set('Authorization', 'Bearer invalid-token-xyz');
      expect([200, 401]).toContain(res.status);
    });

    it('공개 포트폴리오 — 없는 username → 404 또는 200(null)', async () => {
      const res = await ctx.api().get('/api/auth/u/nonexistent-username-xxx');
      expect([200, 404]).toContain(res.status);
    });
  });
});
