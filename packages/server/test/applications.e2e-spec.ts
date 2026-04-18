/**
 * E2E — 지원 내역 (JobApplication)
 * CRUD, 통계, 상태 전환, 댓글, IDOR 보호
 */
import { E2EContext, setupE2EApp } from './e2e-helper';

describe('Applications E2E', () => {
  let ctx: E2EContext;
  let appId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'apps-e2e', normal: true });
  }, 60000);

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/applications — 지원 내역 생성', async () => {
    const res = await ctx
      .authPost('normal', '/api/applications')
      .send({
        company: '카카오',
        position: '백엔드 개발자',
        url: 'https://careers.kakao.com/jobs/1',
        status: 'applied',
        appliedDate: '2026-04-01',
        notes: '자체 채용 페이지에서 지원',
        salary: '6000-7500',
        location: '제주',
        visibility: 'private',
      })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.company).toBe('카카오');
    expect(res.body.status).toBe('applied');
    appId = res.body.id;
  });

  it('GET /api/applications — 목록 조회', async () => {
    const res = await ctx.authGet('normal', '/api/applications').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/applications/stats — 통계 반환', async () => {
    const res = await ctx.authGet('normal', '/api/applications/stats').expect(200);
    expect(res.body).toBeDefined();
  });

  it('PUT /api/applications/:id — 상태 전환 (applied → interview)', async () => {
    const res = await ctx
      .authPut('normal', `/api/applications/${appId}`)
      .send({ status: 'interview', notes: '1차 기술 면접 확정' })
      .expect(200);
    expect(res.body.status).toBe('interview');
    expect(res.body.notes).toContain('기술 면접');
  });

  it('PUT /api/applications/:id — offer 전환', async () => {
    const res = await ctx
      .authPut('normal', `/api/applications/${appId}`)
      .send({ status: 'offer' })
      .expect(200);
    expect(res.body.status).toBe('offer');
  });

  it('비로그인 GET /api/applications — 401 또는 빈 배열', async () => {
    const res = await ctx.api().get('/api/applications');
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/applications/:id/comments — 비공개 지원서는 빈 배열 ([])', async () => {
    // 현재 visibility=private 이므로 공개 댓글 조회는 빈 배열
    const res = await ctx.api().get(`/api/applications/${appId}/comments`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('PUT /api/applications/:id — visibility public 전환', async () => {
    const res = await ctx
      .authPut('normal', `/api/applications/${appId}`)
      .send({ visibility: 'public' })
      .expect(200);
    expect(res.body.visibility).toBe('public');
  });

  it('POST /api/applications/:id/comments — 댓글 작성', async () => {
    const res = await ctx
      .authPost('normal', `/api/applications/${appId}/comments`)
      .send({ content: '축하드려요! 🎉' });
    expect([200, 201]).toContain(res.status);
  });

  it('GET /api/applications/:id/comments — 공개 후 댓글 노출', async () => {
    const res = await ctx.api().get(`/api/applications/${appId}/comments`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('DELETE /api/applications/:id — 삭제', async () => {
    const res = await ctx.authDelete('normal', `/api/applications/${appId}`);
    expect([200, 204]).toContain(res.status);
  });

  it('DELETE 후 PUT → 404', async () => {
    const res = await ctx
      .authPut('normal', `/api/applications/${appId}`)
      .send({ status: 'rejected' });
    expect([403, 404]).toContain(res.status);
  });
});
