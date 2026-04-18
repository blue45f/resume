import { Test, TestingModule } from '@nestjs/testing';
import { ShareController } from './share.controller';
import { ShareService } from './share.service';
import { ResumesService } from '../resumes/resumes.service';

const mockShareService = {
  createLink: jest.fn(),
  getLinksForResume: jest.fn(),
  removeLink: jest.fn(),
  getByToken: jest.fn(),
};

const mockResumesService = {
  findOne: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('ShareController', () => {
  let controller: ShareController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShareController],
      providers: [
        { provide: ShareService, useValue: mockShareService },
        { provide: ResumesService, useValue: mockResumesService },
      ],
    }).compile();
    controller = module.get(ShareController);
    jest.clearAllMocks();
  });

  describe('createLink', () => {
    it('소유권 확인 실패 시 공유 링크 생성 호출 안 함 (IDOR 방지)', async () => {
      mockResumesService.findOne.mockRejectedValueOnce(new Error('forbidden'));
      await expect(
        controller.createLink('r1', { password: 'x' } as any, reqWith({ id: 'u1' })),
      ).rejects.toThrow();
      expect(mockShareService.createLink).not.toHaveBeenCalled();
    });

    it('소유권 확인 통과 시 공유 링크 생성', async () => {
      mockResumesService.findOne.mockResolvedValueOnce({ id: 'r1' });
      mockShareService.createLink.mockResolvedValueOnce({ token: 't1' });
      const res = await controller.createLink(
        'r1',
        { password: 'x' } as any,
        reqWith({ id: 'u1' }),
      );
      expect(res).toEqual({ token: 't1' });
      expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', 'u1');
    });
  });

  it('getLinks: 소유권 확인 후 링크 목록 반환', async () => {
    mockResumesService.findOne.mockResolvedValueOnce({ id: 'r1' });
    mockShareService.getLinksForResume.mockResolvedValueOnce([]);
    await controller.getLinks('r1', reqWith({ id: 'u1' }));
    expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', 'u1');
    expect(mockShareService.getLinksForResume).toHaveBeenCalledWith('r1');
  });

  it('removeLink: userId + role 전달 (서비스에서 권한 판정)', () => {
    controller.removeLink('s1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockShareService.removeLink).toHaveBeenCalledWith('s1', 'u1', 'admin');
  });

  describe('getShared (public)', () => {
    it('token 만 전달', () => {
      controller.getShared('t1');
      expect(mockShareService.getByToken).toHaveBeenCalledWith('t1', undefined);
    });

    it('password 쿼리 함께 전달', () => {
      controller.getShared('t1', 'pw');
      expect(mockShareService.getByToken).toHaveBeenCalledWith('t1', 'pw');
    });
  });
});
