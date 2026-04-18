import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockService = {
  getAll: jest.fn(),
  getUnread: jest.fn(),
  getUnreadCount: jest.fn(),
  markAsRead: jest.fn(),
  deleteOne: jest.fn(),
  deleteBulk: jest.fn(),
  cleanupOld: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('NotificationsController', () => {
  let controller: NotificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: mockService }],
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
});
