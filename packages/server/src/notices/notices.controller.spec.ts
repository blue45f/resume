import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

const mockService = {
  getPopup: jest.fn(),
  getAll: jest.fn(),
  getOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
  toggleComments: jest.fn(),
  getHistory: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('NoticesController', () => {
  let controller: NoticesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticesController],
      providers: [{ provide: NoticesService, useValue: mockService }],
    }).compile();
    controller = module.get(NoticesController);
    jest.clearAllMocks();
  });

  it('getPopup: 서비스 호출', () => {
    controller.getPopup();
    expect(mockService.getPopup).toHaveBeenCalled();
  });

  it('getAll: query 파라미터 정수 파싱 (기본 page=1, limit=10)', () => {
    controller.getAll('GENERAL', '2', '20');
    expect(mockService.getAll).toHaveBeenCalledWith('GENERAL', 2, 20);
  });

  it('getAll: 기본값 사용', () => {
    controller.getAll();
    expect(mockService.getAll).toHaveBeenCalledWith(undefined, 1, 10);
  });

  it('getOne: id 위임', () => {
    controller.getOne('n1');
    expect(mockService.getOne).toHaveBeenCalledWith('n1');
  });

  describe('create (admin-only)', () => {
    it('일반 유저 → Forbidden', () => {
      expect(() => controller.create(reqWith({ id: 'u1', role: 'user' }), {})).toThrow(
        ForbiddenException,
      );
    });

    it('admin 허용', () => {
      controller.create(reqWith({ id: 'admin-u', role: 'admin' }), { title: 'T' });
      expect(mockService.create).toHaveBeenCalledWith({ title: 'T' }, 'admin-u');
    });

    it('superadmin 허용', () => {
      controller.create(reqWith({ id: 'su', role: 'superadmin' }), { title: 'T' });
      expect(mockService.create).toHaveBeenCalled();
    });
  });

  describe('update (admin-only)', () => {
    it('일반 유저 → Forbidden', () => {
      expect(() => controller.update(reqWith({ role: 'user' }), 'n1', {})).toThrow(
        ForbiddenException,
      );
    });

    it('admin 호출 시 reason 을 data 에서 분리해 editorId 와 함께 전달', () => {
      controller.update(reqWith({ id: 'admin-u', role: 'admin' }), 'n1', {
        title: 'T',
        reason: '오타 수정',
      });
      expect(mockService.update).toHaveBeenCalledWith('n1', { title: 'T' }, 'admin-u', '오타 수정');
    });
  });

  it('remove: 일반 유저 → Forbidden', () => {
    expect(() => controller.remove(reqWith({ role: 'user' }), 'n1')).toThrow(ForbiddenException);
  });

  it('remove: admin 허용', () => {
    controller.remove(reqWith({ id: 'admin-u', role: 'admin' }), 'n1');
    expect(mockService.remove).toHaveBeenCalledWith('n1');
  });

  describe('addComment', () => {
    it('비로그인 → Forbidden', () => {
      expect(() => controller.addComment(reqWith(), 'n1', { content: 'hi' })).toThrow(
        ForbiddenException,
      );
    });

    it('로그인 유저 허용', () => {
      controller.addComment(reqWith({ id: 'u1' }), 'n1', { content: '좋아요' });
      expect(mockService.addComment).toHaveBeenCalledWith('n1', 'u1', '좋아요');
    });
  });

  describe('deleteComment', () => {
    it('비로그인 → Forbidden', () => {
      expect(() => controller.deleteComment(reqWith(), 'n1', 'c1')).toThrow(ForbiddenException);
    });

    it('로그인 유저: userId + role 전달', () => {
      controller.deleteComment(reqWith({ id: 'u1', role: 'user' }), 'n1', 'c1');
      expect(mockService.deleteComment).toHaveBeenCalledWith('c1', 'u1', 'user');
    });
  });

  it('toggleComments: 일반 유저 → Forbidden', () => {
    expect(() =>
      controller.toggleComments(reqWith({ role: 'user' }), 'n1', { allow: false }),
    ).toThrow(ForbiddenException);
  });

  it('toggleComments: admin 허용', () => {
    controller.toggleComments(reqWith({ role: 'admin' }), 'n1', { allow: false });
    expect(mockService.toggleComments).toHaveBeenCalledWith('n1', false);
  });

  it('getHistory: admin 전용', () => {
    expect(() => controller.getHistory(reqWith({ role: 'user' }), 'n1')).toThrow(
      ForbiddenException,
    );
    controller.getHistory(reqWith({ role: 'admin' }), 'n1');
    expect(mockService.getHistory).toHaveBeenCalledWith('n1');
  });
});
