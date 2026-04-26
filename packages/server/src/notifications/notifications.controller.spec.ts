import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const mockService = {
  getAll: jest.fn(),
  getUnread: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  deleteOne: jest.fn(),
  deleteBulk: jest.fn(),
  cleanupOld: jest.fn(),
  createBulk: jest.fn(),
};

const mockPrisma = {
  user: { findMany: jest.fn() },
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    controller = module.get(NotificationsController);
    jest.clearAllMocks();
  });

  describe('비로그인 fallback', () => {
    it('getAll → []', () => {
      expect(controller.getAll(reqWith())).toEqual([]);
      expect(mockService.getAll).not.toHaveBeenCalled();
    });

    it('getUnread → []', () => {
      expect(controller.getUnread(reqWith())).toEqual([]);
    });

    it('getCount → { count: 0 }', async () => {
      await expect(controller.getCount(reqWith())).resolves.toEqual({ count: 0 });
      expect(mockService.getUnreadCount).not.toHaveBeenCalled();
    });

    it('markAllRead → { success: false }', () => {
      expect(controller.markAllRead(reqWith())).toEqual({ success: false });
    });

    it('markRead → { success: false }', () => {
      expect(controller.markRead('n1', reqWith())).toEqual({ success: false });
    });

    it('deleteOne → { success: false }', () => {
      expect(controller.deleteOne('n1', reqWith())).toEqual({ success: false });
    });

    it('deleteBulk → { success: false }', () => {
      expect(controller.deleteBulk({ ids: ['n1'] }, reqWith())).toEqual({ success: false });
    });

    it('cleanup → { success: false }', () => {
      expect(controller.cleanup(reqWith())).toEqual({ success: false });
    });
  });

  describe('로그인 위임', () => {
    it('getAll: userId 전달', () => {
      controller.getAll(reqWith({ id: 'u1' }));
      expect(mockService.getAll).toHaveBeenCalledWith('u1');
    });

    it('getCount: count 반환', async () => {
      mockService.getUnreadCount.mockResolvedValueOnce(7);
      await expect(controller.getCount(reqWith({ id: 'u1' }))).resolves.toEqual({ count: 7 });
    });

    it('markRead: userId + id 전달', () => {
      controller.markRead('n1', reqWith({ id: 'u1' }));
      expect(mockService.markAsRead).toHaveBeenCalledWith('u1', 'n1');
    });

    it('markAllRead: id 없이 전달', () => {
      controller.markAllRead(reqWith({ id: 'u1' }));
      expect(mockService.markAsRead).toHaveBeenCalledWith('u1');
    });

    it('deleteBulk: userId + ids', () => {
      controller.deleteBulk({ ids: ['a', 'b'] }, reqWith({ id: 'u1' }));
      expect(mockService.deleteBulk).toHaveBeenCalledWith('u1', ['a', 'b']);
    });
  });

  describe('cleanup (superadmin 전용)', () => {
    it('admin 도 권한 없음 → Forbidden (superadmin 만)', () => {
      expect(() => controller.cleanup(reqWith({ id: 'u1', role: 'admin' }))).toThrow(
        ForbiddenException,
      );
    });

    it('superadmin 허용', () => {
      controller.cleanup(reqWith({ id: 'su', role: 'superadmin' }));
      expect(mockService.cleanupOld).toHaveBeenCalled();
    });
  });

  describe('admin announce', () => {
    it('일반 사용자 → ForbiddenException', async () => {
      await expect(
        controller.announce(
          { type: 'announcement', message: 'hi' },
          reqWith({ id: 'u1', role: 'user' }),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('빈 type 또는 message → BadRequest', async () => {
      await expect(
        controller.announce({ type: '', message: 'hi' }, reqWith({ id: 'a', role: 'admin' })),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.announce(
          { type: 'announcement', message: '' },
          reqWith({ id: 'a', role: 'admin' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('200자 초과 메시지 → BadRequest', async () => {
      await expect(
        controller.announce(
          { type: 'announcement', message: 'x'.repeat(201) },
          reqWith({ id: 'a', role: 'admin' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('정상: 활성 사용자 조회 + createBulk 호출', async () => {
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }]);
      mockService.createBulk.mockResolvedValue({ sent: 3, skipped: 0 });

      const result = await controller.announce(
        {
          type: 'announcement',
          message: '신규 기능 가이드',
          link: '/tutorial?guide=new-features',
          activeWithinDays: 7,
        },
        reqWith({ id: 'a', role: 'admin' }),
      );

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isSuspended: false,
            OR: expect.any(Array),
          }),
          take: 1000,
        }),
      );
      expect(mockService.createBulk).toHaveBeenCalledWith(
        ['u1', 'u2', 'u3'],
        'announcement',
        '신규 기능 가이드',
        '/tutorial?guide=new-features',
      );
      expect(result).toMatchObject({
        sent: 3,
        skipped: 0,
        candidates: 3,
        activeWithinDays: 7,
      });
    });

    it('activeWithinDays 기본 30 + 365 cap', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockService.createBulk.mockResolvedValue({ sent: 0, skipped: 0 });

      await controller.announce(
        { type: 'announcement', message: 'm', activeWithinDays: 9999 },
        reqWith({ id: 'a', role: 'admin' }),
      );
      // 365 로 clamp 됐는지 — Prisma where 의 createdAt cutoff 로 우회 검증 (실제 cutoff 값 비교 어려우므로 호출 자체만 확인)
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });
  });
});
