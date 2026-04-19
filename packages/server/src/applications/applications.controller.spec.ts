import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const mockService = {
  findAll: jest.fn(),
  getStats: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findOne: jest.fn(),
  getComments: jest.fn(),
  addComment: jest.fn(),
};

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [{ provide: ApplicationsService, useValue: mockService }],
    }).compile();
    controller = module.get(ApplicationsController);
    jest.clearAllMocks();
  });

  it('findAll: userId 전달', () => {
    controller.findAll(reqWith('u1'));
    expect(mockService.findAll).toHaveBeenCalledWith('u1', {
      sort: undefined,
      status: undefined,
      q: undefined,
    });
  });

  it('findAll: 비로그인이면 undefined 전달 (service가 처리)', () => {
    controller.findAll(reqWith());
    expect(mockService.findAll).toHaveBeenCalledWith(undefined, {
      sort: undefined,
      status: undefined,
      q: undefined,
    });
  });

  it('getStats: userId 전달', () => {
    controller.getStats(reqWith('u1'));
    expect(mockService.getStats).toHaveBeenCalledWith('u1');
  });

  it('create: dto + userId', () => {
    controller.create({ company: 'A', position: 'B' } as any, reqWith('u1'));
    expect(mockService.create).toHaveBeenCalledWith({ company: 'A', position: 'B' }, 'u1');
  });

  it('update: id + dto + userId', () => {
    controller.update('a1', { status: 'offer' } as any, reqWith('u1'));
    expect(mockService.update).toHaveBeenCalledWith('a1', { status: 'offer' }, 'u1');
  });

  it('remove: id + userId', () => {
    controller.remove('a1', reqWith('u1'));
    expect(mockService.remove).toHaveBeenCalledWith('a1', 'u1');
  });

  describe('getComments (public)', () => {
    it('존재하지 않는 application → 빈 배열', async () => {
      mockService.findOne.mockResolvedValueOnce(null);
      await expect(controller.getComments('a1')).resolves.toEqual([]);
      expect(mockService.getComments).not.toHaveBeenCalled();
    });

    it('비공개 application → 빈 배열', async () => {
      mockService.findOne.mockResolvedValueOnce({ id: 'a1', visibility: 'private' });
      await expect(controller.getComments('a1')).resolves.toEqual([]);
      expect(mockService.getComments).not.toHaveBeenCalled();
    });

    it('공개 application → 댓글 조회', async () => {
      mockService.findOne.mockResolvedValueOnce({ id: 'a1', visibility: 'public' });
      mockService.getComments.mockResolvedValueOnce([{ id: 'c1' }]);
      const res = await controller.getComments('a1');
      expect(res).toEqual([{ id: 'c1' }]);
    });
  });

  it('addComment: id + content + userId', async () => {
    mockService.addComment.mockResolvedValueOnce({ id: 'c1' });
    await controller.addComment('a1', { content: '좋네요' }, reqWith('u1'));
    expect(mockService.addComment).toHaveBeenCalledWith('a1', '좋네요', 'u1');
  });
});
