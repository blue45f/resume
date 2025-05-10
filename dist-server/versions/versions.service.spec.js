"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const versions_service_1 = require("./versions.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockPrisma = {
    resumeVersion: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
    },
    resume: { update: jest.fn() },
    personalInfo: { upsert: jest.fn() },
    experience: { deleteMany: jest.fn(), createMany: jest.fn() },
    education: { deleteMany: jest.fn(), createMany: jest.fn() },
    skill: { deleteMany: jest.fn(), createMany: jest.fn() },
    project: { deleteMany: jest.fn(), createMany: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
};
const mockSnapshot = JSON.stringify({
    title: '테스트 이력서',
    personalInfo: { name: '홍길동', email: 'test@test.com', phone: '', address: '', website: '', summary: '' },
    experiences: [{ company: 'A사', position: '개발자', startDate: '2020-01-01', endDate: '', current: true, description: '개발' }],
    educations: [],
    skills: [{ category: 'FE', items: 'React' }],
    projects: [],
});
describe('VersionsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                versions_service_1.VersionsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(versions_service_1.VersionsService);
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('버전 목록 반환 (versionNumber DESC)', async () => {
            mockPrisma.resumeVersion.findMany.mockResolvedValue([
                { id: 'v2', versionNumber: 2, description: '', createdAt: new Date('2024-01-02') },
                { id: 'v1', versionNumber: 1, description: '', createdAt: new Date('2024-01-01') },
            ]);
            const result = await service.findAll('r1');
            expect(result).toHaveLength(2);
            expect(result[0].versionNumber).toBe(2);
            expect(typeof result[0].createdAt).toBe('string');
        });
        it('빈 버전 목록', async () => {
            mockPrisma.resumeVersion.findMany.mockResolvedValue([]);
            const result = await service.findAll('r1');
            expect(result).toEqual([]);
        });
    });
    describe('findOne', () => {
        it('버전 상세 조회 (snapshot 파싱)', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1', resumeId: 'r1', versionNumber: 1,
                description: '', snapshot: mockSnapshot,
                createdAt: new Date(),
            });
            const result = await service.findOne('r1', 'v1');
            expect(result.snapshot.title).toBe('테스트 이력서');
        });
        it('없는 버전 → NotFoundException', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue(null);
            await expect(service.findOne('r1', 'fake')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('restore', () => {
        it('없는 버전 복원 → NotFoundException', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue(null);
            await expect(service.restore('r1', 'fake')).rejects.toThrow(common_1.NotFoundException);
        });
        it('다른 사용자의 버전 복원 → ForbiddenException', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1', resumeId: 'r1', versionNumber: 1,
                snapshot: mockSnapshot,
                resume: { userId: 'user-1' },
            });
            await expect(service.restore('r1', 'v1', 'other-user'))
                .rejects.toThrow(common_1.ForbiddenException);
        });
        it('소유자 없는 이력서 버전은 누구나 복원 가능', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1', resumeId: 'r1', versionNumber: 1,
                snapshot: mockSnapshot,
                resume: { userId: null },
            });
            const result = await service.restore('r1', 'v1', 'any-user');
            expect(result).toEqual({ success: true, restoredVersion: 1 });
        });
        it('손상된 snapshot JSON → BadRequestException', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1', resumeId: 'r1', versionNumber: 1,
                snapshot: '{invalid json',
                resume: { userId: null },
            });
            await expect(service.restore('r1', 'v1'))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('소유자의 정상 복원', async () => {
            mockPrisma.resumeVersion.findFirst.mockResolvedValue({
                id: 'v1', resumeId: 'r1', versionNumber: 3,
                snapshot: mockSnapshot,
                resume: { userId: 'user-1' },
            });
            const result = await service.restore('r1', 'v1', 'user-1');
            expect(result).toEqual({ success: true, restoredVersion: 3 });
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });
});
