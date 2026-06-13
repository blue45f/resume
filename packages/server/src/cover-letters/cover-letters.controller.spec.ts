import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CoverLettersController } from './cover-letters.controller';
import { CoverLettersService } from './cover-letters.service';
import type { CreateCoverLetterInput, UpdateCoverLetterInput } from './cover-letters.service';
import type { AuthenticatedRequest } from '../common/request.types';

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getByResume: jest.fn(),
};

const reqWith = (userId?: string): AuthenticatedRequest => ({
  user: userId ? { id: userId } : undefined,
});

const createBody: CreateCoverLetterInput = {
  company: 'T',
  position: 'P',
  tone: 'formal',
  jobDescription: 'JD',
  content: 'content',
};

describe('CoverLettersController', () => {
  let controller: CoverLettersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoverLettersController],
      providers: [{ provide: CoverLettersService, useValue: mockService }],
    }).compile();
    controller = module.get(CoverLettersController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('비로그인 → [] (service 호출 안 함)', () => {
      expect(controller.findAll(reqWith())).toEqual([]);
      expect(mockService.findAll).not.toHaveBeenCalled();
    });

    it('로그인 시 userId 위임', () => {
      controller.findAll(reqWith('u1'));
      expect(mockService.findAll).toHaveBeenCalledWith('u1');
    });
  });

  it('findOne: 로그인 시 userId 전달', () => {
    controller.findOne('cl1', reqWith('u1'));
    expect(mockService.findOne).toHaveBeenCalledWith('cl1', 'u1');
  });

  it('findOne: 비로그인이면 UnauthorizedException', () => {
    expect(() => controller.findOne('cl1', reqWith())).toThrow(UnauthorizedException);
    expect(mockService.findOne).not.toHaveBeenCalled();
  });

  describe('create', () => {
    it('비로그인 → error 객체', () => {
      expect(controller.create(createBody, reqWith())).toEqual({ error: '로그인 필요' });
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('로그인 시 userId + body 위임', () => {
      controller.create(createBody, reqWith('u1'));
      expect(mockService.create).toHaveBeenCalledWith('u1', createBody);
    });
  });

  it('update: id + userId + body 전달', () => {
    const updateBody: UpdateCoverLetterInput = { content: 'T2' };
    controller.update('cl1', updateBody, reqWith('u1'));
    expect(mockService.update).toHaveBeenCalledWith('cl1', 'u1', updateBody);
  });

  it('remove: id + userId 전달', () => {
    controller.remove('cl1', reqWith('u1'));
    expect(mockService.remove).toHaveBeenCalledWith('cl1', 'u1');
  });

  describe('getByResume', () => {
    it('비로그인 → []', () => {
      expect(controller.getByResume('r1', reqWith())).toEqual([]);
      expect(mockService.getByResume).not.toHaveBeenCalled();
    });

    it('로그인 시 resumeId + userId 전달', () => {
      controller.getByResume('r1', reqWith('u1'));
      expect(mockService.getByResume).toHaveBeenCalledWith('r1', 'u1');
    });
  });
});
