import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException } from '@nestjs/common';

const mockPrisma = {
  follow: { create: jest.fn(), deleteMany: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  scoutMessage: { create: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  directMessage: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), updateMany: jest.fn() },
  user: { findUnique: jest.fn() },
};

describe('SocialService', () => {
  let service: SocialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialService, { provide: PrismaService, useValue: mockPrisma }, { provide: NotificationsService, useValue: { create: jest.fn() } }],
    }).compile();
    service = module.get(SocialService);
    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('팔로우 성공', async () => {
      mockPrisma.follow.create.mockResolvedValue({});
      const result = await service.follow('user-1', 'user-2');
      expect(result.followed).toBe(true);
    });

    it('자신을 팔로우 → ForbiddenException', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unfollow', () => {
    it('언팔로우 성공', async () => {
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 1 });
      const result = await service.unfollow('user-1', 'user-2');
      expect(result.followed).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('메시지 전송 성공', async () => {
      mockPrisma.directMessage.create.mockResolvedValue({ id: 'dm-1', content: '안녕하세요' });
      const result = await service.sendMessage('user-1', 'user-2', '안녕하세요');
      expect(result.id).toBe('dm-1');
    });

    it('자신에게 메시지 → ForbiddenException', async () => {
      await expect(service.sendMessage('user-1', 'user-1', '테스트')).rejects.toThrow(ForbiddenException);
    });

    it('빈 메시지 → ForbiddenException', async () => {
      await expect(service.sendMessage('user-1', 'user-2', '')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUnreadMessageCount', () => {
    it('읽지 않은 메시지 수 반환', async () => {
      mockPrisma.directMessage.count.mockResolvedValue(5);
      const count = await service.getUnreadMessageCount('user-1');
      expect(count).toBe(5);
    });
  });
});
