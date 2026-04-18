import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

const mockService = {
  findAll: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
};

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('InterviewController', () => {
  let controller: InterviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewController],
      providers: [{ provide: InterviewService, useValue: mockService }],
    }).compile();
    controller = module.get(InterviewController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.findAll(reqWith())).toThrow(UnauthorizedException);
    });

    it('로그인 시 userId 위임', () => {
      controller.findAll(reqWith('u1'));
      expect(mockService.findAll).toHaveBeenCalledWith('u1');
    });
  });

  describe('create', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.create({ question: 'Q', answer: 'A' }, reqWith())).toThrow(
        UnauthorizedException,
      );
    });

    it('로그인 시 userId + body 위임', () => {
      controller.create({ question: 'Q', answer: 'A' }, reqWith('u1'));
      expect(mockService.create).toHaveBeenCalledWith('u1', { question: 'Q', answer: 'A' });
    });
  });

  describe('remove', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.remove('a1', reqWith())).toThrow(UnauthorizedException);
    });

    it('로그인 시 id + userId 위임', () => {
      controller.remove('a1', reqWith('u1'));
      expect(mockService.remove).toHaveBeenCalledWith('a1', 'u1');
    });
  });
});
