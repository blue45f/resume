/// <reference types="jest" />
/// <reference types="node" />
/**
 * Share Extended E2E — 만료 / 조회 / 비밀번호 + 만료된 링크 후 차단
 * (viewCount 자동 카운팅은 미구현 — 추적 시 보강)
 */
import { setupE2EApp, cleanupTestData, createTestResume, E2EContext } from './e2e-helper';

describe('Share Extended', () => {
  let ctx: E2EContext;
  let resumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      prefix: 'shext-e2e',
      normal: true,
      recruiter: true,
    });
    const r = await createTestResume(ctx, 'normal', { title: '공유 만료 테스트' });
    resumeId = r.id;
  }, 60000);

  afterAll(async () => {
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('만료 처리', () => {
    let token: string;
    let linkId: string;

    it('1시간 만료 링크 생성', async () => {
      const res = await ctx
        .authPost('normal', `/api/resumes/${resumeId}/share`)
        .send({ expiresInHours: 1 })
        .expect(201);
      token = res.body.token;
      linkId = res.body.id;
      expect(token.length).toBe(64);
      expect(res.body.expiresAt).toBeDefined();
    });

    it('생성 직후 조회 → 200', async () => {
      await ctx.api().get(`/api/shared/${token}`).expect(200);
    });

    it('expiresAt 을 과거로 강제 변경 → 403', async () => {
      await ctx.prisma.shareLink.update({
        where: { id: linkId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      const res = await ctx.api().get(`/api/shared/${token}`);
      expect([403]).toContain(res.status);
    });

    it('만료된 링크는 목록에서 isExpired=true 로 표시', async () => {
      const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/share`).expect(200);
      const found = res.body.find((l: any) => l.id === linkId);
      expect(found?.isExpired).toBe(true);
    });

    afterAll(async () => {
      await ctx.authDelete('normal', `/api/share/${linkId}`).catch(() => undefined);
    });
  });

  describe('여러 링크 조합', () => {
    const cleanupIds: string[] = [];

    afterAll(async () => {
      for (const id of cleanupIds) {
        await ctx.authDelete('normal', `/api/share/${id}`).catch(() => undefined);
      }
    });

    it('비번 + 만료 동시', async () => {
      const res = await ctx
        .authPost('normal', `/api/resumes/${resumeId}/share`)
        .send({ password: 'secret-pw', expiresInHours: 24 });
      expect([200, 201]).toContain(res.status);
      cleanupIds.push(res.body.id);
      expect(res.body.hasPassword).toBe(true);
      expect(res.body.expiresAt).toBeDefined();

      // 비번 없이 → 403
      await ctx.api().get(`/api/shared/${res.body.token}`).expect(403);
      // 비번 있으면 → 200
      await ctx.api().get(`/api/shared/${res.body.token}?password=secret-pw`).expect(200);
    });

    it('비번 없이 만료 없이 — 영구 공유 링크', async () => {
      const res = await ctx.authPost('normal', `/api/resumes/${resumeId}/share`).send({});
      expect([200, 201]).toContain(res.status);
      cleanupIds.push(res.body.id);
      expect(res.body.expiresAt).toBeNull();
      expect(res.body.hasPassword).toBe(false);
      await ctx.api().get(`/api/shared/${res.body.token}`).expect(200);
    });
  });

  describe('IDOR 보호', () => {
    let myLinkId: string;

    beforeAll(async () => {
      const res = await ctx.authPost('normal', `/api/resumes/${resumeId}/share`).send({});
      myLinkId = res.body.id;
    });

    afterAll(async () => {
      await ctx.authDelete('normal', `/api/share/${myLinkId}`).catch(() => undefined);
    });

    it('다른 유저(recruiter)가 이력서 공유 링크 목록 조회 → 403/404', async () => {
      const res = await ctx.authGet('recruiter', `/api/resumes/${resumeId}/share`);
      expect([403, 404]).toContain(res.status);
    });

    it('다른 유저가 공유 링크 생성 시도 → 403/404', async () => {
      const res = await ctx.authPost('recruiter', `/api/resumes/${resumeId}/share`).send({});
      expect([403, 404]).toContain(res.status);
    });

    it('다른 유저가 공유 링크 삭제 → 403/404', async () => {
      const res = await ctx.authDelete('recruiter', `/api/share/${myLinkId}`);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('잘못된 입력', () => {
    it('GET /shared/짧은-토큰 → 403 (정보 노출 방지)', async () => {
      await ctx.api().get('/api/shared/abc').expect(403);
    });

    it('GET /shared/너무긴-토큰 → 403', async () => {
      const longToken = 'a'.repeat(200);
      const res = await ctx.api().get(`/api/shared/${longToken}`);
      expect([403, 404]).toContain(res.status);
    });

    it('DELETE /share/없는-id → 404', async () => {
      await ctx.authDelete('normal', '/api/share/no-such-id').expect(404);
    });
  });
});
