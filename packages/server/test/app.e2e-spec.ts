/**
 * App E2E — 최소 스모크 테스트
 * (기존 monolithic test는 scenario별 파일로 분리됨)
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('App (스모크)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'smoke-e2e', normal: false });
  }, 60000);

  afterAll(async () => {
    await cleanupTestData(ctx.prisma, []);
    await ctx.app.close();
  });

  it('GET /api/health — 200', async () => {
    const res = await ctx.api().get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
  });

  it('GET /api/health/stats — 공개 통계', async () => {
    const res = await ctx.api().get('/api/health/stats').expect(200);
    expect(res.body.users).toBeDefined();
    expect(res.body.resumes).toBeDefined();
  });

  it('GET /api/health/news-rss — 뉴스 피드', async () => {
    const res = await ctx.api().get('/api/health/news-rss').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/auth/providers — OAuth 프로바이더', async () => {
    const res = await ctx.api().get('/api/auth/providers').expect(200);
    expect(res.body).toBeDefined();
  });

  it('GET /api/tags — 공개 태그 목록', async () => {
    const res = await ctx.api().get('/api/tags').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/templates — 공개 템플릿 목록', async () => {
    const res = await ctx.api().get('/api/templates').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/jobs — 공개 채용공고', async () => {
    const res = await ctx.api().get('/api/jobs').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/banners/active — 활성 배너', async () => {
    const res = await ctx.api().get('/api/banners/active').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/system-config/public — 공개 설정', async () => {
    const res = await ctx.api().get('/api/system-config/public').expect(200);
    expect(typeof res.body).toBe('object');
  });

  it('GET /api/notices — 공지 목록', async () => {
    const res = await ctx.api().get('/api/notices?limit=5').expect(200);
    expect(res.body.items || Array.isArray(res.body)).toBeTruthy();
  });

  it('GET /api/resumes/popular-skills — 인기 기술', async () => {
    const res = await ctx.api().get('/api/resumes/popular-skills').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/community — 커뮤니티 공개 목록', async () => {
    const res = await ctx.api().get('/api/community?limit=5').expect(200);
    expect(res.body.items).toBeDefined();
  });
});
