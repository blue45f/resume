"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _notificationsservice = require("./notifications.service");
const _prismaservice = require("../prisma/prisma.service");
const mockNotification = {
    id: 'n1',
    userId: 'user-1',
    type: 'comment',
    message: '새 댓글이 달렸습니다',
    link: '/resumes/r1',
    read: false,
    createdAt: new Date()
};
const mockPrisma = {
    notification: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn()
    }
};
describe('NotificationsService', ()=>{
    let service;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _notificationsservice.NotificationsService,
                {
                    provide: _prismaservice.PrismaService,
                    useValue: mockPrisma
                }
            ]
        }).compile();
        service = module.get(_notificationsservice.NotificationsService);
        jest.clearAllMocks();
    });
    // ──────────────────────────────────────────────────
    // create
    // ──────────────────────────────────────────────────
    describe('create', ()=>{
        it('알림 생성 성공', async ()=>{
            mockPrisma.notification.create.mockResolvedValue(mockNotification);
            const result = await service.create('user-1', 'comment', '새 댓글이 달렸습니다', '/resumes/r1');
            expect(result.id).toBe('n1');
            expect(result.message).toBe('새 댓글이 달렸습니다');
        });
        it('userId, type, message, link가 올바르게 전달', async ()=>{
            mockPrisma.notification.create.mockResolvedValue(mockNotification);
            await service.create('user-1', 'scout', '스카우트 제안', '/scouts');
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    type: 'scout',
                    message: '스카우트 제안',
                    link: '/scouts'
                }
            });
        });
        it('link 없이 알림 생성', async ()=>{
            mockPrisma.notification.create.mockResolvedValue({
                ...mockNotification,
                link: undefined
            });
            await service.create('user-1', 'system', '시스템 알림');
            expect(mockPrisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user-1',
                    type: 'system',
                    message: '시스템 알림',
                    link: undefined
                }
            });
        });
    });
    // ──────────────────────────────────────────────────
    // getUnread
    // ──────────────────────────────────────────────────
    describe('getUnread', ()=>{
        it('읽지 않은 알림 목록 반환', async ()=>{
            mockPrisma.notification.findMany.mockResolvedValue([
                mockNotification
            ]);
            const result = await service.getUnread('user-1');
            expect(result).toHaveLength(1);
            expect(result[0].read).toBe(false);
        });
        it('read: false 조건으로 조회하고 최대 20개', async ()=>{
            mockPrisma.notification.findMany.mockResolvedValue([]);
            await service.getUnread('user-1');
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    read: false
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 20
            });
        });
        it('읽지 않은 알림이 없으면 빈 배열', async ()=>{
            mockPrisma.notification.findMany.mockResolvedValue([]);
            const result = await service.getUnread('user-1');
            expect(result).toEqual([]);
        });
    });
    // ──────────────────────────────────────────────────
    // getAll
    // ──────────────────────────────────────────────────
    describe('getAll', ()=>{
        it('모든 알림 목록 반환 (읽음/미읽음 포함)', async ()=>{
            const readNotification = {
                ...mockNotification,
                id: 'n2',
                read: true
            };
            mockPrisma.notification.findMany.mockResolvedValue([
                mockNotification,
                readNotification
            ]);
            const result = await service.getAll('user-1');
            expect(result).toHaveLength(2);
        });
        it('userId로만 필터링하고 최대 50개', async ()=>{
            mockPrisma.notification.findMany.mockResolvedValue([]);
            await service.getAll('user-1');
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1'
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 50
            });
        });
    });
    // ──────────────────────────────────────────────────
    // markAsRead
    // ──────────────────────────────────────────────────
    describe('markAsRead', ()=>{
        it('특정 알림 읽음 처리', async ()=>{
            mockPrisma.notification.updateMany.mockResolvedValue({
                count: 1
            });
            const result = await service.markAsRead('user-1', 'n1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    id: 'n1',
                    userId: 'user-1'
                },
                data: {
                    read: true
                }
            });
        });
        it('모든 알림 읽음 처리 (notificationId 없이)', async ()=>{
            mockPrisma.notification.updateMany.mockResolvedValue({
                count: 5
            });
            const result = await service.markAsRead('user-1');
            expect(result).toEqual({
                success: true
            });
            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    read: false
                },
                data: {
                    read: true
                }
            });
        });
        it('notificationId=undefined일 때 모든 미읽은 알림 처리', async ()=>{
            mockPrisma.notification.updateMany.mockResolvedValue({
                count: 0
            });
            await service.markAsRead('user-1', undefined);
            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    read: false
                },
                data: {
                    read: true
                }
            });
        });
        it('이미 읽은 알림도 에러 없이 성공 반환', async ()=>{
            mockPrisma.notification.updateMany.mockResolvedValue({
                count: 0
            });
            const result = await service.markAsRead('user-1', 'already-read');
            expect(result).toEqual({
                success: true
            });
        });
    });
    // ──────────────────────────────────────────────────
    // getUnreadCount
    // ──────────────────────────────────────────────────
    describe('getUnreadCount', ()=>{
        it('읽지 않은 알림 수 반환', async ()=>{
            mockPrisma.notification.count.mockResolvedValue(5);
            const count = await service.getUnreadCount('user-1');
            expect(count).toBe(5);
            expect(mockPrisma.notification.count).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    read: false
                }
            });
        });
        it('읽지 않은 알림이 없으면 0', async ()=>{
            mockPrisma.notification.count.mockResolvedValue(0);
            const count = await service.getUnreadCount('user-1');
            expect(count).toBe(0);
        });
    });
    // ──────────────────────────────────────────────────
    // cleanupOld
    // ──────────────────────────────────────────────────
    describe('cleanupOld', ()=>{
        it('30일 이상 읽은 알림 삭제', async ()=>{
            mockPrisma.notification.deleteMany.mockResolvedValue({
                count: 10
            });
            const result = await service.cleanupOld();
            expect(result).toEqual({
                deleted: 10
            });
            expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
                where: {
                    read: true,
                    createdAt: {
                        lt: expect.any(Date)
                    }
                }
            });
        });
        it('삭제할 알림이 없으면 deleted: 0', async ()=>{
            mockPrisma.notification.deleteMany.mockResolvedValue({
                count: 0
            });
            const result = await service.cleanupOld();
            expect(result).toEqual({
                deleted: 0
            });
        });
        it('읽지 않은 알림은 삭제하지 않음 (read: true 조건)', async ()=>{
            mockPrisma.notification.deleteMany.mockResolvedValue({
                count: 3
            });
            await service.cleanupOld();
            expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    read: true
                })
            }));
        });
    });
    describe('deleteOne', ()=>{
        it('특정 알림 삭제', async ()=>{
            mockPrisma.notification.deleteMany.mockResolvedValue({
                count: 1
            });
            const result = await service.deleteOne('user-1', 'n1');
            expect(result.success).toBe(true);
            expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({
                where: {
                    id: 'n1',
                    userId: 'user-1'
                }
            });
        });
    });
    describe('deleteBulk', ()=>{
        it('여러 알림 일괄 삭제', async ()=>{
            mockPrisma.notification.deleteMany.mockResolvedValue({
                count: 3
            });
            const result = await service.deleteBulk('user-1', [
                'n1',
                'n2',
                'n3'
            ]);
            expect(result.success).toBe(true);
            expect(result.deleted).toBe(3);
        });
    });
});
