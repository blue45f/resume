import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CoachingController } from './coaching.controller';
import { CoachingService } from './coaching.service';

const mockService = {
  listCoaches: jest.fn(),
  getCoach: jest.fn(),
  upsertCoachProfile: jest.fn(),
  createSession: jest.fn(),
  mySessions: jest.fn(),
  updateStatus: jest.fn(),
  reviewSession: jest.fn(),
};

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('CoachingController', () => {
  let controller: CoachingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoachingController],
      providers: [{ provide: CoachingService, useValue: mockService }],
    }).compile();
    controller = module.get(CoachingController);
    jest.clearAllMocks();
  });

  describe('listCoaches', () => {
    it('필터 없이 호출', () => {
      controller.listCoaches();
      expect(mockService.listCoaches).toHaveBeenCalledWith({
        specialty: undefined,
        minRate: undefined,
        maxRate: undefined,
      });
    });

    it('rate 파라미터 숫자 변환', () => {
      controller.listCoaches('frontend', '30000', '80000');
      expect(mockService.listCoaches).toHaveBeenCalledWith({
        specialty: 'frontend',
        minRate: 30000,
        maxRate: 80000,
      });
    });
  });

  it('getCoach: id 전달', () => {
    controller.getCoach('c1');
    expect(mockService.getCoach).toHaveBeenCalledWith('c1');
  });

  describe('upsertCoachProfile', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.upsertCoachProfile({ specialty: 'frontend' }, reqWith())).toThrow(
        UnauthorizedException,
      );
    });

    it('로그인 시 userId + body 위임', () => {
      controller.upsertCoachProfile({ specialty: 'frontend' }, reqWith('u1'));
      expect(mockService.upsertCoachProfile).toHaveBeenCalledWith('u1', { specialty: 'frontend' });
    });
  });

  describe('createSession', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() =>
        controller.createSession({ coachId: 'c1', scheduledAt: '2026-05-01' }, reqWith()),
      ).toThrow(UnauthorizedException);
    });

    it('로그인 시 clientId + dto 위임', () => {
      const dto = { coachId: 'c1', scheduledAt: '2026-05-01', resumeId: 'r1' };
      controller.createSession(dto, reqWith('u1'));
      expect(mockService.createSession).toHaveBeenCalledWith('u1', dto);
    });
  });

  describe('mySessions', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.mySessions(reqWith())).toThrow(UnauthorizedException);
    });

    it('로그인 userId 전달', () => {
      controller.mySessions(reqWith('u1'));
      expect(mockService.mySessions).toHaveBeenCalledWith('u1');
    });
  });

  describe('updateStatus', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.updateStatus('s1', { status: 'confirmed' }, reqWith())).toThrow(
        UnauthorizedException,
      );
    });

    it('로그인 시 sessionId + userId + dto 위임', () => {
      controller.updateStatus('s1', { status: 'confirmed' }, reqWith('u1'));
      expect(mockService.updateStatus).toHaveBeenCalledWith('s1', 'u1', { status: 'confirmed' });
    });
  });

  describe('reviewSession', () => {
    it('비로그인 → Unauthorized', () => {
      expect(() => controller.reviewSession('s1', { rating: 5 }, reqWith())).toThrow(
        UnauthorizedException,
      );
    });

    it('로그인 시 sessionId + userId + review dto 위임', () => {
      controller.reviewSession('s1', { rating: 5, review: 'good' }, reqWith('u1'));
      expect(mockService.reviewSession).toHaveBeenCalledWith('s1', 'u1', {
        rating: 5,
        review: 'good',
      });
    });
  });
});
