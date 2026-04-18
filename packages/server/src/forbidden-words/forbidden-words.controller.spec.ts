import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenWordsController } from './forbidden-words.controller';
import { ForbiddenWordsService } from './forbidden-words.service';

const mockService = {
  findAll: jest.fn(),
  getStats: jest.fn(),
  getCategories: jest.fn(),
  checkContent: jest.fn(),
  create: jest.fn(),
  createBulk: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  removeBulk: jest.fn(),
};

const reqWith = (role?: string, id?: string): any => ({
  user: role || id ? { id: id ?? 'u1', role } : undefined,
});

describe('ForbiddenWordsController', () => {
  let controller: ForbiddenWordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForbiddenWordsController],
      providers: [{ provide: ForbiddenWordsService, useValue: mockService }],
    }).compile();
    controller = module.get(ForbiddenWordsController);
    jest.clearAllMocks();
  });

  describe('비관리자 fallback', () => {
    it('findAll → { items: [], total: 0 }', () => {
      expect(controller.findAll(undefined, undefined, '1', '50', reqWith('user'))).toEqual({
        items: [],
        total: 0,
      });
      expect(mockService.findAll).not.toHaveBeenCalled();
    });

    it('getStats → {}', () => {
      expect(controller.getStats(reqWith('user'))).toEqual({});
    });

    it('getCategories → []', () => {
      expect(controller.getCategories(reqWith('user'))).toEqual([]);
    });

    it('create → error 객체', () => {
      expect(controller.create({ word: 'x' }, reqWith('user'))).toEqual({
        error: '권한이 없습니다',
      });
    });

    it('createBulk → error 객체', () => {
      expect(controller.createBulk({ words: ['x'] }, reqWith('user'))).toEqual({
        error: '권한이 없습니다',
      });
    });

    it('update → error 객체', () => {
      expect(controller.update('w1', { word: 'x' }, reqWith('user'))).toEqual({
        error: '권한이 없습니다',
      });
    });

    it('remove → error 객체', () => {
      expect(controller.remove('w1', reqWith('user'))).toEqual({ error: '권한이 없습니다' });
    });

    it('removeBulk → error 객체', () => {
      expect(controller.removeBulk({ ids: ['w1'] }, reqWith('user'))).toEqual({
        error: '권한이 없습니다',
      });
    });
  });

  it('check: 공개 엔드포인트 — 권한 체크 없이 호출', () => {
    controller.check({ text: '이상한 문구' });
    expect(mockService.checkContent).toHaveBeenCalledWith('이상한 문구');
  });

  describe('admin 통과', () => {
    it('findAll: 쿼리 정수 파싱', () => {
      controller.findAll('욕설', '바보', '2', '10', reqWith('admin'));
      expect(mockService.findAll).toHaveBeenCalledWith('욕설', '바보', 2, 10);
    });

    it('create: 기본 category=general, severity=block', () => {
      controller.create({ word: 'xxx' }, reqWith('admin', 'admin-u'));
      expect(mockService.create).toHaveBeenCalledWith('xxx', 'general', 'block', 'admin-u');
    });

    it('create: 사용자 지정 category/severity 전달', () => {
      controller.create(
        { word: 'yyy', category: 'sexual', severity: 'mask' },
        reqWith('admin', 'admin-u'),
      );
      expect(mockService.create).toHaveBeenCalledWith('yyy', 'sexual', 'mask', 'admin-u');
    });

    it('createBulk: words 배열 + 기본값', () => {
      controller.createBulk({ words: ['a', 'b'] }, reqWith('admin', 'admin-u'));
      expect(mockService.createBulk).toHaveBeenCalledWith(
        ['a', 'b'],
        'general',
        'block',
        'admin-u',
      );
    });

    it('superadmin 도 통과', () => {
      controller.update('w1', { isActive: false }, reqWith('superadmin'));
      expect(mockService.update).toHaveBeenCalledWith('w1', { isActive: false });
    });

    it('removeBulk: ids 전달', () => {
      controller.removeBulk({ ids: ['w1', 'w2'] }, reqWith('admin'));
      expect(mockService.removeBulk).toHaveBeenCalledWith(['w1', 'w2']);
    });
  });
});
