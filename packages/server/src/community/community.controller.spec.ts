import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

const mockService = {
  getPosts: jest.fn(),
  getPost: jest.fn(),
  createPost: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  toggleLike: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
  deleteComment: jest.fn(),
};

// Cloudinary 비활성 상태를 흉내내기 위해 환경변수 반환을 빈 값으로.
const mockConfig = {
  get: jest.fn().mockReturnValue(undefined),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('CommunityController', () => {
  let controller: CommunityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityController],
      providers: [
        { provide: CommunityService, useValue: mockService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    controller = module.get(CommunityController);
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('비관리자는 showHidden=true 요청해도 includeHidden=false', () => {
      controller.getPosts(
        undefined,
        undefined,
        '1',
        '20',
        'true',
        'recent',
        reqWith({ role: 'user' }),
      );
      expect(mockService.getPosts).toHaveBeenCalledWith(
        undefined,
        undefined,
        1,
        20,
        false, // admin 이 아니므로 false 로 클램프
        'recent',
      );
    });

    it('admin + showHidden=true → includeHidden=true', () => {
      controller.getPosts('free', '검색', '2', '10', 'true', 'popular', reqWith({ role: 'admin' }));
      expect(mockService.getPosts).toHaveBeenCalledWith('free', '검색', 2, 10, true, 'popular');
    });

    it('superadmin + showHidden=true → includeHidden=true', () => {
      controller.getPosts(
        undefined,
        undefined,
        '1',
        '20',
        'true',
        'recent',
        reqWith({ role: 'superadmin' }),
      );
      const callArgs = mockService.getPosts.mock.calls[0];
      expect(callArgs[4]).toBe(true);
    });

    it('admin + showHidden 미지정 → includeHidden=false', () => {
      controller.getPosts(
        undefined,
        undefined,
        '1',
        '20',
        undefined,
        'recent',
        reqWith({ role: 'admin' }),
      );
      expect(mockService.getPosts.mock.calls[0][4]).toBe(false);
    });
  });

  it('getPost: req.user?.id 전달 (조회자 식별)', () => {
    controller.getPost('p1', reqWith({ id: 'u1' }));
    expect(mockService.getPost).toHaveBeenCalledWith('p1', 'u1');
  });

  describe('create', () => {
    it('비로그인 → error 객체', () => {
      expect(controller.create({ title: 'T', content: 'C', category: 'free' }, reqWith())).toEqual({
        error: '로그인이 필요합니다',
      });
      expect(mockService.createPost).not.toHaveBeenCalled();
    });

    it('로그인 시 userId + body 위임', () => {
      controller.create({ title: 'T', content: 'C', category: 'free' }, reqWith({ id: 'u1' }));
      expect(mockService.createPost).toHaveBeenCalledWith('u1', {
        title: 'T',
        content: 'C',
        category: 'free',
      });
    });
  });

  describe('update/delete', () => {
    it('update: 비로그인 error, 로그인 시 userId + role default "user"', () => {
      expect(controller.update('p1', {}, reqWith())).toEqual({
        error: '로그인이 필요합니다',
      });
      controller.update('p1', { title: 'new' }, reqWith({ id: 'u1' }));
      expect(mockService.updatePost).toHaveBeenCalledWith('p1', 'u1', 'user', { title: 'new' });
    });

    it('delete: 비로그인 error, 로그인 시 userId + role 위임', () => {
      expect(controller.delete('p1', reqWith())).toEqual({ error: '로그인이 필요합니다' });
      controller.delete('p1', reqWith({ id: 'u1', role: 'admin' }));
      expect(mockService.deletePost).toHaveBeenCalledWith('p1', 'u1', 'admin');
    });
  });

  describe('toggleLike', () => {
    it('비로그인 error', () => {
      expect(controller.toggleLike('p1', reqWith())).toEqual({ error: '로그인이 필요합니다' });
    });

    it('로그인 시 userId 전달', () => {
      controller.toggleLike('p1', reqWith({ id: 'u1' }));
      expect(mockService.toggleLike).toHaveBeenCalledWith('p1', 'u1');
    });
  });

  describe('comments', () => {
    it('getComments 공개', () => {
      controller.getComments('p1');
      expect(mockService.getComments).toHaveBeenCalledWith('p1');
    });

    it('addComment: userId/authorName/parentId 모두 선택적', () => {
      controller.addComment(
        'p1',
        { content: '내용', authorName: '익명', parentId: 'c0' },
        reqWith({ id: 'u1' }),
      );
      expect(mockService.addComment).toHaveBeenCalledWith('p1', 'u1', '내용', '익명', 'c0');
    });

    it('deleteComment: 비로그인 error', () => {
      expect(controller.deleteComment('p1', 'c1', reqWith())).toEqual({
        error: '로그인이 필요합니다',
      });
    });

    it('deleteComment: 로그인 시 commentId + userId + role default "user"', () => {
      controller.deleteComment('p1', 'c1', reqWith({ id: 'u1' }));
      expect(mockService.deleteComment).toHaveBeenCalledWith('c1', 'u1', 'user');
    });
  });

  describe('uploadAttachment', () => {
    it('비로그인 → BadRequest', async () => {
      await expect(
        controller.uploadAttachment(
          {
            buffer: Buffer.from('x'),
            mimetype: 'image/png',
            originalname: 'a.png',
            size: 10,
          } as any,
          reqWith(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('파일 누락 → BadRequest', async () => {
      await expect(
        controller.uploadAttachment(undefined as any, reqWith({ id: 'u1' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('허용되지 않는 mimetype → BadRequest', async () => {
      await expect(
        controller.uploadAttachment(
          {
            buffer: Buffer.from('x'),
            mimetype: 'application/x-evil',
            originalname: 'x.bin',
            size: 10,
          } as any,
          reqWith({ id: 'u1' }),
        ),
      ).rejects.toThrow(/허용되지 않는 파일 형식/);
    });

    it('Cloudinary 없으면 data URL fallback', async () => {
      const file = {
        buffer: Buffer.from('hello'),
        mimetype: 'image/png',
        originalname: 'a.png',
        size: 5,
      } as any;
      const res = await controller.uploadAttachment(file, reqWith({ id: 'u1' }));
      expect(res.url.startsWith('data:image/png;base64,')).toBe(true);
      expect(res.name).toBe('a.png');
      expect(res.size).toBe(5);
      expect(res.type).toBe('image/png');
    });
  });
});
