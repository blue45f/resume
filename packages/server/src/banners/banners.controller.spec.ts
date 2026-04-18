import { Test, TestingModule } from '@nestjs/testing';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';

const mockService = {
  getActive: jest.fn(),
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  reorder: jest.fn(),
};

const reqWithRole = (role?: string): any => ({ user: role ? { role } : undefined });

describe('BannersController', () => {
  let controller: BannersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BannersController],
      providers: [{ provide: BannersService, useValue: mockService }],
    }).compile();
    controller = module.get(BannersController);
    jest.clearAllMocks();
  });

  it('getActive: 공개 활성 배너', () => {
    controller.getActive();
    expect(mockService.getActive).toHaveBeenCalled();
  });

  describe('getAll (role-based)', () => {
    it('비로그인 → getActive fallback', () => {
      controller.getAll(reqWithRole());
      expect(mockService.getActive).toHaveBeenCalled();
      expect(mockService.getAll).not.toHaveBeenCalled();
    });

    it('일반 유저 → getActive fallback', () => {
      controller.getAll(reqWithRole('user'));
      expect(mockService.getActive).toHaveBeenCalled();
      expect(mockService.getAll).not.toHaveBeenCalled();
    });

    it('admin → 전체 조회', () => {
      controller.getAll(reqWithRole('admin'));
      expect(mockService.getAll).toHaveBeenCalled();
      expect(mockService.getActive).not.toHaveBeenCalled();
    });

    it('superadmin → 전체 조회', () => {
      controller.getAll(reqWithRole('superadmin'));
      expect(mockService.getAll).toHaveBeenCalled();
    });
  });

  it('create: body 위임', () => {
    controller.create({ title: '이벤트' });
    expect(mockService.create).toHaveBeenCalledWith({ title: '이벤트' });
  });

  it('reorder: ids 배열 위임', () => {
    controller.reorder({ ids: ['b1', 'b2'] });
    expect(mockService.reorder).toHaveBeenCalledWith(['b1', 'b2']);
  });

  it('update: id + body 위임', () => {
    controller.update('b1', { isActive: false });
    expect(mockService.update).toHaveBeenCalledWith('b1', { isActive: false });
  });

  it('remove: id 위임', () => {
    controller.remove('b1');
    expect(mockService.remove).toHaveBeenCalledWith('b1');
  });
});
