import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  it('읽지 않은 알림 목록 반환', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1', message: '테스트' }]);
    const result = await service.getUnread('user-1');
    expect(result).toHaveLength(1);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', read: false } }),
    );
  });

  it('알림 생성', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: 'n1', message: '새 알림' });
    const result = await service.create('user-1', 'comment', '새 알림', '/link');
    expect(result.id).toBe('n1');
  });

  it('모든 알림 읽음 처리', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });
    await service.markAsRead('user-1');
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', read: false } }),
    );
  });

  it('읽지 않은 알림 수', async () => {
    mockPrisma.notification.count.mockResolvedValue(5);
    const count = await service.getUnreadCount('user-1');
    expect(count).toBe(5);
  });

  it('오래된 알림 정리', async () => {
    mockPrisma.notification.deleteMany.mockResolvedValue({ count: 10 });
    const result = await service.cleanupOld();
    expect(result.deleted).toBe(10);
  });
});
