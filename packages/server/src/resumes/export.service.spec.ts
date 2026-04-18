import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockResume = {
  id: 'resume-1',
  title: '테스트 이력서',
  personalInfo: {
    name: '홍길동',
    email: 'test@test.com',
    phone: '010-1234-5678',
    address: '서울시',
    website: 'https://example.com',
    github: 'https://github.com/test',
    summary: '<p>풀스택 개발자</p>',
  },
  experiences: [
    {
      company: '테스트사',
      position: '시니어',
      startDate: '2020-01',
      endDate: '',
      current: true,
      description: '<b>리드 개발</b>',
      sortOrder: 0,
    },
  ],
  educations: [
    {
      school: '서울대',
      degree: '학사',
      field: 'CS',
      startDate: '2014-03',
      endDate: '2018-02',
      sortOrder: 0,
    },
  ],
  skills: [{ category: 'Frontend', items: 'React, TypeScript', sortOrder: 0 }],
  projects: [],
  certifications: [
    { name: '정보처리기사', issuer: '한국산업인력공단', issueDate: '2020-06', sortOrder: 0 },
  ],
  languages: [{ name: '영어', testName: 'TOEIC', score: '950', sortOrder: 0 }],
  awards: [],
  activities: [],
};

const mockPrisma = {
  resume: {
    findUnique: jest.fn(),
  },
};

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ExportService);
    jest.clearAllMocks();
  });

  describe('exportAsText', () => {
    it('이력서를 텍스트로 변환', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('홍길동');
      expect(text).toContain('test@test.com');
      expect(text).toContain('테스트사');
      expect(text).toContain('Frontend: React, TypeScript');
      expect(text).toContain('정보처리기사');
      expect(text).not.toContain('<p>'); // HTML stripped
      expect(text).not.toContain('<b>');
    });

    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.exportAsText('fake')).rejects.toThrow(NotFoundException);
    });
  });

  describe('exportAsMarkdown', () => {
    it('이력서를 마크다운으로 변환', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const md = await service.exportAsMarkdown('resume-1');
      expect(md).toContain('# 홍길동');
      expect(md).toContain('## 경력');
      expect(md).toContain('### 테스트사');
      expect(md).toContain('**Frontend**');
      expect(md).toContain('## 자격증');
      expect(md).not.toContain('<p>');
    });

    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.exportAsMarkdown('fake')).rejects.toThrow(NotFoundException);
    });

    it('마크다운 헤더 계층 구조 올바름', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const md = await service.exportAsMarkdown('resume-1');
      // H1: 이름, H2: 섹션, H3: 세부 항목
      expect(md).toMatch(/^# /m);
      expect(md).toMatch(/^## 경력/m);
      expect(md).toMatch(/^### 테스트사/m);
    });

    it('경력 기간 이탤릭 처리', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const md = await service.exportAsMarkdown('resume-1');
      expect(md).toMatch(/\*2020-01 ~ 현재\*/);
    });

    it('웹사이트 링크 마크다운 형식', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const md = await service.exportAsMarkdown('resume-1');
      expect(md).toContain('[Website](https://example.com)');
    });

    it('기술 목록에 볼드 카테고리', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const md = await service.exportAsMarkdown('resume-1');
      expect(md).toContain('- **Frontend**: React, TypeScript');
    });
  });

  // ──────────────────────────────────────────────────
  // JSON 내보내기
  // ──────────────────────────────────────────────────
  describe('exportAsJson', () => {
    it('이력서를 JSON 문자열로 변환', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const json = await service.exportAsJson('resume-1');
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('resume-1');
      expect(parsed.title).toBe('테스트 이력서');
    });

    it('JSON이 올바른 형식 (들여쓰기 2칸)', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const json = await service.exportAsJson('resume-1');
      // JSON.stringify(obj, null, 2) 형식 확인
      expect(json).toContain('  "id"');
      expect(json).toContain('  "title"');
    });

    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.exportAsJson('fake')).rejects.toThrow(NotFoundException);
    });

    it('personalInfo가 포함됨', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const json = await service.exportAsJson('resume-1');
      const parsed = JSON.parse(json);
      expect(parsed.personalInfo.name).toBe('홍길동');
      expect(parsed.personalInfo.email).toBe('test@test.com');
    });

    it('모든 섹션이 JSON에 포함됨', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const json = await service.exportAsJson('resume-1');
      const parsed = JSON.parse(json);
      expect(parsed.experiences).toBeDefined();
      expect(parsed.educations).toBeDefined();
      expect(parsed.skills).toBeDefined();
      expect(parsed.certifications).toBeDefined();
      expect(parsed.languages).toBeDefined();
    });
  });

  // ──────────────────────────────────────────────────
  // 텍스트 내보내기 추가 테스트
  // ──────────────────────────────────────────────────
  describe('exportAsText 추가', () => {
    it('연락처 정보가 | 로 구분됨', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('test@test.com | 010-1234-5678 | 서울시');
    });

    it('경력 섹션 헤더 포함', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('=== 경력 ===');
    });

    it('학력 섹션 포함', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('=== 학력 ===');
      expect(text).toContain('서울대');
      expect(text).toContain('학사');
    });

    it('어학 섹션 포함', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('=== 어학 ===');
      expect(text).toContain('영어 (TOEIC): 950');
    });

    it('현재 재직중인 경력 → "현재" 표시', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const text = await service.exportAsText('resume-1');
      expect(text).toContain('2020-01 ~ 현재');
    });
  });

  // ──────────────────────────────────────────────────
  // 빈 이력서 데이터
  // ──────────────────────────────────────────────────
  describe('빈 이력서 데이터', () => {
    const emptyResume = {
      id: 'empty-1',
      title: '빈 이력서',
      personalInfo: null,
      experiences: [],
      educations: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      awards: [],
      activities: [],
    };

    it('텍스트 내보내기 — 빈 이력서도 에러 없이 처리', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(emptyResume);
      const text = await service.exportAsText('empty-1');
      expect(typeof text).toBe('string');
      // 섹션 헤더 없어야 함 (데이터 없으므로)
      expect(text).not.toContain('=== 경력 ===');
      expect(text).not.toContain('=== 학력 ===');
      expect(text).not.toContain('=== 기술 ===');
    });

    it('마크다운 내보내기 — 빈 이력서도 에러 없이 처리', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(emptyResume);
      const md = await service.exportAsMarkdown('empty-1');
      expect(typeof md).toBe('string');
      expect(md).not.toContain('## 경력');
    });

    it('JSON 내보내기 — 빈 이력서도 유효한 JSON', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(emptyResume);
      const json = await service.exportAsJson('empty-1');
      const parsed = JSON.parse(json);
      expect(parsed.id).toBe('empty-1');
      expect(parsed.experiences).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────
  // Word(.docx) 내보내기
  // ──────────────────────────────────────────────────
  describe('exportAsDocx', () => {
    it('Buffer를 반환해야 함', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const buffer = await service.exportAsDocx('resume-1');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('Word 파일 헤더 매직 바이트 포함 (PK zip)', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const buffer = await service.exportAsDocx('resume-1');
      // docx는 ZIP 형식 → 첫 2바이트는 PK (0x50, 0x4B)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    });

    it('비어 있지 않은 파일 생성 (최소 1KB)', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
      const buffer = await service.exportAsDocx('resume-1');
      expect(buffer.length).toBeGreaterThan(1024);
    });

    it('존재하지 않는 이력서 → NotFoundException', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(null);
      await expect(service.exportAsDocx('fake')).rejects.toThrow(NotFoundException);
    });

    it('빈 이력서도 에러 없이 Buffer 반환', async () => {
      const emptyResume = {
        id: 'empty-2',
        title: '빈',
        personalInfo: null,
        experiences: [],
        educations: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        activities: [],
      };
      mockPrisma.resume.findUnique.mockResolvedValue(emptyResume);
      const buffer = await service.exportAsDocx('empty-2');
      expect(Buffer.isBuffer(buffer)).toBe(true);
    });

    it('한글 이름이 있는 이력서도 정상 처리', async () => {
      const koreanResume = {
        id: 'kr-docx',
        title: '홍길동 이력서',
        personalInfo: {
          name: '홍길동',
          email: 'hong@test.com',
          phone: '010-1234-5678',
          address: '서울시',
          website: '',
          github: '',
          summary: '개발자입니다',
        },
        experiences: [],
        educations: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        activities: [],
      };
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const buffer = await service.exportAsDocx('kr-docx');
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1024);
    });
  });

  // ──────────────────────────────────────────────────
  // 한글 문자 처리
  // ──────────────────────────────────────────────────
  describe('한글 문자 처리', () => {
    const koreanResume = {
      id: 'kr-1',
      title: '김철수의 이력서',
      personalInfo: {
        name: '김철수',
        email: 'chulsoo@example.com',
        phone: '010-9876-5432',
        address: '경기도 성남시 분당구',
        website: '',
        github: '',
        summary: '<p>백엔드 개발자로 5년간 근무했습니다. 대규모 트래픽 처리 경험이 있습니다.</p>',
      },
      experiences: [
        {
          company: '네이버',
          position: '시니어 백엔드 개발자',
          startDate: '2019-03',
          endDate: '',
          current: true,
          description: '<b>검색 엔진 최적화</b> 및 <i>실시간 데이터 파이프라인</i> 구축',
          sortOrder: 0,
        },
      ],
      educations: [
        {
          school: '카이스트',
          degree: '석사',
          field: '컴퓨터공학',
          startDate: '2015-03',
          endDate: '2017-02',
          sortOrder: 0,
        },
      ],
      skills: [
        { category: '백엔드', items: 'Java, Spring Boot, Kotlin', sortOrder: 0 },
        { category: '인프라', items: 'AWS, Docker, Kubernetes', sortOrder: 1 },
      ],
      projects: [],
      certifications: [
        { name: '정보처리기사', issuer: '한국산업인력공단', issueDate: '2018-06', sortOrder: 0 },
      ],
      languages: [{ name: '일본어', testName: 'JLPT', score: 'N1', sortOrder: 0 }],
      awards: [],
      activities: [],
    };

    it('텍스트 — 한글 이름 올바르게 출력', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const text = await service.exportAsText('kr-1');
      expect(text).toContain('김철수');
      expect(text).toContain('경기도 성남시 분당구');
    });

    it('텍스트 — 한글 회사명과 직책 출력', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const text = await service.exportAsText('kr-1');
      expect(text).toContain('네이버');
      expect(text).toContain('시니어 백엔드 개발자');
    });

    it('텍스트 — HTML 태그 제거 후 한글 내용 유지', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const text = await service.exportAsText('kr-1');
      expect(text).toContain('검색 엔진 최적화');
      expect(text).not.toContain('<b>');
      expect(text).not.toContain('<i>');
    });

    it('마크다운 — 한글 제목 올바르게 출력', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const md = await service.exportAsMarkdown('kr-1');
      expect(md).toContain('# 김철수');
    });

    it('마크다운 — 한글 학력 정보 출력', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const md = await service.exportAsMarkdown('kr-1');
      expect(md).toContain('### 카이스트');
      expect(md).toContain('석사 컴퓨터공학');
    });

    it('마크다운 — 복수 기술 카테고리 출력', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const md = await service.exportAsMarkdown('kr-1');
      expect(md).toContain('**백엔드**');
      expect(md).toContain('**인프라**');
    });

    it('JSON — 한글 데이터가 유니코드 이스케이프 없이 저장', async () => {
      mockPrisma.resume.findUnique.mockResolvedValue(koreanResume);
      const json = await service.exportAsJson('kr-1');
      // JSON.stringify는 한글을 그대로 유지 (유니코드 이스케이프 안 함)
      expect(json).toContain('김철수');
      expect(json).toContain('네이버');
      expect(json).not.toContain('\\u');
    });
  });
});
