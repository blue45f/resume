"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const resumes_service_1 = require("./resumes.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockResume = {
    id: 'resume-1',
    title: '테스트 이력서',
    visibility: 'private',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    personalInfo: { name: '홍길동', email: 'test@test.com', phone: '', address: '', website: '', summary: '' },
    experiences: [],
    educations: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: [],
    activities: [],
    tags: [],
};
const mockPrisma = {
    resume: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
    },
    personalInfo: { upsert: jest.fn() },
    experience: { deleteMany: jest.fn(), createMany: jest.fn() },
    education: { deleteMany: jest.fn(), createMany: jest.fn() },
    skill: { deleteMany: jest.fn(), createMany: jest.fn() },
    project: { deleteMany: jest.fn(), createMany: jest.fn() },
    certification: { deleteMany: jest.fn(), createMany: jest.fn() },
    language: { deleteMany: jest.fn(), createMany: jest.fn() },
    award: { deleteMany: jest.fn(), createMany: jest.fn() },
    activity: { deleteMany: jest.fn(), createMany: jest.fn() },
    resumeVersion: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
};
describe('ResumesService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                resumes_service_1.ResumesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(resumes_service_1.ResumesService);
        jest.clearAllMocks();
    });
    describe('findOne', () => {
        it('존재하지 않는 이력서 → NotFoundException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(null);
            await expect(service.findOne('fake-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('비공개 이력서 - 소유자가 아닌 사용자 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            await expect(service.findOne('resume-1', 'other-user')).rejects.toThrow(common_1.ForbiddenException);
        });
        it('비공개 이력서 - 소유자 접근 → 성공', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            const result = await service.findOne('resume-1', 'user-1');
            expect(result.id).toBe('resume-1');
            expect(result.title).toBe('테스트 이력서');
        });
        it('공개 이력서 - 누구나 접근 가능', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ ...mockResume, visibility: 'public' });
            const result = await service.findOne('resume-1', 'other-user');
            expect(result.id).toBe('resume-1');
        });
        it('소유자 없는 이력서 - 누구나 접근 가능', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ ...mockResume, userId: null });
            const result = await service.findOne('resume-1', 'any-user');
            expect(result.id).toBe('resume-1');
        });
    });
    describe('update - 소유권 검증', () => {
        it('다른 사용자의 이력서 수정 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            await expect(service.update('resume-1', { title: 'hack' }, 'other-user'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('존재하지 않는 이력서 수정 → NotFoundException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(null);
            await expect(service.update('fake', { title: 'x' }, 'user-1'))
                .rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('remove - 소유권 검증', () => {
        it('다른 사용자의 이력서 삭제 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            await expect(service.remove('resume-1', 'other-user'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('소유자의 이력서 삭제 → 성공', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            mockPrisma.resume.delete.mockResolvedValue(mockResume);
            const result = await service.remove('resume-1', 'user-1');
            expect(result).toEqual({ success: true });
        });
    });
    describe('setVisibility - 소유권 검증', () => {
        it('다른 사용자가 공개 설정 변경 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue(mockResume);
            await expect(service.setVisibility('resume-1', 'public', 'other-user'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('잘못된 visibility 값 → NotFoundException', async () => {
            await expect(service.setVisibility('resume-1', 'invalid', 'user-1'))
                .rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('findAll', () => {
        it('userId로 필터링된 목록 반환', async () => {
            mockPrisma.resume.findMany.mockResolvedValue([mockResume]);
            mockPrisma.resume.count.mockResolvedValue(1);
            const result = await service.findAll('user-1');
            expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
            expect(result.data).toHaveLength(1);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
        });
        it('userId 없으면 전체 목록', async () => {
            mockPrisma.resume.findMany.mockResolvedValue([]);
            mockPrisma.resume.count.mockResolvedValue(0);
            await service.findAll();
            expect(mockPrisma.resume.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
        });
    });
    describe('searchPublic', () => {
        it('검색어 + 태그 필터', async () => {
            mockPrisma.resume.findMany.mockResolvedValue([]);
            mockPrisma.resume.count.mockResolvedValue(0);
            const result = await service.searchPublic({ query: '개발자', tag: 'FE', page: 1, limit: 20 });
            expect(result.data).toEqual([]);
            expect(result.total).toBe(0);
            expect(result.page).toBe(1);
        });
    });
});
