import { http, HttpResponse, delay } from 'msw';
import { db } from './data';

export const handlers = [
  // ========================
  // Resumes
  // ========================
  http.get('/api/resumes/public', async () => {
    await delay(100);
    const resumes = db.resumes
      .filter((r) => r.visibility === 'public')
      .map(toSummary);
    return HttpResponse.json({ data: resumes, total: resumes.length, page: 1, totalPages: 1 });
  }),

  http.get('/api/resumes/:id', async ({ params }) => {
    await delay(100);
    const resume = db.resumes.find((r) => r.id === params.id);
    if (!resume) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    return HttpResponse.json(resume);
  }),

  http.get('/api/resumes', async () => {
    await delay(100);
    return HttpResponse.json(db.resumes.map(toSummary));
  }),

  http.post('/api/resumes', async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as any;
    const resume = {
      id: crypto.randomUUID(),
      title: body.title || '',
      visibility: 'private',
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: body.personalInfo || { name: '', email: '', phone: '', address: '', website: '', summary: '' },
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
    db.resumes.push(resume as any);
    return HttpResponse.json(resume, { status: 201 });
  }),

  http.put('/api/resumes/:id', async ({ params, request }) => {
    await delay(150);
    const idx = db.resumes.findIndex((r) => r.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as any;
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
    if (idx === -1) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    db.resumes.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.post('/api/resumes/:id/duplicate', async ({ params }) => {
    await delay(150);
    const source = db.resumes.find((r) => r.id === params.id);
    if (!source) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
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
    if (!resume) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as any;
    resume.visibility = body.visibility;
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
    const body = (await request.json()) as any;
    if (!body.name) return HttpResponse.json({ message: '태그 이름은 필수입니다' }, { status: 400 });
    if (db.tags.some((t) => t.name === body.name)) {
      return HttpResponse.json({ message: '이미 존재하는 태그입니다' }, { status: 409 });
    }
    const tag = { id: crypto.randomUUID(), name: body.name, color: body.color || '#6366f1', resumeCount: 0 };
    db.tags.push(tag);
    return HttpResponse.json(tag, { status: 201 });
  }),

  http.delete('/api/tags/:id', async ({ params }) => {
    await delay(50);
    const idx = db.tags.findIndex((t) => t.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: '태그를 찾을 수 없습니다' }, { status: 404 });
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
    const body = (await request.json()) as any;
    if (!body.name) return HttpResponse.json({ message: '이름은 필수입니다' }, { status: 400 });
    const tpl = {
      id: crypto.randomUUID(),
      name: body.name, description: body.description || '', category: body.category || 'general',
      prompt: body.prompt || '', layout: body.layout || '{}', isDefault: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    db.templates.push(tpl);
    return HttpResponse.json(tpl, { status: 201 });
  }),

  http.post('/api/templates/local-transform/:resumeId', async ({ params, request }) => {
    await delay(200);
    const resume = db.resumes.find((r) => r.id === params.resumeId);
    if (!resume) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as any;
    const text = `# ${resume.personalInfo.name}의 이력서\n\n## 인적사항\n이름: ${resume.personalInfo.name}\n이메일: ${resume.personalInfo.email}\n\n## 경력\n${resume.experiences.map((e) => `- ${e.company} | ${e.position}`).join('\n')}\n\n## 학력\n${resume.educations.map((e) => `- ${e.school} ${e.degree} ${e.field}`).join('\n')}\n\n## 기술\n${resume.skills.map((s) => `- ${s.category}: ${s.items}`).join('\n')}`;
    return HttpResponse.json({
      text,
      method: body.templateId ? 'template' : 'preset',
      preset: body.preset || undefined,
    }, { status: 201 });
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
    if (!resume) return HttpResponse.json({ message: '이력서를 찾을 수 없습니다' }, { status: 404 });
    const body = (await request.json()) as any;
    return HttpResponse.json({
      id: crypto.randomUUID(),
      text: `[Mock LLM 변환 결과]\n\n# ${resume.personalInfo.name}\n\n${resume.personalInfo.summary}\n\n## 경력사항\n${resume.experiences.map((e) => `### ${e.company} - ${e.position}\n${e.description}`).join('\n\n')}`,
      tokensUsed: 1500,
      provider: body.provider || 'gemini',
      model: 'mock-model',
      createdAt: new Date().toISOString(),
    }, { status: 201 });
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
function toSummary(r: any) {
  return {
    id: r.id,
    title: r.title,
    visibility: r.visibility,
    personalInfo: r.personalInfo,
    tags: r.tags || [],
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function withId(item: any) {
  return { ...item, id: item.id || crypto.randomUUID() };
}
