"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const comments_service_1 = require("./comments.service");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const common_1 = require("@nestjs/common");
const mockPrisma = {
    resume: { findUnique: jest.fn() },
    comment: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
    user: { findUnique: jest.fn() },
};
const mockNotifications = {
    create: jest.fn(),
};
describe('CommentsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                comments_service_1.CommentsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: notifications_service_1.NotificationsService, useValue: mockNotifications },
            ],
        }).compile();
        service = module.get(comments_service_1.CommentsService);
        jest.clearAllMocks();
    });
    describe('findByResume', () => {
        it('공개 이력서의 댓글 목록 반환', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', visibility: 'public' });
            mockPrisma.comment.findMany.mockResolvedValue([{ id: 'c1', content: '좋아요' }]);
            const result = await service.findByResume('r1');
            expect(result).toHaveLength(1);
        });
        it('비공개 이력서 → NotFoundException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', visibility: 'private' });
            await expect(service.findByResume('r1')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('create', () => {
        it('공개 이력서에 댓글 생성', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', visibility: 'public' });
            mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', name: '홍길동', email: '' });
            mockPrisma.comment.create.mockResolvedValue({ id: 'c1', content: '좋은 이력서입니다' });
            const result = await service.create('r1', '좋은 이력서입니다', 'u1');
            expect(result.id).toBe('c1');
        });
        it('5자 미만 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', visibility: 'public' });
            await expect(service.create('r1', '짧음')).rejects.toThrow(common_1.ForbiddenException);
        });
        it('500자 초과 → ForbiddenException', async () => {
            mockPrisma.resume.findUnique.mockResolvedValue({ id: 'r1', visibility: 'public' });
            await expect(service.create('r1', 'a'.repeat(501))).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('remove', () => {
        it('작성자가 삭제', async () => {
            mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' });
            mockPrisma.comment.delete.mockResolvedValue({});
            const result = await service.remove('c1', 'u1');
            expect(result).toEqual({ success: true });
        });
        it('다른 사용자 → ForbiddenException', async () => {
            mockPrisma.comment.findUnique.mockResolvedValue({ id: 'c1', userId: 'u1' });
            await expect(service.remove('c1', 'u2')).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
