import { Test, TestingModule } from '@nestjs/testing';
import { StudyGroupsAdminController } from './study-groups-admin.controller';
import { StudyGroupsService } from './study-groups.service';

const mockService = {
  adminList: jest.fn(),
  adminForceClose: jest.fn(),
  adminUpdate: jest.fn(),
  adminDelete: jest.fn(),
};

describe('StudyGroupsAdminController', () => {
  let controller: StudyGroupsAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyGroupsAdminController],
      providers: [{ provide: StudyGroupsService, useValue: mockService }],
    }).compile();
    controller = module.get(StudyGroupsAdminController);
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('기본값 page=1, limit=20', () => {
      controller.list();
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: undefined,
        tier: undefined,
        cafe: undefined,
        experienceLevel: undefined,
        page: 1,
        limit: 20,
      });
    });

    it('필터 + 페이지네이션 파라미터 전달', () => {
      controller.list('네이버', 'large', 'interview', 'mid', '2', '30');
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: '네이버',
        tier: 'large',
        cafe: 'interview',
        experienceLevel: 'mid',
        page: 2,
        limit: 30,
      });
    });
  });

  it('forceClose: id 그대로 위임', () => {
    controller.forceClose('g1');
    expect(mockService.adminForceClose).toHaveBeenCalledWith('g1');
  });

  it('update: body 그대로 전달', () => {
    controller.update('g1', { name: '새 이름', isPrivate: true });
    expect(mockService.adminUpdate).toHaveBeenCalledWith('g1', {
      name: '새 이름',
      isPrivate: true,
    });
  });

  it('remove: 삭제 위임', () => {
    controller.remove('g1');
    expect(mockService.adminDelete).toHaveBeenCalledWith('g1');
  });
});
