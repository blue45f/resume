import { Test, TestingModule } from '@nestjs/testing';
import { CommunityAdminController } from './community-admin.controller';
import { CommunityService } from './community.service';

const mockService = {
  adminList: jest.fn(),
  adminToggleHide: jest.fn(),
  adminTogglePin: jest.fn(),
  adminChangeCategory: jest.fn(),
  adminDelete: jest.fn(),
  adminBulk: jest.fn(),
};

describe('CommunityAdminController', () => {
  let controller: CommunityAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunityAdminController],
      providers: [{ provide: CommunityService, useValue: mockService }],
    }).compile();
    controller = module.get(CommunityAdminController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('쿼리 문자열을 정수로 파싱하고 기본값 적용', () => {
      controller.list();
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: undefined,
        category: undefined,
        hidden: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('page/limit 문자열 → 정수', () => {
      controller.list('검색', 'free', 'true', '3', '50');
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: '검색',
        category: 'free',
        hidden: 'true',
        page: 3,
        limit: 50,
      });
    });
  });

  describe('hide', () => {
    it('isHidden boolean 값 전달', () => {
      controller.hide('p1', { isHidden: true });
      expect(mockService.adminToggleHide).toHaveBeenCalledWith('p1', true);
    });

    it('body 미지정 시 undefined 전달', () => {
      controller.hide('p1', {} as any);
      expect(mockService.adminToggleHide).toHaveBeenCalledWith('p1', undefined);
    });
  });

  it('pin: isPinned 값 전달', () => {
    controller.pin('p1', { isPinned: true });
    expect(mockService.adminTogglePin).toHaveBeenCalledWith('p1', true);
  });

  it('category: 카테고리 변경 위임', () => {
    controller.category('p1', { category: 'notice' });
    expect(mockService.adminChangeCategory).toHaveBeenCalledWith('p1', 'notice');
  });

  it('remove: 삭제 위임', () => {
    controller.remove('p1');
    expect(mockService.adminDelete).toHaveBeenCalledWith('p1');
  });

  describe('bulk', () => {
    it('ids 배열 + action 전달', () => {
      controller.bulk({ action: 'hide', ids: ['a', 'b', 'c'] });
      expect(mockService.adminBulk).toHaveBeenCalledWith('hide', ['a', 'b', 'c']);
    });

    it('ids 미지정 시 빈 배열로 fallback', () => {
      controller.bulk({ action: 'delete' } as any);
      expect(mockService.adminBulk).toHaveBeenCalledWith('delete', []);
    });
  });
});
