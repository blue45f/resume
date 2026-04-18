import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JobInterviewQuestionsController } from './job-interview-questions.controller';
import { JobInterviewQuestionsService } from './job-interview-questions.service';

const mockService = {
  list: jest.fn(),
  create: jest.fn(),
  toggleUpvote: jest.fn(),
  remove: jest.fn(),
  aiGenerate: jest.fn(),
};

const reqWith = (user?: { id?: string; role?: string }): any => ({ user });

describe('JobInterviewQuestionsController', () => {
  let controller: JobInterviewQuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobInterviewQuestionsController],
      providers: [{ provide: JobInterviewQuestionsService, useValue: mockService }],
    }).compile();
    controller = module.get(JobInterviewQuestionsController);
    jest.clearAllMocks();
  });

  describe('list (public)', () => {
    it('비로그인 시 userId null', () => {
      controller.list('네이버', 'FE', undefined, undefined, undefined, reqWith());
      expect(mockService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          company: '네이버',
          position: 'FE',
        }),
        null,
      );
    });

    it('limit 정수 파싱', () => {
      controller.list(undefined, undefined, undefined, undefined, '50', reqWith({ id: 'u1' }));
      expect(mockService.list).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }), 'u1');
    });

    it('limit 미지정 시 undefined', () => {
      controller.list(undefined, undefined, undefined, undefined, undefined, reqWith());
      expect(mockService.list).toHaveBeenCalledWith(
        expect.objectContaining({ limit: undefined }),
        null,
      );
    });
  });

  it('create: 비로그인 Unauthorized', () => {
    expect(() =>
      controller.create({ companyName: 'N', position: 'FE', question: 'Q' } as any, reqWith()),
    ).toThrow(UnauthorizedException);
  });

  it('create: 로그인 시 위임', () => {
    const dto = { companyName: 'N', position: 'FE', question: 'Q' };
    controller.create(dto as any, reqWith({ id: 'u1' }));
    expect(mockService.create).toHaveBeenCalledWith('u1', dto);
  });

  it('upvote: 비로그인 Unauthorized / 로그인 위임', () => {
    expect(() => controller.upvote('q1', reqWith())).toThrow(UnauthorizedException);
    controller.upvote('q1', reqWith({ id: 'u1' }));
    expect(mockService.toggleUpvote).toHaveBeenCalledWith('q1', 'u1');
  });

  it('remove: 비로그인 Unauthorized / userId + role 전달', () => {
    expect(() => controller.remove('q1', reqWith())).toThrow(UnauthorizedException);
    controller.remove('q1', reqWith({ id: 'u1', role: 'admin' }));
    expect(mockService.remove).toHaveBeenCalledWith('q1', 'u1', 'admin');
  });

  it('aiGenerate: 비로그인 Unauthorized', () => {
    expect(() =>
      controller.aiGenerate({ companyName: 'N', position: 'FE' } as any, reqWith()),
    ).toThrow(UnauthorizedException);
  });

  it('aiGenerate: 로그인 시 userId + dto 위임', () => {
    const dto = { companyName: 'N', position: 'FE', count: 5 };
    controller.aiGenerate(dto as any, reqWith({ id: 'u1' }));
    expect(mockService.aiGenerate).toHaveBeenCalledWith('u1', dto);
  });
});
