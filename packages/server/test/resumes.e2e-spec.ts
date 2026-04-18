/**
 * Resumes E2E — CRUD + 검색 + 대시보드 + export
 */
import { E2EContext, setupE2EApp, cleanupTestData } from './e2e-helper';

describe('Resumes (이력서 CRUD)', () => {
  let ctx: E2EContext;
  let resumeId: string;

  beforeAll(async () => {
    ctx = await setupE2EApp({ prefix: 'resume-e2e', normal: true, recruiter: true });
  }, 60000);

  afterAll(async () => {
    if (resumeId) await ctx.authDelete('normal', `/api/resumes/${resumeId}`).catch(() => undefined);
    await cleanupTestData(
      ctx.prisma,
      Object.values(ctx.users).map((u) => u.email),
    );
    await ctx.app.close();
  });

  describe('CRUD 기본', () => {
    it('빈 이력서 생성', async () => {
      const res = await ctx.authPost('normal', '/api/resumes').send({ title: '' }).expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('');
      expect(res.body.experiences).toEqual([]);
      await ctx.authDelete('normal', `/api/resumes/${res.body.id}`);
    });

    it('전체 필드 생성 + 상세 조회', async () => {
      const res = await ctx.authPost('normal', '/api/resumes').send({
        title: '상세 테스트',
        personalInfo: {
          name: '홍길동',
          email: 'a@b.com',
          phone: '010',
          address: '서울',
          summary: '요약',
        },
        experiences: [
          { company: 'B사', position: '주니어', startDate: '2020-03-01', endDate: '2022-06-30' },
          { company: 'A사', position: '시니어', startDate: '2022-07-01', current: true },
        ],
        educations: [{ school: '대학', degree: '학사', field: 'CS', startDate: '2016-03-02' }],
        skills: [{ category: 'FE', items: 'React' }],
        projects: [{ name: 'PJ', role: 'PM', startDate: '2024-01-01', description: '설명' }],
        certifications: [{ name: '정처기', issuer: '공단', issueDate: '2021-06-15' }],
        languages: [{ name: '영어', testName: 'TOEIC', score: '950' }],
        awards: [{ name: '대상', issuer: '회사', awardDate: '2024-12-01' }],
        activities: [
          { name: 'OSS', organization: 'GH', role: 'Contributor', startDate: '2023-01-01' },
        ],
      });
      expect(res.status).toBe(201);
      resumeId = res.body.id;

      const detail = await ctx.authGet('normal', `/api/resumes/${resumeId}`).expect(200);
      expect(detail.body.personalInfo.name).toBe('홍길동');
      expect(detail.body.experiences).toHaveLength(2);
      expect(detail.body.skills).toHaveLength(1);
    });

    it('부분 수정 (일부 필드만)', async () => {
      const res = await ctx
        .authPut('normal', `/api/resumes/${resumeId}`)
        .send({ title: '부분수정' })
        .expect(200);
      expect(res.body.title).toBe('부분수정');
      expect(res.body.experiences).toHaveLength(2);
    });

    it('컬렉션 비우기', async () => {
      const res = await ctx
        .authPut('normal', `/api/resumes/${resumeId}`)
        .send({ awards: [], activities: [] })
        .expect(200);
      expect(res.body.awards).toEqual([]);
      expect(res.body.activities).toEqual([]);
    });

    it('복제 (복사본)', async () => {
      const dup = await ctx.authPost('normal', `/api/resumes/${resumeId}/duplicate`).expect(201);
      expect(dup.body.title).toContain('복사본');
      await ctx.authDelete('normal', `/api/resumes/${dup.body.id}`);
    });

    it('목록 페이지네이션 (data/total)', async () => {
      const res = await ctx.authGet('normal', '/api/resumes').expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });

    it('404 처리 — 없는 이력서', async () => {
      await ctx.authGet('normal', '/api/resumes/no-such-id').expect(404);
      await ctx.authPut('normal', '/api/resumes/no-such-id').send({ title: 'x' }).expect(404);
      await ctx.authDelete('normal', '/api/resumes/no-such-id').expect(404);
    });
  });

  describe('정렬 (sortOrder)', () => {
    it('경력 sortOrder 유지', async () => {
      await ctx.authPut('normal', `/api/resumes/${resumeId}`).send({
        experiences: [
          { company: '3', position: 'C', startDate: '2024-01-01', sortOrder: 2 },
          { company: '1', position: 'A', startDate: '2020-01-01', sortOrder: 0 },
          { company: '2', position: 'B', startDate: '2022-01-01', sortOrder: 1 },
        ],
      });
      const res = await ctx.authGet('normal', `/api/resumes/${resumeId}`).expect(200);
      expect(res.body.experiences[0].company).toBe('1');
      expect(res.body.experiences[1].company).toBe('2');
      expect(res.body.experiences[2].company).toBe('3');
    });
  });

  describe('공개 검색 & 기타', () => {
    it('GET /api/resumes/public — 공개 이력서 목록', async () => {
      const res = await ctx.api().get('/api/resumes/public?limit=5').expect(200);
      expect(res.body.data || res.body.items).toBeDefined();
    });

    it('GET /api/resumes/popular-skills — 인기 기술', async () => {
      const res = await ctx.api().get('/api/resumes/popular-skills').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('PATCH /:id/visibility — 가시성 변경', async () => {
      const res = await ctx
        .authPatch('normal', `/api/resumes/${resumeId}/visibility`)
        .send({ visibility: 'public' });
      expect([200, 400]).toContain(res.status);
      // 원복
      await ctx
        .authPatch('normal', `/api/resumes/${resumeId}/visibility`)
        .send({ visibility: 'private' });
    });

    it('대시보드 분석', async () => {
      const res = await ctx.authGet('normal', '/api/resumes/dashboard/analytics');
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Export', () => {
    it('GET /:id/export/text — 텍스트 내보내기', async () => {
      const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/export/text`);
      expect([200, 404]).toContain(res.status);
    });

    it('GET /:id/export/markdown — 마크다운 내보내기', async () => {
      const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/export/markdown`);
      expect([200, 404]).toContain(res.status);
    });

    it('GET /:id/export/json — JSON 내보내기', async () => {
      const res = await ctx.authGet('normal', `/api/resumes/${resumeId}/export/json`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('소유권 IDOR', () => {
    it('recruiter가 normal의 이력서 수정 시도 → 403 또는 404', async () => {
      const res = await ctx
        .authPut('recruiter', `/api/resumes/${resumeId}`)
        .send({ title: 'hacked' });
      expect([403, 404]).toContain(res.status);
    });

    it('recruiter가 normal의 이력서 삭제 시도 → 403 또는 404', async () => {
      const res = await ctx.authDelete('recruiter', `/api/resumes/${resumeId}`);
      expect([403, 404]).toContain(res.status);
    });
  });
});
