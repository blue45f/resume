"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const export_service_1 = require("./export.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
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
        { company: '테스트사', position: '시니어', startDate: '2020-01', endDate: '', current: true, description: '<b>리드 개발</b>', sortOrder: 0 },
    ],
    educations: [
        { school: '서울대', degree: '학사', field: 'CS', startDate: '2014-03', endDate: '2018-02', sortOrder: 0 },
    ],
    skills: [
        { category: 'Frontend', items: 'React, TypeScript', sortOrder: 0 },
    ],
    projects: [],
    certifications: [
        { name: '정보처리기사', issuer: '한국산업인력공단', issueDate: '2020-06', sortOrder: 0 },
    ],
    languages: [
        { name: '영어', testName: 'TOEIC', score: '950', sortOrder: 0 },
    ],
    awards: [],
    activities: [],
};
const mockPrisma = {
    resume: {
        findUnique: jest.fn(),
    },
};
describe('ExportService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                export_service_1.ExportService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(export_service_1.ExportService);
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
            expect(text).not.toContain('<p>');
            expect(text).not.toContain('<b>');
        });
        it('존재하지 않는 이력서 → NotFoundException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(null);
            await expect(service.exportAsText('fake')).rejects.toThrow(common_1.NotFoundException);
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
    });
});
