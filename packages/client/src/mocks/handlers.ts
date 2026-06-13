import { http, HttpResponse, delay } from 'msw';
import { db } from './data';
import type {
  Activity,
  Award,
  Certification,
  Education,
  Experience,
  Language,
  PersonalInfo,
  Project,
  ResumeSummary,
  Skill,
} from '@/types/resume';

type MockResume = (typeof db.resumes)[number];
type MockTag = (typeof db.tags)[number];
type MockTemplate = (typeof db.templates)[number];
type OptionalId<T extends { id: string }> = Omit<T, 'id'> & { id?: string };

interface ResumeRequestBody {
  title?: string;
  personalInfo?: PersonalInfo;
  experiences?: OptionalId<Experience>[];
  educations?: OptionalId<Education>[];
  skills?: OptionalId<Skill>[];
  projects?: OptionalId<Project>[];
  certifications?: OptionalId<Certification>[];
  languages?: OptionalId<Language>[];
  awards?: OptionalId<Award>[];
  activities?: OptionalId<Activity>[];
}

interface VisibilityRequestBody {
  visibility?: MockResume['visibility'];
}

interface TagRequestBody {
  name?: string;
  color?: string;
}

type TemplateRequestBody = Partial<
  Pick<MockTemplate, 'name' | 'description' | 'category' | 'prompt' | 'layout'>
>;

interface LocalTransformRequestBody {
  templateId?: string;
  preset?: string;
  provider?: string;
}

const mockSiteStats = {
  users: { total: 1240, today: 12, thisWeek: 86 },
  resumes: { total: 4820, public: 615, today: 28 },
  activity: { totalViews: 183420, transforms: 2940, applications: 520 },
  community: { posts: 128, comments: 460 },
  content: { templates: 15, comments: 460 },
  jobs: { active: 32 },
};

const mockCommunityPosts = [
  {
    id: 'mock-post-1',
    title: '신입 프론트엔드 이력서 피드백 체크리스트',
    content: '프로젝트 성과와 역할을 수치 중심으로 정리한 사례를 공유합니다.',
    category: 'resume',
    author: { id: 'mock-user-1', name: '김개발' },
    authorId: 'mock-user-1',
    viewCount: 128,
    likeCount: 18,
    commentCount: 4,
    isPinned: true,
    isHidden: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-post-2',
    title: '면접 답변을 STAR 구조로 다듬는 방법',
    content: '상황, 과제, 행동, 결과를 짧고 명확하게 연결하는 연습법입니다.',
    category: 'interview',
    author: { id: 'mock-user-2', name: '박면접' },
    authorId: 'mock-user-2',
    viewCount: 92,
    likeCount: 11,
    commentCount: 2,
    isPinned: false,
    isHidden: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockStudyGroups = [
  {
    id: 'mock-study-1',
    name: '상반기 프론트엔드 면접 스터디',
    description: '주 2회 모의면접과 이력서 상호 리뷰를 진행합니다.',
    companyTier: 'startup',
    cafeCategory: 'interview',
    experienceLevel: 'junior',
    maxMembers: 8,
    memberCount: 5,
    isOpen: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-study-2',
    name: '공기업 자기소개서 첨삭 모임',
    description: '문항별 소재 정리와 구조화 피드백을 함께합니다.',
    companyTier: 'public',
    cafeCategory: 'resume',
    experienceLevel: 'entry',
    maxMembers: 10,
    memberCount: 7,
    isOpen: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCuratedJobs = [
  {
    id: 'mock-job-1',
    company: '이력서랩',
    companyLogo: '🧪',
    position: 'Frontend Engineer',
    department: 'Product Engineering',
    summary: 'React 기반 사용자 경험과 이력서 편집 플로우를 고도화합니다.',
    requirements: 'React, TypeScript 기반 서비스 개발 경험과 접근성/성능 개선 경험',
    benefits: '자율 출퇴근, 원격 근무, 성장 예산 지원',
    skills: 'React,TypeScript,Vite,Accessibility',
    location: '서울 강남구',
    type: 'fulltime',
    jobType: 'fulltime',
    experienceLevel: 'junior',
    education: '무관',
    companySize: 'startup',
    industry: 'HR Tech',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    isRolling: false,
    sourceUrl: 'https://example.com/jobs/frontend',
    sourceSite: 'Mock Jobs',
    salary: '4,500만-6,000만원',
    viewCount: 230,
    clickCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-job-2',
    company: '커리어스튜디오',
    companyLogo: '🎯',
    position: 'Product Designer',
    department: 'Design',
    summary: '채용 SaaS의 정보 구조와 핵심 사용 흐름을 설계합니다.',
    requirements: 'Figma, UX Research, Design System 운영 경험',
    benefits: '장비 지원, 교육비 지원, 유연 근무',
    skills: 'Figma,UX Research,Design System',
    location: '원격',
    type: 'contract',
    jobType: 'contract',
    experienceLevel: 'career',
    education: '무관',
    companySize: 'sme',
    industry: 'SaaS',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    isRolling: false,
    sourceUrl: 'https://example.com/jobs/product-designer',
    sourceSite: 'Mock Jobs',
    salary: '협의',
    viewCount: 150,
    clickCount: 26,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCoaches = [
  {
    id: 'mock-coach-1',
    userId: 'mock-user-3',
    displayName: '한서류',
    headline: '이력서와 자기소개서 구조화 전문 코치',
    bio: 'IT/스타트업 지원자의 강점 정리와 서류 스토리라인을 돕습니다.',
    specialties: ['이력서 첨삭', '자기소개서', '면접 코칭'],
    hourlyRate: 45000,
    avgRating: 4.9,
    reviewCount: 38,
    sessionCount: 120,
    responseTime: '24시간 이내',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const contentBlocks: Record<string, unknown> = {
  whats_new: {
    version: 'mock-2026-05',
    title: '이력서공방 업데이트',
    features: [
      {
        title: '스터디 그룹 강화',
        description: '면접 질문과 답변 피드백 흐름을 더 자연스럽게 다듬었습니다.',
      },
    ],
  },
  pricing_faq: [
    {
      question: '언제든 해지할 수 있나요?',
      answer: '네. 결제 기간이 끝날 때까지 기능을 유지하고 다음 결제를 중단합니다.',
    },
  ],
  coach_specialties: ['이력서 첨삭', '자기소개서', '면접 코칭', '커리어 상담', '포트폴리오'],
  homepage: {},
  onboarding: {},
  help_faq: [],
};

export const handlers = [
  // ========================
  // Runtime config / content
  // ========================
  http.get(/\/api\/system-config\/public$/, async () => {
    return HttpResponse.json({
      monetization_enabled: false,
      upload_enabled: true,
    });
  }),

  http.get(/\/api\/system-config\/content\/[^/?]+$/, async ({ request }) => {
    const key = new URL(request.url).pathname.split('/').pop() || '';
    return HttpResponse.json(contentBlocks[key] ?? {});
  }),

  http.get(/\/api\/system-config\/permissions$/, async () => {
    return HttpResponse.json({
      'perm.curatedJobs.create': 'all',
      'perm.curatedJobs.edit': 'admin',
      'perm.curatedJobs.delete': 'admin',
      'perm.community.create': 'all',
      'perm.community.comment': 'all',
    });
  }),

  http.get(/\/api\/system-config\/feature-toggles$/, async () => {
    return HttpResponse.json({});
  }),

  http.get(/\/api\/system-config\/upload-settings$/, async () => {
    return HttpResponse.json({
      enabled: true,
      maxSizeMb: 10,
      allowedMime:
        'image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }),

  http.get(/\/api\/health\/announcement$/, async () => {
    return HttpResponse.json({});
  }),

  http.get(/\/api\/health\/stats$/, async () => {
    return HttpResponse.json(mockSiteStats);
  }),

  http.get(/\/api\/notices\/popup$/, async () => {
    return HttpResponse.json([]);
  }),

  http.get(/\/api\/banners\/active$/, async () => {
    return HttpResponse.json([]);
  }),

  // ========================
  // Public marketplace/content lists
  // ========================
  http.get(/\/api\/jobs\/curated\/list(?:\?.*)?$/, async () => {
    await delay(50);
    return HttpResponse.json({ items: mockCuratedJobs, total: mockCuratedJobs.length });
  }),

  http.get(/\/api\/jobs(?:\?.*)?$/, async () => {
    await delay(50);
    return HttpResponse.json([]);
  }),

  http.get(/\/api\/study-groups(?:\?.*)?$/, async () => {
    await delay(50);
    return HttpResponse.json({ items: mockStudyGroups, total: mockStudyGroups.length });
  }),

  http.get(/\/api\/community(?:\?.*)?$/, async () => {
    await delay(50);
    return HttpResponse.json({
      items: mockCommunityPosts,
      total: mockCommunityPosts.length,
      totalPages: 1,
    });
  }),

  http.get(/\/api\/coaching\/coaches(?:\?.*)?$/, async () => {
    await delay(50);
    return HttpResponse.json(mockCoaches);
  }),

  // ========================
  // Resumes
  // ========================
  http.get('/api/resumes/public', async () => {
    await delay(100);
    const resumes = db.resumes.filter((r) => r.visibility === 'public').map(toSummary);
    return HttpResponse.json({ data: resumes, total: resumes.length, page: 1, totalPages: 1 });
  }),

  http.get('/api/resumes/:id', async ({ params }) => {
    await delay(100);
    const resume = db.resumes.find((r) => r.id === params.id);
    if (!resume)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    return HttpResponse.json(resume);
  }),

  http.get('/api/resumes', async () => {
    await delay(100);
    return HttpResponse.json(db.resumes.map(toSummary));
  }),

  http.post('/api/resumes', async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as ResumeRequestBody;
    const resume: MockResume = {
      id: crypto.randomUUID(),
      title: body.title || '',
      visibility: 'private',
      userId: 'mock-user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: body.personalInfo || {
        name: '',
        email: '',
        phone: '',
        address: '',
        website: '',
        summary: '',
      },
      experiences: (body.experiences || []).map(withId),
      educations: (body.educations || []).map(withId),
      skills: (body.skills || []).map(withId),
      projects: (body.projects || []).map(withId),
      certifications: (body.certifications || []).map(withId),
      languages: (body.languages || []).map(withId),
      awards: (body.awards || []).map(withId),
      activities: (body.activities || []).map(withId),
      tags: [],
    };
    db.resumes.push(resume);
    return HttpResponse.json(resume, { status: 201 });
  }),

  http.put('/api/resumes/:id', async ({ params, request }) => {
    await delay(150);
    const idx = db.resumes.findIndex((r) => r.id === params.id);
    if (idx === -1)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as ResumeRequestBody;
    const resume = db.resumes[idx];
    if (body.title !== undefined) resume.title = body.title;
    if (body.personalInfo) resume.personalInfo = body.personalInfo;
    if (body.experiences) resume.experiences = body.experiences.map(withId);
    if (body.educations) resume.educations = body.educations.map(withId);
    if (body.skills) resume.skills = body.skills.map(withId);
    if (body.projects) resume.projects = body.projects.map(withId);
    if (body.certifications) resume.certifications = body.certifications.map(withId);
    if (body.languages) resume.languages = body.languages.map(withId);
    if (body.awards) resume.awards = body.awards.map(withId);
    if (body.activities) resume.activities = body.activities.map(withId);
    resume.updatedAt = new Date().toISOString();
    return HttpResponse.json(resume);
  }),

  http.delete('/api/resumes/:id', async ({ params }) => {
    await delay(100);
    const idx = db.resumes.findIndex((r) => r.id === params.id);
    if (idx === -1)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    db.resumes.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/resumes/:id/duplicate', async ({ params }) => {
    await delay(150);
    const source = db.resumes.find((r) => r.id === params.id);
    if (!source)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const dup = {
      ...structuredClone(source),
      id: crypto.randomUUID(),
      title: `${source.title} (복사본)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.resumes.push(dup);
    return HttpResponse.json(dup, { status: 201 });
  }),

  http.patch('/api/resumes/:id/visibility', async ({ params, request }) => {
    await delay(100);
    const resume = db.resumes.find((r) => r.id === params.id);
    if (!resume)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as VisibilityRequestBody;
    if (body.visibility) resume.visibility = body.visibility;
    return HttpResponse.json({ id: resume.id, visibility: resume.visibility });
  }),

  // ========================
  // Tags
  // ========================
  http.get('/api/tags', async () => {
    await delay(50);
    return HttpResponse.json(db.tags);
  }),

  http.post('/api/tags', async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as TagRequestBody;
    if (!body.name)
      return HttpResponse.json({ message: '태그 이름은 필수입니다' }, { status: 400 });
    if (db.tags.some((t) => t.name === body.name)) {
      return HttpResponse.json({ message: '이미 존재하는 태그입니다' }, { status: 409 });
    }
    const tag: MockTag = {
      id: crypto.randomUUID(),
      name: body.name,
      color: body.color || '#6366f1',
      resumeCount: 0,
    };
    db.tags.push(tag);
    return HttpResponse.json(tag, { status: 201 });
  }),

  http.delete('/api/tags/:id', async ({ params }) => {
    await delay(50);
    const idx = db.tags.findIndex((t) => t.id === params.id);
    if (idx === -1)
      return HttpResponse.json({ message: '태그를 찾을 수 없습니다' }, { status: 404 });
    db.tags.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/tags/:tagId/resumes/:resumeId', async ({ params }) => {
    await delay(50);
    const tag = db.tags.find((t) => t.id === params.tagId);
    const resume = db.resumes.find((r) => r.id === params.resumeId);
    if (!tag || !resume) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    if (!resume.tags.some((t) => t.id === tag.id)) {
      resume.tags.push({ id: tag.id, name: tag.name, color: tag.color });
      tag.resumeCount++;
    }
    return HttpResponse.json({ success: true }, { status: 201 });
  }),

  http.delete('/api/tags/:tagId/resumes/:resumeId', async ({ params }) => {
    await delay(50);
    const tag = db.tags.find((t) => t.id === params.tagId);
    const resume = db.resumes.find((r) => r.id === params.resumeId);
    if (!tag || !resume) return HttpResponse.json({ message: 'Not found' }, { status: 404 });
    resume.tags = resume.tags.filter((t) => t.id !== tag.id);
    tag.resumeCount = Math.max(0, tag.resumeCount - 1);
    return HttpResponse.json({ success: true });
  }),

  // ========================
  // Templates
  // ========================
  http.get('/api/templates/presets/list', async () => {
    await delay(50);
    return HttpResponse.json([
      { id: 'standard', name: '표준 이력서', description: '한국어 표준 양식' },
      { id: 'developer', name: '개발자 이력서', description: '기술 스택 강조' },
      { id: 'career-focused', name: '경력 중심', description: '경력기술서 형식' },
      { id: 'academic', name: '학술용', description: '학력/논문 중심' },
      { id: 'minimal', name: '심플', description: '필수 정보만' },
    ]);
  }),

  http.get('/api/templates/:id', async ({ params }) => {
    await delay(50);
    const tpl = db.templates.find((t) => t.id === params.id);
    if (!tpl) return HttpResponse.json({ message: '템플릿을 찾을 수 없습니다' }, { status: 404 });
    return HttpResponse.json(tpl);
  }),

  http.get('/api/templates', async () => {
    await delay(50);
    return HttpResponse.json(db.templates);
  }),

  http.post('/api/templates', async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as TemplateRequestBody;
    if (!body.name) return HttpResponse.json({ message: '이름은 필수입니다' }, { status: 400 });
    const tpl = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      category: body.category || 'general',
      prompt: body.prompt || '',
      layout: body.layout || '{}',
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.templates.push(tpl as unknown as (typeof db.templates)[number]);
    return HttpResponse.json(tpl, { status: 201 });
  }),

  http.post('/api/templates/local-transform/:resumeId', async ({ params, request }) => {
    await delay(200);
    const resume = db.resumes.find((r) => r.id === params.resumeId);
    if (!resume)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as LocalTransformRequestBody;
    const text = `# ${resume.personalInfo.name}의 이력서\n\n## 인적사항\n이름: ${resume.personalInfo.name}\n이메일: ${resume.personalInfo.email}\n\n## 경력\n${resume.experiences.map((e) => `- ${e.company} | ${e.position}`).join('\n')}\n\n## 학력\n${resume.educations.map((e) => `- ${e.school} ${e.degree} ${e.field}`).join('\n')}\n\n## 기술\n${resume.skills.map((s) => `- ${s.category}: ${s.items}`).join('\n')}`;
    return HttpResponse.json(
      {
        text,
        method: body.templateId ? 'template' : 'preset',
        preset: body.preset || undefined,
      },
      { status: 201 },
    );
  }),

  // ========================
  // LLM Transform
  // ========================
  http.get('/api/resumes/:id/transform/providers', async () => {
    await delay(50);
    return HttpResponse.json([
      { name: 'gemini', available: true, isDefault: true },
      { name: 'groq', available: true, isDefault: false },
      { name: 'anthropic', available: false, isDefault: false },
    ]);
  }),

  http.get('/api/resumes/:id/transform/usage', async () => {
    await delay(50);
    return HttpResponse.json({ totalTransformations: 5, totalTokensUsed: 12500 });
  }),

  http.get('/api/resumes/:id/transform/history', async () => {
    await delay(50);
    return HttpResponse.json([]);
  }),

  http.post('/api/resumes/:id/transform', async ({ params, request }) => {
    await delay(500);
    const resume = db.resumes.find((r) => r.id === params.id);
    if (!resume)
      return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as LocalTransformRequestBody;
    return HttpResponse.json(
      {
        id: crypto.randomUUID(),
        text: `[Mock LLM 변환 결과]\n\n# ${resume.personalInfo.name}\n\n${resume.personalInfo.summary}\n\n## 경력사항\n${resume.experiences.map((e) => `### ${e.company} - ${e.position}\n${e.description}`).join('\n\n')}`,
        tokensUsed: 1500,
        provider: body.provider || 'gemini',
        model: 'mock-model',
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  // ========================
  // Versions
  // ========================
  http.get('/api/resumes/:id/versions', async ({ params }) => {
    await delay(50);
    const versions = db.versions.filter((v) => v.resumeId === params.id);
    return HttpResponse.json(versions);
  }),

  // ========================
  // Auth
  // ========================
  http.get('/api/auth/providers', async () => {
    await delay(50);
    return HttpResponse.json(['google', 'github', 'kakao']);
  }),

  http.get('/api/auth/me', async () => {
    await delay(50);
    return HttpResponse.json({
      id: 'mock-user-1',
      email: 'dev@example.com',
      name: '김개발',
      avatar: '',
      provider: 'github',
    });
  }),

  // ========================
  // Health
  // ========================
  http.get('/api/health', async () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 3600,
      database: 'ok',
      memory: { rss: 64, heapUsed: 32 },
    });
  }),
];

// Helpers
function toSummary(r: MockResume): ResumeSummary {
  return {
    id: r.id,
    title: r.title,
    visibility:
      r.visibility === 'public'
        ? 'public'
        : r.visibility === 'link-only'
          ? 'link-only'
          : r.visibility === 'selective'
            ? 'selective'
            : 'private',
    personalInfo: r.personalInfo,
    tags: r.tags || [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function withId<T extends { id?: string }>(item: T): T & { id: string } {
  return { ...item, id: item.id || crypto.randomUUID() };
}
