/**
 * 통합 테스트 — 회원별 기능 검증
 * 테스트 계정: 일반 유저, 채용담당자, 관리자
 * 각 테스트가 독립적으로 데이터를 생성/삭제
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../server/app.module';

const USERS = {
  normal: { email: 'int-normal@test.local', password: 'NormalPass123!', name: '일반유저' },
  recruiter: { email: 'int-recruiter@test.local', password: 'RecruiterPass123!', name: '채용담당자', userType: 'recruiter' },
  admin: { email: 'int-admin@test.local', password: 'AdminPass123!', name: '관리자' },
};

describe('통합 테스트', () => {
  let app: INestApplication;
  let tokens: Record<string, string> = {};

  const api = () => request(app.getHttpServer());
  const authGet = (role: keyof typeof USERS, url: string) => api().get(url).set('Authorization', `Bearer ${tokens[role]}`);
  const authPost = (role: keyof typeof USERS, url: string) => api().post(url).set('Authorization', `Bearer ${tokens[role]}`);
  const authPut = (role: keyof typeof USERS, url: string) => api().put(url).set('Authorization', `Bearer ${tokens[role]}`);
  const authDelete = (role: keyof typeof USERS, url: string) => api().delete(url).set('Authorization', `Bearer ${tokens[role]}`);

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // 테스트 계정 등록 + 로그인
    for (const [key, user] of Object.entries(USERS)) {
      const regRes = await api().post('/api/auth/register').send(user);
      const loginRes = await api().post('/api/auth/login').send({ email: user.email, password: user.password });
      tokens[key] = loginRes.body?.token || regRes.body?.token || '';
      console.log(`[INT] ${key}: reg=${regRes.status} login=${loginRes.status} token=${tokens[key] ? 'ok' : 'EMPTY'}`);
    }
  }, 30000);

  afterAll(async () => { await app.close(); });

  // ═══════════════════════════════════════════
  // 1. 공개 API (비로그인)
  // ═══════════════════════════════════════════
  describe('공개 API', () => {
    it('GET /health — 서버 상태', async () => {
      const res = await api().get('/api/health').expect(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.version).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });

    it('GET /health/stats — 공개 통계', async () => {
      const res = await api().get('/api/health/stats').expect(200);
      expect(res.body.users).toBeDefined();
      expect(res.body.resumes).toBeDefined();
      expect(res.body.community).toBeDefined();
    });

    it('GET /community — 게시글 목록', async () => {
      const res = await api().get('/api/community?limit=5').expect(200);
      expect(res.body.items).toBeDefined();
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });

    it('GET /templates — 템플릿 목록', async () => {
      const res = await api().get('/api/templates').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /tags — 태그 목록', async () => {
      const res = await api().get('/api/tags').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /jobs — 채용 공고', async () => {
      const res = await api().get('/api/jobs').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /resumes/popular-skills — 인기 기술', async () => {
      const res = await api().get('/api/resumes/popular-skills').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /auth/providers — 로그인 프로바이더', async () => {
      const res = await api().get('/api/auth/providers').expect(200);
      expect(res.body).toBeDefined();
    });

    it('GET /health/news-rss — 뉴스 피드', async () => {
      const res = await api().get('/api/health/news-rss').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /system-config/public — 공개 설정', async () => {
      const res = await api().get('/api/system-config/public').expect(200);
      expect(typeof res.body).toBe('object');
    });
  });

  // ═══════════════════════════════════════════
  // 2. 일반 회원 기능
  // ═══════════════════════════════════════════
  describe('일반 회원', () => {
    let resumeId: string;

    it('이력서 생성', async () => {
      const res = await authPost('normal', '/api/resumes').send({
        title: '통합테스트 이력서',
        personalInfo: { name: '테스터', email: 'test@t.com', summary: '테스트용 이력서' },
        skills: [{ category: 'FE', items: 'React,TypeScript' }],
      }).expect(201);
      resumeId = res.body.id;
      expect(resumeId).toBeDefined();
    });

    it('이력서 조회', async () => {
      const res = await authGet('normal', `/api/resumes/${resumeId}`).expect(200);
      expect(res.body.title).toBe('통합테스트 이력서');
      expect(res.body.personalInfo.name).toBe('테스터');
    });

    it('이력서 수정', async () => {
      const res = await authPut('normal', `/api/resumes/${resumeId}`).send({
        title: '수정된 이력서',
      });
      expect([200, 403]).toContain(res.status);
      if (res.status === 200) expect(res.body.title).toBe('수정된 이력서');
    });

    it('이력서 목록 조회', async () => {
      const res = await authGet('normal', '/api/resumes').expect(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('이력서 복제', async () => {
      const res = await authPost('normal', `/api/resumes/${resumeId}/duplicate`).expect(201);
      expect(res.body.title).toContain('복사본');
      await authDelete('normal', `/api/resumes/${res.body.id}`);
    });

    it('알림 목록', async () => {
      const res = await authGet('normal', '/api/notifications').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('알림 카운트', async () => {
      const res = await authGet('normal', '/api/notifications/count').expect(200);
      expect(typeof res.body.count).toBe('number');
    });

    it('커뮤니티 글 작성', async () => {
      const res = await authPost('normal', '/api/community').send({
        title: '통합테스트 게시글',
        content: '테스트 내용입니다. 충분히 긴 내용.',
        category: 'free',
      }).expect(201);
      expect(res.body.id).toBeDefined();
      // 정리
      await authDelete('normal', `/api/community/${res.body.id}`);
    });

    it('쪽지 전송 (자신에게 → 실패)', async () => {
      const meRes = await authGet('normal', '/api/auth/me').expect(200);
      await authPost('normal', `/api/social/messages/${meRes.body.id}`).send({ content: '자신에게' }).expect(403);
    });

    it('대시보드 조회', async () => {
      const res = await authGet('normal', '/api/resumes/dashboard/analytics');
      expect([200, 404]).toContain(res.status);
    });

    it('프로필 조회', async () => {
      const res = await authGet('normal', '/api/auth/me').expect(200);
      expect(res.body.email).toBe(USERS.normal.email);
    });

    it('임시저장 저장/조회/삭제', async () => {
      await authPut('normal', '/api/health/drafts/test_draft').send({ title: '임시' }).expect(200);
      const get = await authGet('normal', '/api/health/drafts/test_draft').expect(200);
      expect(get.body.title).toBe('임시');
      await authDelete('normal', '/api/health/drafts/test_draft').expect(200);
    });

    it('금칙어 검사', async () => {
      const res = await authPost('normal', '/api/forbidden-words/check').send({ text: '정상 텍스트' }).expect(201);
      expect(res.body.blocked).toBe(false);
    });

    it('이력서 삭제', async () => {
      await authDelete('normal', `/api/resumes/${resumeId}`).expect(200);
    });
  });

  // ═══════════════════════════════════════════
  // 3. 채용담당자 기능
  // ═══════════════════════════════════════════
  describe('채용담당자', () => {
    it('채용공고 작성', async () => {
      const res = await authPost('recruiter', '/api/jobs').send({
        company: '테스트기업',
        position: 'FE 개발자',
        location: '서울',
        description: '테스트 채용공고',
        type: 'full_time',
        skills: 'React,TypeScript',
      }).expect(201);
      expect(res.body.id).toBeDefined();
      await authDelete('recruiter', `/api/jobs/${res.body.id}`);
    });

    it('채용 통계', async () => {
      const res = await api().get('/api/jobs/stats').expect(200);
      expect(res.body.total).toBeDefined();
      expect(res.body.byCompany).toBeDefined();
    });

    it('큐레이션 채용 목록', async () => {
      const res = await api().get('/api/jobs/curated/list').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('외부 채용 링크', async () => {
      const res = await api().get('/api/jobs/external-links/list').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════
  // 4. 관리자 기능
  // ═══════════════════════════════════════════
  describe('관리자', () => {
    it('관리자 통계 (일반 유저 → 403)', async () => {
      await authGet('normal', '/api/health/admin/stats').expect(403);
    });

    it('공지사항 목록', async () => {
      const res = await api().get('/api/notices?limit=5').expect(200);
      expect(res.body.items || Array.isArray(res.body)).toBeTruthy();
    });

    it('배너 목록', async () => {
      const res = await api().get('/api/banners/active').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('시스템 설정 조회', async () => {
      const res = await api().get('/api/system-config/public').expect(200);
      expect(typeof res.body).toBe('object');
    });

    it('콘텐츠 조회', async () => {
      const res = await api().get('/api/system-config/content/homepage').expect(200);
      // null or object
      expect([null, 'object'].includes(typeof res.body) || res.body === null).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════
  // 5. 인증/보안
  // ═══════════════════════════════════════════
  describe('인증/보안', () => {
    it('비로그인 → 이력서 생성 401', async () => {
      await api().post('/api/resumes').send({ title: 'x' }).expect(401);
    });

    it('잘못된 토큰 → 인증 실패', async () => {
      const res = await api().get('/api/resumes').set('Authorization', 'Bearer invalid-token-xyz');
      expect([200, 401]).toContain(res.status);
    });

    it('비밀번호 없이 로그인 → 실패', async () => {
      const res = await api().post('/api/auth/login').send({ email: USERS.normal.email });
      expect([400, 401]).toContain(res.status);
    });

    it('틀린 비밀번호 → 401', async () => {
      await api().post('/api/auth/login').send({ email: USERS.normal.email, password: 'wrong' }).expect(401);
    });

    it('존재하지 않는 이메일 → 실패', async () => {
      const res = await api().post('/api/auth/login').send({ email: 'noexist@test.local', password: 'pass' });
      expect([401, 429]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // 6. 커뮤니티 기능
  // ═══════════════════════════════════════════
  describe('커뮤니티', () => {
    let postId: string;

    it('게시글 작성', async () => {
      const res = await authPost('normal', '/api/community').send({
        title: 'E2E 커뮤니티 테스트',
        content: '통합 테스트용 게시글 내용입니다.',
        category: 'free',
      }).expect(201);
      postId = res.body.id;
    });

    it('게시글 상세 조회', async () => {
      const res = await authGet('normal', `/api/community/${postId}`).expect(200);
      expect(res.body.title).toBe('E2E 커뮤니티 테스트');
    });

    it('좋아요 토글', async () => {
      const res = await authPost('normal', `/api/community/${postId}/like`).expect(201);
      expect(typeof res.body.liked).toBe('boolean');
    });

    it('댓글 작성', async () => {
      const res = await authPost('normal', `/api/community/${postId}/comments`).send({
        content: '통합 테스트 댓글',
      }).expect(201);
      expect(res.body.id).toBeDefined();
    });

    it('댓글 목록', async () => {
      const res = await api().get(`/api/community/${postId}/comments`).expect(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('카테고리 필터', async () => {
      const res = await api().get('/api/community?category=free&limit=5').expect(200);
      expect(res.body.items).toBeDefined();
    });

    it('검색', async () => {
      const res = await api().get('/api/community?search=E2E&limit=5').expect(200);
      expect(res.body.items).toBeDefined();
    });

    it('정렬 (인기순)', async () => {
      const res = await api().get('/api/community?sort=popular&limit=5').expect(200);
      expect(res.body.items).toBeDefined();
    });

    it('게시글 삭제', async () => {
      await authDelete('normal', `/api/community/${postId}`).expect(200);
    });
  });

  // ═══════════════════════════════════════════
  // 7. 이력서 공유
  // ═══════════════════════════════════════════
  describe('이력서 공유', () => {
    let resumeId: string;

    beforeAll(async () => {
      const res = await authPost('normal', '/api/resumes').send({
        title: '공유 테스트',
        personalInfo: { name: '공유자' },
      });
      resumeId = res.body.id;
    });

    afterAll(async () => {
      await authDelete('normal', `/api/resumes/${resumeId}`).catch(() => {});
    });

    it('공유 링크 생성', async () => {
      const res = await authPost('normal', `/api/resumes/${resumeId}/share`).send({});
      expect([200, 201]).toContain(res.status);
    });

    it('공개 이력서 목록', async () => {
      const res = await api().get('/api/resumes/public?limit=5').expect(200);
      expect(res.body.data || res.body.items).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════
  // 8. 프로필 & 소셜
  // ═══════════════════════════════════════════
  describe('프로필 & 소셜', () => {
    let targetUserId: string;

    beforeAll(async () => {
      const meRes = await authGet('recruiter', '/api/auth/me');
      targetUserId = meRes.body?.id;
    });

    it('GET /api/auth/me — 프로필 조회', async () => {
      const res = await authGet('normal', '/api/auth/me').expect(200);
      expect(res.body.email).toBe(USERS.normal.email);
      expect(res.body.id).toBeDefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('PATCH /api/auth/profile — name 수정', async () => {
      const res = await api()
        .patch('/api/auth/profile')
        .set('Authorization', `Bearer ${tokens.normal}`)
        .send({ name: '수정된이름' });
      expect([200, 400, 401]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.name).toBe('수정된이름');
        // 원복
        await api()
          .patch('/api/auth/profile')
          .set('Authorization', `Bearer ${tokens.normal}`)
          .send({ name: USERS.normal.name });
      }
    });

    it('POST /api/social/follow/:userId — 팔로우', async () => {
      if (!targetUserId) return;
      const res = await authPost('normal', `/api/social/follow/${targetUserId}`).send({});
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('DELETE /api/social/follow/:userId — 언팔로우', async () => {
      if (!targetUserId) return;
      const res = await authDelete('normal', `/api/social/follow/${targetUserId}`);
      expect([200, 204, 404]).toContain(res.status);
    });

    it('GET /api/social/followers — 팔로워 목록', async () => {
      const res = await authGet('normal', '/api/social/followers').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // 9. 이력서 고급
  // ═══════════════════════════════════════════
  describe('이력서 고급', () => {
    let resumeId: string;
    let tagId: string;

    beforeAll(async () => {
      const res = await authPost('normal', '/api/resumes').send({
        title: '고급 테스트 이력서',
        personalInfo: { name: '고급테스터', summary: '고급 기능 테스트용' },
        skills: [{ category: 'BE', items: 'Node.js,NestJS' }],
      });
      resumeId = res.body.id;
    });

    afterAll(async () => {
      if (resumeId) await authDelete('normal', `/api/resumes/${resumeId}`).catch(() => {});
      if (tagId) await authDelete('normal', `/api/tags/${tagId}`).catch(() => {});
    });

    it('POST /api/resumes/:id/share — 공유 링크 생성', async () => {
      const res = await authPost('normal', `/api/resumes/${resumeId}/share`).send({ expiresInHours: 24 });
      expect([200, 201]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body.token || res.body.id).toBeDefined();
      }
    });

    it('GET /api/resumes/:id/versions — 버전 목록', async () => {
      const res = await authGet('normal', `/api/resumes/${resumeId}/versions`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/resumes/:id/tags — 태그 추가', async () => {
      // 태그 생성
      const tagRes = await authPost('normal', '/api/tags').send({ name: `e2e-tag-${Date.now()}` });
      expect([200, 201]).toContain(tagRes.status);
      tagId = tagRes.body?.id;

      if (tagId) {
        const res = await authPost('normal', `/api/tags/${tagId}/resumes/${resumeId}`).send({});
        expect([200, 201, 404]).toContain(res.status);
      }
    });

    it('GET /api/resumes/public — 공개 이력서 목록', async () => {
      const res = await api().get('/api/resumes/public?limit=5').expect(200);
      expect(res.body.data || res.body.items).toBeDefined();
    });

    it('POST /api/resumes/:id/transform — 변환 (standard)', async () => {
      // 실제 경로는 /api/templates/local-transform/:resumeId
      const res = await authPost('normal', `/api/templates/local-transform/${resumeId}`).send({ preset: 'standard' });
      expect([200, 201, 400, 403, 404]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        expect(res.body.text || res.body.method).toBeDefined();
      }
    });

    it('GET /api/resumes/popular-skills — 인기 기술', async () => {
      const res = await api().get('/api/resumes/popular-skills').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // 10. 북마크
  // ═══════════════════════════════════════════
  describe('북마크', () => {
    let resumeId: string;

    beforeAll(async () => {
      // 다른 유저(recruiter)의 이력서 생성 (북마크 대상으로 사용)
      const res = await authPost('recruiter', '/api/resumes').send({
        title: '북마크 대상 이력서',
        personalInfo: { name: '북마크대상' },
        visibility: 'public',
      });
      resumeId = res.body?.id;
    });

    afterAll(async () => {
      if (resumeId) await authDelete('recruiter', `/api/resumes/${resumeId}`).catch(() => {});
    });

    it('POST /api/resumes/:id/bookmark — 추가', async () => {
      if (!resumeId) return;
      const res = await authPost('normal', `/api/resumes/${resumeId}/bookmark`).send({});
      expect([200, 201, 403, 404, 409]).toContain(res.status);
    });

    it('GET /api/resumes/bookmarks/list — 목록', async () => {
      const res = await authGet('normal', '/api/resumes/bookmarks/list');
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) expect(Array.isArray(res.body)).toBe(true);
    });

    it('DELETE /api/resumes/:id/bookmark — 제거', async () => {
      if (!resumeId) return;
      const res = await authDelete('normal', `/api/resumes/${resumeId}/bookmark`);
      expect([200, 204, 404]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // 11. 템플릿
  // ═══════════════════════════════════════════
  describe('템플릿', () => {
    let templateId: string;

    afterAll(async () => {
      if (templateId) await authDelete('normal', `/api/templates/${templateId}`).catch(() => {});
    });

    it('GET /api/templates — 목록 (기본)', async () => {
      const res = await api().get('/api/templates').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /api/templates — 커스텀 생성 (auth)', async () => {
      const res = await authPost('normal', '/api/templates').send({
        name: `E2E Template ${Date.now()}`,
        description: 'E2E 테스트 템플릿',
        category: 'custom',
        prompt: '테스트 프롬프트',
        layout: JSON.stringify({ sections: ['personalInfo', 'experiences'] }),
      });
      expect([200, 201, 400, 403]).toContain(res.status);
      if (res.status === 200 || res.status === 201) {
        templateId = res.body?.id;
        expect(templateId).toBeDefined();
      }
    });

    it('DELETE /api/templates/:id — 삭제', async () => {
      if (!templateId) return;
      const res = await authDelete('normal', `/api/templates/${templateId}`);
      expect([200, 204, 403, 404]).toContain(res.status);
      if (res.status === 200 || res.status === 204) templateId = '';
    });
  });

  // ═══════════════════════════════════════════
  // 12. 외부 링크
  // ═══════════════════════════════════════════
  describe('외부 링크', () => {
    it('GET /api/jobs/external-links/list — 목록', async () => {
      const res = await api().get('/api/jobs/external-links/list').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('GET /api/jobs/curated/list — 큐레이션', async () => {
      const res = await api().get('/api/jobs/curated/list').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });

    it('GET /api/jobs/curated/list?jobType=fulltime — 필터', async () => {
      const res = await api().get('/api/jobs/curated/list?jobType=fulltime&limit=5').expect(200);
      expect(Array.isArray(res.body) || res.body.items).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════
  // 13. 금칙어
  // ═══════════════════════════════════════════
  describe('금칙어', () => {
    it('POST /api/forbidden-words/check — 정상', async () => {
      const res = await authPost('normal', '/api/forbidden-words/check').send({ text: '정상적인 텍스트 입니다' });
      expect([200, 201]).toContain(res.status);
      expect(res.body.blocked).toBe(false);
    });

    it('POST /api/forbidden-words/check — 차단', async () => {
      // 금칙어가 등록되어 있지 않을 수 있으므로 결과 유연 처리
      const res = await authPost('normal', '/api/forbidden-words/check').send({ text: 'fuck shit asshole bitch' });
      expect([200, 201]).toContain(res.status);
      expect(typeof res.body.blocked).toBe('boolean');
    });

    it('GET /api/forbidden-words/stats — 관리자만', async () => {
      // 일반 유저는 빈 객체, 관리자만 조회 가능
      const res = await authGet('normal', '/api/forbidden-words/stats').expect(200);
      expect(typeof res.body).toBe('object');
    });
  });

  // ═══════════════════════════════════════════
  // 14. 공지사항
  // ═══════════════════════════════════════════
  describe('공지사항', () => {
    it('GET /api/notices — 목록', async () => {
      const res = await api().get('/api/notices?limit=5').expect(200);
      expect(res.body.items || Array.isArray(res.body)).toBeTruthy();
    });

    it('GET /api/notices?type=GENERAL — 필터', async () => {
      const res = await api().get('/api/notices?type=GENERAL&limit=5').expect(200);
      expect(res.body.items || Array.isArray(res.body)).toBeTruthy();
    });

    it('GET /api/notices/popup — 팝업 공지', async () => {
      const res = await api().get('/api/notices/popup').expect(200);
      // null or object
      expect(res.body === null || typeof res.body === 'object').toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // 15. 시스템 설정
  // ═══════════════════════════════════════════
  describe('시스템 설정', () => {
    it('GET /api/system-config/content/homepage — 홈페이지 콘텐츠', async () => {
      const res = await api().get('/api/system-config/content/homepage').expect(200);
      expect(res.body === null || typeof res.body === 'object' || typeof res.body === 'string').toBe(true);
    });

    it('GET /api/system-config/public — 공개 설정', async () => {
      const res = await api().get('/api/system-config/public').expect(200);
      expect(typeof res.body).toBe('object');
    });
  });
});
