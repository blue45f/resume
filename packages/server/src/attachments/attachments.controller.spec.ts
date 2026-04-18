import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

const mockService = {
  upload: jest.fn(),
  findAll: jest.fn(),
  getFileData: jest.fn(),
  remove: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

function mockRes(): any {
  return {
    redirect: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    send: jest.fn(),
  };
}

describe('AttachmentsController', () => {
  let controller: AttachmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [{ provide: AttachmentsService, useValue: mockService }],
    }).compile();
    controller = module.get(AttachmentsController);
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() =>
        controller.upload('r1', { buffer: Buffer.from('x') } as any, 'doc', 'desc', reqWith()),
      ).toThrow(UnauthorizedException);
    });

    it('파일 누락 → BadRequest', () => {
      expect(() =>
        controller.upload('r1', undefined as any, 'doc', 'desc', reqWith({ id: 'u1' })),
      ).toThrow(BadRequestException);
    });

    it('정상 업로드 — service 위임', () => {
      const file = { buffer: Buffer.from('x') } as any;
      controller.upload('r1', file, 'doc', 'desc', reqWith({ id: 'u1', role: 'user' }));
      expect(mockService.upload).toHaveBeenCalledWith('r1', file, 'doc', 'desc', 'u1', 'user');
    });
  });

  it('findAll: resumeId + userId + role 전달', () => {
    controller.findAll('r1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockService.findAll).toHaveBeenCalledWith('r1', 'u1', 'admin');
  });

  describe('download', () => {
    it('redirectUrl 있으면 res.redirect', async () => {
      mockService.getFileData.mockResolvedValueOnce({ redirectUrl: 'https://cdn.x.com/f.pdf' });
      const res = mockRes();
      await controller.download('a1', reqWith({ id: 'u1' }), res);
      expect(res.redirect).toHaveBeenCalledWith('https://cdn.x.com/f.pdf');
    });

    it('data 없으면 404', async () => {
      mockService.getFileData.mockResolvedValueOnce({ data: null });
      const res = mockRes();
      await controller.download('a1', reqWith({ id: 'u1' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: '파일을 찾을 수 없습니다' });
    });

    it('data 있으면 헤더 설정 후 send', async () => {
      const buf = Buffer.from('hello');
      mockService.getFileData.mockResolvedValueOnce({
        data: buf,
        originalName: '파일.pdf',
        mimeType: 'application/pdf',
      });
      const res = mockRes();
      await controller.download('a1', reqWith({ id: 'u1' }), res);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      // 한글 파일명 encodeURIComponent 포함
      const disposition = res.setHeader.mock.calls.find(
        (c: any[]) => c[0] === 'Content-Disposition',
      );
      expect(disposition[1]).toContain("filename*=UTF-8''");
      expect(res.send).toHaveBeenCalledWith(buf);
    });
  });

  it('remove: 비로그인 Unauthorized / 로그인 시 userId+role 위임', () => {
    expect(() => controller.remove('a1', reqWith())).toThrow(UnauthorizedException);
    controller.remove('a1', reqWith({ id: 'u1', role: 'user' }));
    expect(mockService.remove).toHaveBeenCalledWith('a1', 'u1', 'user');
  });
});
