import type { Resume, Template, Tag } from '@/types/resume';

function id() {
  return crypto.randomUUID();
}

export const db = {
  resumes: [
    {
      id: id(),
      title: '김개발 이력서',
      visibility: 'private',
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: {
        name: '김개발',
        email: 'dev@example.com',
        phone: '010-1234-5678',
        address: '서울시 강남구',
        website: 'https://github.com/devkim',
        summary: '5년차 풀스택 개발자. NestJS, React, TypeScript 전문.',
      },
      experiences: [
        {
          id: id(),
          company: '테크스타트업',
          position: '시니어 개발자',
          startDate: '2022-01-01',
          endDate: '',
          current: true,
          description: 'NestJS 기반 백엔드 아키텍처 설계 및 구현\nReact 프론트엔드 리드',
        },
        {
          id: id(),
          company: '웹에이전시',
          position: '주니어 개발자',
          startDate: '2019-03-01',
          endDate: '2021-12-31',
          current: false,
          description: 'React/Next.js 웹 애플리케이션 개발\nREST API 설계 및 구현',
        },
      ],
      educations: [
        {
          id: id(),
          school: '한국대학교',
          degree: '학사',
          field: '컴퓨터공학',
          startDate: '2015-03-02',
          endDate: '2019-02-28',
          description: '학점 4.2/4.5',
        },
      ],
      skills: [
        { id: id(), category: 'Frontend', items: 'React, TypeScript, Tailwind CSS, Next.js' },
        { id: id(), category: 'Backend', items: 'NestJS, Node.js, Prisma, PostgreSQL' },
        { id: id(), category: 'DevOps', items: 'Docker, GitHub Actions, Vercel, AWS' },
      ],
      projects: [
        {
          id: id(),
          name: '이력서 관리 플랫폼',
          role: '풀스택 개발',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          description: 'LLM 기반 이력서 자동 변환 서비스 개발',
          link: 'https://github.com/devkim/resume',
        },
      ],
      certifications: [
        {
          id: id(),
          name: '정보처리기사',
          issuer: '한국산업인력공단',
          issueDate: '2021-06-15',
          expiryDate: '',
          credentialId: 'C-2021-001',
          description: '',
        },
      ],
      languages: [
        { id: id(), name: '영어', testName: 'TOEIC', score: '950', testDate: '2023-11-20' },
      ],
      awards: [
        {
          id: id(),
          name: '사내 해커톤 대상',
          issuer: '테크스타트업',
          awardDate: '2023-12-01',
          description: 'AI 기반 이력서 자동화 프로젝트',
        },
      ],
      activities: [
        {
          id: id(),
          name: 'OSS 컨트리뷰터',
          organization: 'NestJS',
          role: 'Contributor',
          startDate: '2023-01-01',
          endDate: '2024-06-30',
          description: 'NestJS 한국어 문서 번역',
        },
      ],
      tags: [] as Tag[],
    },
  ] as unknown as (Resume & { visibility: string; userId: string | null; tags: Tag[] })[],

  tags: [
    { id: id(), name: '개발', color: '#3b82f6', resumeCount: 0 },
    { id: id(), name: '디자인', color: '#ef4444', resumeCount: 0 },
    { id: id(), name: '기획', color: '#22c55e', resumeCount: 0 },
  ] as (Tag & { resumeCount: number })[],

  templates: [
    {
      id: id(),
      name: '표준 이력서',
      description: '한국어 표준 이력서 양식',
      category: 'general',
      prompt: '',
      layout: '{}',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: id(),
      name: '개발자 이력서',
      description: '기술 스택 강조 양식',
      category: 'developer',
      prompt: '',
      layout: '{}',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ] as (Template & { createdAt: string; updatedAt: string })[],

  versions: [] as {
    id: string;
    resumeId: string;
    versionNumber: number;
    description: string;
    createdAt: string;
    snapshot: string;
  }[],
};
