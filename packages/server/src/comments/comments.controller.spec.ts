import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

const mockService = {
  findByResume: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('CommentsController', () => {
  let controller: CommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: mockService }],
    }).compile();
    controller = module.get(CommentsController);
    jest.clearAllMocks();
  });

  it('findAll (public): resumeId 전달', () => {
    controller.findAll('r1');
    expect(mockService.findByResume).toHaveBeenCalledWith('r1');
  });

  describe('create', () => {
    it('로그인 유저 + 모든 dto 필드 전달', () => {
      controller.create(
        'r1',
        { content: '좋네요', authorName: '익명', parentId: 'c0' } as any,
        reqWith({ id: 'u1' }),
      );
      expect(mockService.create).toHaveBeenCalledWith('r1', '좋네요', 'u1', '익명', 'c0');
    });

    it('비로그인 (익명) — userId undefined 로 위임', () => {
      controller.create('r1', { content: 'hi', authorName: '비회원' } as any, reqWith());
      expect(mockService.create).toHaveBeenCalledWith('r1', 'hi', undefined, '비회원', undefined);
    });
  });

  it('remove: userId + role 전달 (서비스에서 권한 판정)', () => {
    controller.remove('c1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockService.remove).toHaveBeenCalledWith('c1', 'u1', 'admin');
  });
});
