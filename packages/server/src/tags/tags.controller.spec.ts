import { Test, TestingModule } from '@nestjs/testing';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { ResumesService } from '../resumes/resumes.service';

const mockTagsService = {
  findAll: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  addTagToResume: jest.fn(),
  removeTagFromResume: jest.fn(),
};

const mockResumesService = {
  findOne: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('TagsController', () => {
  let controller: TagsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TagsController],
      providers: [
        { provide: TagsService, useValue: mockTagsService },
        { provide: ResumesService, useValue: mockResumesService },
      ],
    }).compile();
    controller = module.get(TagsController);
    jest.clearAllMocks();
  });

  it('findAll (public): 서비스 호출', () => {
    controller.findAll();
    expect(mockTagsService.findAll).toHaveBeenCalled();
  });

  it('create: dto + userId 전달', () => {
    controller.create({ name: 'react' } as any, reqWith({ id: 'u1' }));
    expect(mockTagsService.create).toHaveBeenCalledWith({ name: 'react' }, 'u1');
  });

  it('remove: id + userId + role 전달', () => {
    controller.remove('t1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockTagsService.remove).toHaveBeenCalledWith('t1', 'u1', 'admin');
  });

  describe('addToResume', () => {
    it('resume 소유권 먼저 체크 후 태그 추가', async () => {
      mockResumesService.findOne.mockResolvedValueOnce({ id: 'r1' });
      mockTagsService.addTagToResume.mockResolvedValueOnce({});
      await controller.addToResume('t1', 'r1', reqWith({ id: 'u1' }));
      expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', 'u1');
      expect(mockTagsService.addTagToResume).toHaveBeenCalledWith('r1', 't1');
    });

    it('findOne 실패 시 addTagToResume 호출 안 함 (권한 방어)', async () => {
      mockResumesService.findOne.mockRejectedValueOnce(new Error('not found'));
      await expect(controller.addToResume('t1', 'r1', reqWith({ id: 'u1' }))).rejects.toThrow();
      expect(mockTagsService.addTagToResume).not.toHaveBeenCalled();
    });
  });

  it('removeFromResume: 소유권 체크 후 제거', async () => {
    mockResumesService.findOne.mockResolvedValueOnce({ id: 'r1' });
    mockTagsService.removeTagFromResume.mockResolvedValueOnce({});
    await controller.removeFromResume('t1', 'r1', reqWith({ id: 'u1' }));
    expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', 'u1');
    expect(mockTagsService.removeTagFromResume).toHaveBeenCalledWith('r1', 't1');
  });
});
