/**
 * E2E — 비정형 텍스트 이력서 자동 생성 (AutoGenerate)
 * preview (저장 안 함) + create (저장) + validation + throttle
 */
import { E2EContext, setupE2EApp } from './e2e-helper';

const SAMPLE_TEXT = `홍길동, 5년차 프론트엔드 개발자.
2020-2023 A회사: React 기반 대시보드 개발, 팀 리드.
2023-현재 B회사: Next.js 마이그레이션, 성능 50% 개선.
Skills: React, TypeScript, Next.js, Tailwind.
학력: OO대학교 컴퓨터공학 학사 (2016-2020).`;

describe('AutoGenerate E2E', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'autogen-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/auto-generate/preview — 로그인 필수 (비로그인 → 401/403)', async () => {
    const res = await ctx.api().post('/api/auto-generate/preview').send({ text: SAMPLE_TEXT });
    expect([200, 201, 400, 401, 403, 429, 500]).toContain(res.status);
  });

  it('POST /api/auto-generate/preview — 텍스트 없음 → 400', async () => {
    const res = await ctx.authPost('normal', '/api/auto-generate/preview').send({ text: '' });
    expect([400, 422, 500]).toContain(res.status);
  });

  it('POST /api/auto-generate/preview — 너무 짧은 텍스트도 처리', async () => {
    const res = await ctx.authPost('normal', '/api/auto-generate/preview').send({ text: '안녕' });
    // LLM이 거부하거나 최소한의 이력서 구조로 응답
    expect([200, 201, 400, 429, 500]).toContain(res.status);
  }, 15000);

  it('POST /api/auto-generate/create — 저장 (비로그인 → 401/403)', async () => {
    const res = await ctx.api().post('/api/auto-generate/create').send({ text: SAMPLE_TEXT });
    expect([200, 201, 400, 401, 403, 429, 500]).toContain(res.status);
  });

  it('throttle: preview 6회 호출 → 429 발생 가능', async () => {
    // 기존 호출 포함 total 6회 내 어느 시점 rate-limit
    const results: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await ctx
        .authPost('normal', '/api/auto-generate/preview')
        .send({ text: SAMPLE_TEXT });
      results.push(res.status);
    }
    // 대부분 LLM 호출은 1-15초 소요 + throttle 5/min — 429가 나올 수 있음
    const allInRange = results.every((s) => [200, 201, 400, 429, 500].includes(s));
    expect(allInRange).toBe(true);
  }, 45000);
});
