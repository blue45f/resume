"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const applications_service_1 = require("./applications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const mockApp = {
    id: 'app-1',
    userId: 'user-1',
    company: '네이버',
    position: '프론트엔드',
    status: 'applied',
    url: 'https://example.com',
    notes: '메모',
    salary: '5000만원',
    location: '서울',
    createdAt: new Date(),
    updatedAt: new Date(),
};
const mockPrisma = {
    jobApplication: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};
describe('ApplicationsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                applications_service_1.ApplicationsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(applications_service_1.ApplicationsService);
        jest.clearAllMocks();
    });
    describe('findAll', () => {
        it('사용자의 지원 내역 목록 반환', async () => {
            mockPrisma.jobApplication.findMany.mockResolvedValue([mockApp]);
            const result = await service.findAll('user-1');
            expect(result).toHaveLength(1);
            expect(result[0].company).toBe('네이버');
        });
    });
    describe('getStats', () => {
        it('상태별 통계 반환', async () => {
            mockPrisma.jobApplication.findMany.mockResolvedValue([
                { ...mockApp, status: 'applied' },
                { ...mockApp, id: 'app-2', status: 'applied' },
                { ...mockApp, id: 'app-3', status: 'interview' },
            ]);
            const result = await service.getStats('user-1');
            expect(result.total).toBe(3);
            expect(result.byStatus.applied).toBe(2);
            expect(result.byStatus.interview).toBe(1);
        });
    });
    describe('create', () => {
        it('지원 내역 생성', async () => {
            mockPrisma.jobApplication.create.mockResolvedValue(mockApp);
            const result = await service.create({ company: '네이버', position: '프론트엔드' }, 'user-1');
            expect(result.company).toBe('네이버');
            expect(mockPrisma.jobApplication.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) }));
        });
    });
    describe('update', () => {
        it('소유자의 지원 내역 수정', async () => {
            mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);
            mockPrisma.jobApplication.update.mockResolvedValue({ ...mockApp, status: 'interview' });
            const result = await service.update('app-1', { status: 'interview' }, 'user-1');
            expect(result.status).toBe('interview');
        });
        it('존재하지 않는 지원 내역 → NotFoundException', async () => {
            mockPrisma.jobApplication.findUnique.mockResolvedValue(null);
            await expect(service.update('fake', { status: 'x' }, 'user-1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('다른 사용자 → ForbiddenException', async () => {
            mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);
            await expect(service.update('app-1', { status: 'x' }, 'other')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('remove', () => {
        it('소유자의 지원 내역 삭제', async () => {
            mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);
            mockPrisma.jobApplication.delete.mockResolvedValue(mockApp);
            const result = await service.remove('app-1', 'user-1');
            expect(result).toEqual({ success: true });
        });
        it('다른 사용자 → ForbiddenException', async () => {
            mockPrisma.jobApplication.findUnique.mockResolvedValue(mockApp);
            await expect(service.remove('app-1', 'other')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
