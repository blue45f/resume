import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../server/app.module';
import { PrismaService } from '../server/prisma/prisma.service';

const E2E_USER = { email: 'e2e-test@test.local', password: 'TestPass123!', name: 'E2E테스터' };

describe('Resume Platform E2E (상세)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let resumeId: string;
  let token: string;

  beforeAll(async () => {
    const mod: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    // Clean slate — remove stale test user + test tags so password/id match across runs
    await prisma.user.deleteMany({ where: { email: E2E_USER.email } }).catch(() => undefined);
    await prisma.tag
      .deleteMany({ where: { name: { in: ['태그A', '태그B', '태그C', '중복태그'] } } })
      .catch(() => undefined);

    const raw = () => request(app.getHttpServer());
    const regRes = await raw().post('/api/auth/register').send(E2E_USER);
    console.log('[E2E] Register:', regRes.status, JSON.stringify(regRes.body).slice(0, 1500));
    const res = await raw()
      .post('/api/auth/login')
      .send({ email: E2E_USER.email, password: E2E_USER.password });
    token = res.body?.token || regRes.body?.token || '';
    console.log('[E2E] Login:', res.status, 'token length:', token.length);
  });

  afterAll(async () => {
    await app.close();
  });

  // ========================
  // 1. 이력서 CRUD 기본
  // ========================
  describe('이력서 CRUD', () => {
    it('빈 이력서 생성', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' })
        .expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('');
      expect(res.body.personalInfo).toBeDefined();
      expect(res.body.experiences).toEqual([]);
      expect(res.body.certifications).toEqual([]);
      expect(res.body.languages).toEqual([]);
      expect(res.body.awards).toEqual([]);
      expect(res.body.activities).toEqual([]);
      // 정리
      await request(app.getHttpServer())
        .delete(`/api/resumes/${res.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('전체 필드 생성 + 상세 조회', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '상세 테스트',
          personalInfo: {
            name: '홍길동',
            email: 'a@b.com',
            phone: '010',
            address: '서울',
            website: 'https://x.com',
            summary: '요약',
          },
          experiences: [
            {
              company: 'B사',
              position: '주니어',
              startDate: '2020-03-01',
              endDate: '2022-06-30',
              current: false,
              description: '개발',
            },
            {
              company: 'A사',
              position: '시니어',
              startDate: '2022-07-01',
              current: true,
              description: '리드',
            },
          ],
          educations: [
            {
              school: '대학',
              degree: '학사',
              field: 'CS',
              startDate: '2016-03-02',
              endDate: '2020-02-28',
              description: '4.0',
            },
          ],
          skills: [
            { category: 'FE', items: 'React' },
            { category: 'BE', items: 'NestJS' },
          ],
          projects: [
            {
              name: 'PJ',
              role: 'PM',
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              description: '설명',
              link: 'https://g.com',
            },
          ],
          certifications: [
            {
              name: '정처기',
              issuer: '공단',
              issueDate: '2021-06-15',
              expiryDate: '',
              credentialId: 'C-001',
              description: '',
            },
            {
              name: 'AWS',
              issuer: 'Amazon',
              issueDate: '2023-09-01',
              expiryDate: '2026-09-01',
              credentialId: 'AWS-123',
              description: '클라우드',
            },
          ],
          languages: [
            { name: '영어', testName: 'TOEIC', score: '950', testDate: '2023-11-20' },
            { name: '일본어', testName: 'JLPT', score: 'N1', testDate: '2024-07-01' },
          ],
          awards: [{ name: '대상', issuer: '회사', awardDate: '2024-12-01', description: 'MVP' }],
          activities: [
            {
              name: 'OSS',
              organization: 'GH',
              role: 'Contributor',
              startDate: '2023-01-01',
              endDate: '2024-06-30',
              description: '기여',
            },
          ],
        })
        .expect(201);

      resumeId = res.body.id;

      // 상세 조회
      const detail = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(detail.body.personalInfo.name).toBe('홍길동');
      expect(detail.body.personalInfo.website).toBe('https://x.com');
      expect(detail.body.experiences).toHaveLength(2);
      expect(detail.body.educations).toHaveLength(1);
      expect(detail.body.skills).toHaveLength(2);
      expect(detail.body.projects).toHaveLength(1);
      expect(detail.body.certifications).toHaveLength(2);
      expect(detail.body.certifications[0].credentialId).toBe('C-001');
      expect(detail.body.certifications[1].expiryDate).toBe('2026-09-01');
      expect(detail.body.languages).toHaveLength(2);
      expect(detail.body.awards).toHaveLength(1);
      expect(detail.body.activities).toHaveLength(1);
      expect(detail.body.activities[0].role).toBe('Contributor');
    });

    it('부분 수정 (일부 필드만)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: '부분수정',
          awards: [{ name: '금상', issuer: '대회', awardDate: '2025-05-01', description: '' }],
        })
        .expect(200);

      expect(res.body.title).toBe('부분수정');
      expect(res.body.awards).toHaveLength(1);
      expect(res.body.awards[0].name).toBe('금상');
      // 수정하지 않은 필드는 유지
      expect(res.body.experiences).toHaveLength(2);
      expect(res.body.certifications).toHaveLength(2);
    });

    it('컬렉션 비우기 (빈 배열 전송)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          awards: [],
          activities: [],
        })
        .expect(200);

      expect(res.body.awards).toEqual([]);
      expect(res.body.activities).toEqual([]);
      // 다른 건 유지
      expect(res.body.certifications).toHaveLength(2);
    });

    it('복제 시 전체 데이터 복사', async () => {
      const dup = await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/duplicate`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      expect(dup.body.title).toContain('복사본');
      expect(dup.body.experiences).toHaveLength(2);
      expect(dup.body.certifications).toHaveLength(2);
      expect(dup.body.languages).toHaveLength(2);
      expect(dup.body.personalInfo.email).toBe('a@b.com');
      // 정리
      await request(app.getHttpServer())
        .delete(`/api/resumes/${dup.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('목록 조회 정렬 (updatedAt DESC)', async () => {
      const r2 = await request(app.getHttpServer())
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '새것' })
        .expect(201);
      const list = await request(app.getHttpServer())
        .get('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      // paginated 응답: { data, total, page, totalPages }
      expect(list.body.data[0].title).toBe('새것');
      await request(app.getHttpServer())
        .delete(`/api/resumes/${r2.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('404 처리', async () => {
      await request(app.getHttpServer())
        .get('/api/resumes/no-such-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      await request(app.getHttpServer())
        .put('/api/resumes/no-such-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'x' })
        .expect(404);
      await request(app.getHttpServer())
        .delete('/api/resumes/no-such-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      await request(app.getHttpServer())
        .post('/api/resumes/no-such-id/duplicate')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ========================
  // 2. 정렬 순서 (sortOrder)
  // ========================
  describe('정렬 순서', () => {
    it('경력 sortOrder 유지', async () => {
      await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          experiences: [
            { company: '3번째', position: 'C', startDate: '2024-01-01', sortOrder: 2 },
            { company: '1번째', position: 'A', startDate: '2020-01-01', sortOrder: 0 },
            { company: '2번째', position: 'B', startDate: '2022-01-01', sortOrder: 1 },
          ],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.experiences[0].company).toBe('1번째');
      expect(res.body.experiences[1].company).toBe('2번째');
      expect(res.body.experiences[2].company).toBe('3번째');
    });

    it('기술 sortOrder 유지', async () => {
      await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          skills: [
            { category: 'C', items: '3', sortOrder: 2 },
            { category: 'A', items: '1', sortOrder: 0 },
            { category: 'B', items: '2', sortOrder: 1 },
          ],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.skills[0].category).toBe('A');
      expect(res.body.skills[1].category).toBe('B');
      expect(res.body.skills[2].category).toBe('C');
    });

    it('sortOrder 미지정 시 인덱스 순서', async () => {
      await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          certifications: [
            { name: '첫번째', issuer: 'X' },
            { name: '두번째', issuer: 'Y' },
            { name: '세번째', issuer: 'Z' },
          ],
        });

      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.certifications[0].name).toBe('첫번째');
      expect(res.body.certifications[1].name).toBe('두번째');
      expect(res.body.certifications[2].name).toBe('세번째');
    });
  });

  // ========================
  // 3. 버전 관리 상세
  // ========================
  describe('버전 관리 상세', () => {
    it('수정할 때마다 버전 자동 생성', async () => {
      // 현재 버전 수
      const before = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token}`);
      const countBefore = before.body.length;

      // 수정
      await request(app.getHttpServer())
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '버전테스트1' });

      const after = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token}`);
      expect(after.body.length).toBe(countBefore + 1);
    });

    it('복원 후 데이터 정확성', async () => {
      // 현재 제목 확인
      const current = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(current.body.title).toBe('버전테스트1');

      // 첫 번째 버전 (원본)으로 복원
      const versions = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token}`);
      const oldest = versions.body[versions.body.length - 1];

      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/versions/${oldest.id}/restore`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const restored = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(restored.body.title).toBe('상세 테스트');
    });

    it('없는 버전 복원 → 404', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/versions/fake-id/restore`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ========================
  // 4. 태그 상세
  // ========================
  describe('태그 상세', () => {
    let tagA: string, tagB: string;

    it('태그 생성 + resumeCount', async () => {
      const a = await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '태그A', color: '#ff0000' })
        .expect(201);
      const b = await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '태그B', color: '#00ff00' })
        .expect(201);
      tagA = a.body.id;
      tagB = b.body.id;

      const list = await request(app.getHttpServer())
        .get('/api/tags')
        .set('Authorization', `Bearer ${token}`);
      const foundA = list.body.find((t: any) => t.id === tagA);
      expect(foundA.resumeCount).toBe(0);
    });

    it('이력서에 여러 태그 추가', async () => {
      await request(app.getHttpServer())
        .post(`/api/tags/${tagA}/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/tags/${tagB}/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      const resume = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(resume.body.tags).toHaveLength(2);
    });

    it('태그 목록에서 resumeCount 반영', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/tags')
        .set('Authorization', `Bearer ${token}`);
      const foundA = list.body.find((t: any) => t.id === tagA);
      expect(foundA.resumeCount).toBe(1);
    });

    it('중복 태그 생성 거부 (409)', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '태그A' })
        .expect(409);
    });

    it('빈 이름 거부 (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
      await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' })
        .expect(400);
    });

    it('태그 제거 + 삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/api/tags/${tagA}/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/tags/${tagB}/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/tags/${tagA}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/tags/${tagB}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ========================
  // 5. 템플릿 관리 상세
  // ========================
  describe('템플릿 관리 상세', () => {
    let tplId: string;

    it('layout 포함 생성', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '상세 템플릿',
          description: '테스트',
          category: 'developer',
          prompt: '프롬프트 텍스트',
          layout: JSON.stringify({
            sections: ['personalInfo', 'skills', 'certifications', 'experiences'],
            dateFormat: 'text-day',
            style: 'modern',
          }),
        })
        .expect(201);

      tplId = res.body.id;
      expect(res.body.name).toBe('상세 템플릿');
      const layout = JSON.parse(res.body.layout);
      expect(layout.sections).toEqual(['personalInfo', 'skills', 'certifications', 'experiences']);
      expect(layout.dateFormat).toBe('text-day');
    });

    it('layout 수정', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/templates/${tplId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          layout: JSON.stringify({
            sections: ['personalInfo', 'summary'],
            dateFormat: 'dash-day',
          }),
        })
        .expect(200);

      const layout = JSON.parse(res.body.layout);
      expect(layout.sections).toEqual(['personalInfo', 'summary']);
      expect(layout.dateFormat).toBe('dash-day');
      // 이름은 유지
      expect(res.body.name).toBe('상세 템플릿');
    });

    it('이름만 수정 (다른 필드 유지)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/templates/${tplId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '이름만 변경',
        })
        .expect(200);
      expect(res.body.name).toBe('이름만 변경');
      expect(res.body.category).toBe('developer');
    });

    it('없는 템플릿 수정 → 404', async () => {
      await request(app.getHttpServer())
        .put('/api/templates/fake')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'x' })
        .expect(404);
    });

    it('없는 템플릿 삭제 → 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/templates/fake')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/api/templates/${tplId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/templates/${tplId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ========================
  // 6. 로컬 변환 상세
  // ========================
  describe('로컬 변환 상세', () => {
    it('프리셋 목록 구조', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/templates/presets/list')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.length).toBe(5);
      const ids = res.body.map((p: any) => p.id);
      expect(ids).toContain('standard');
      expect(ids).toContain('developer');
      expect(ids).toContain('career-focused');
      expect(ids).toContain('academic');
      expect(ids).toContain('minimal');
    });

    it('standard 변환 - 전체 섹션 포함', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/templates/local-transform/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ preset: 'standard' })
        .expect(201);
      expect(res.body.text).toContain('홍길동');
      expect(res.body.text).toContain('자격증');
      expect(res.body.text).toContain('어학');
    });

    it('minimal 변환 - 제한된 섹션만', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/templates/local-transform/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ preset: 'minimal' })
        .expect(201);
      expect(res.body.text).toContain('홍길동');
      // minimal은 certifications/languages 미포함
      expect(res.body.text).not.toContain('자격증');
    });

    it('커스텀 템플릿 변환 - 선택 섹션만', async () => {
      const tpl = await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '커스텀변환',
          layout: JSON.stringify({ sections: ['personalInfo', 'languages'], dateFormat: 'text' }),
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/templates/local-transform/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ templateId: tpl.body.id })
        .expect(201);

      expect(res.body.method).toBe('template');
      expect(res.body.text).toContain('홍길동');
      expect(res.body.text).toContain('어학');
      expect(res.body.text).not.toContain('경력');

      await request(app.getHttpServer())
        .delete(`/api/templates/${tpl.body.id}`)
        .set('Authorization', `Bearer ${token}`);
    });

    it('없는 이력서 → 404', async () => {
      await request(app.getHttpServer())
        .post('/api/templates/local-transform/fake-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ preset: 'standard' })
        .expect(404);
    });
  });

  // ========================
  // 7. 공유 링크 상세
  // ========================
  describe('공유 링크 상세', () => {
    let token1: string, token2: string, linkId1: string;

    it('만료 시간 설정 공유 생성', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ expiresInHours: 48 })
        .expect(201);
      token1 = res.body.token;
      linkId1 = res.body.id;
      expect(token1.length).toBe(64);
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.hasPassword).toBe(false);
    });

    it('비밀번호 보호 공유 생성', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'secret' })
        .expect(201);
      token2 = res.body.token;
      expect(res.body.hasPassword).toBe(true);
    });

    it('공유 목록 조회 (isExpired 포함)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/share`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body[0]).toHaveProperty('isExpired');
    });

    it('토큰으로 접근', async () => {
      await request(app.getHttpServer())
        .get(`/api/shared/${token1}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('비밀번호 없이 → 403', async () => {
      await request(app.getHttpServer())
        .get(`/api/shared/${token2}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('틀린 비밀번호 → 403', async () => {
      await request(app.getHttpServer())
        .get(`/api/shared/${token2}?password=wrong`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('맞는 비밀번호 → 200', async () => {
      await request(app.getHttpServer())
        .get(`/api/shared/${token2}?password=secret`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('없는 토큰 → 403 (정보 노출 방지)', async () => {
      await request(app.getHttpServer())
        .get('/api/shared/nonexistent-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('공유 링크 삭제', async () => {
      await request(app.getHttpServer())
        .delete(`/api/share/${linkId1}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      // 없는 링크 삭제 → 404
      await request(app.getHttpServer())
        .delete('/api/share/fake')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ========================
  // 8. LLM Transform
  // ========================
  describe('LLM Transform', () => {
    it('프로바이더 목록 (배열)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/transform/providers`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('사용량 통계', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/transform/usage`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(typeof res.body.totalTransformations).toBe('number');
      expect(typeof res.body.totalTokensUsed).toBe('number');
    });

    it('변환 이력 (빈 배열)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/transform/history`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('잘못된 templateType → 400', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/transform`)
        .set('Authorization', `Bearer ${token}`)
        .send({ templateType: 'xxx' })
        .expect(400);
    });

    it('프로바이더 없음 → 400', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/transform`)
        .set('Authorization', `Bearer ${token}`)
        .send({ templateType: 'standard' })
        .expect(400);
    });
  });

  // ========================
  // 9. 첨부파일 상세
  // ========================
  describe('첨부파일 상세', () => {
    let attId: string;

    it('업로드 (분류 + 설명)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .field('category', 'portfolio')
        .field('description', '포트폴리오 PDF')
        .attach('file', Buffer.from('pdf-content'), {
          filename: 'portfolio.pdf',
          contentType: 'application/pdf',
        })
        .expect(201);

      attId = res.body.id;
      expect(res.body.originalName).toBe('portfolio.pdf');
      expect(res.body.mimeType).toBe('application/pdf');
      expect(res.body.category).toBe('portfolio');
      expect(res.body.description).toBe('포트폴리오 PDF');
      expect(res.body.size).toBe(11);
    });

    it('여러 파일 순차 업로드', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .field('category', 'certificate')
        .attach('file', Buffer.from('cert'), { filename: 'cert.txt', contentType: 'text/plain' })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(list.body.length).toBeGreaterThanOrEqual(2);
    });

    it('다운로드 내용 확인', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/attachments/${attId}/download`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.toString()).toBe('pdf-content');
    });

    it('파일 없이 업로드 → 400', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/attachments`)
        .set('Authorization', `Bearer ${token}`)
        .field('category', 'document')
        .expect(400);
    });

    it('없는 이력서에 업로드 → 404', async () => {
      await request(app.getHttpServer())
        .post('/api/resumes/fake/attachments')
        .set('Authorization', `Bearer ${token}`)
        .field('category', 'document')
        .attach('file', Buffer.from('x'), { filename: 'x.txt', contentType: 'text/plain' })
        .expect(404);
    });

    it('삭제 + 삭제 후 다운로드 404', async () => {
      await request(app.getHttpServer())
        .delete(`/api/attachments/${attId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/attachments/${attId}/download`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('없는 파일 삭제 → 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/attachments/fake')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  // ========================
  // 10. 입력 검증
  // ========================
  describe('입력 검증', () => {
    it('빈 태그 이름 → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/tags')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    });

    it('이름 없는 템플릿 → 400', async () => {
      await request(app.getHttpServer())
        .post('/api/templates')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'no name' })
        .expect(400);
    });

    it('잘못된 LLM templateType → 400', async () => {
      await request(app.getHttpServer())
        .post(`/api/resumes/${resumeId}/transform`)
        .set('Authorization', `Bearer ${token}`)
        .send({ templateType: 'no-such' })
        .expect(400);
    });
  });

  // ========================
  // 11. Cleanup
  // ========================
  describe('Cleanup', () => {
    it('이력서 삭제 (cascade)', async () => {
      // 삭제 전 버전/첨부파일 등 존재 확인
      const versions = await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token}`);
      expect(versions.body.length).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .delete(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // cascade 삭제 확인
      await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      await request(app.getHttpServer())
        .get(`/api/resumes/${resumeId}/versions`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });
});
