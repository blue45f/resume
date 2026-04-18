import { Test, TestingModule } from '@nestjs/testing';
import { LlmController } from './llm.controller';
import { LlmService } from './llm.service';
import { UsageService } from '../health/usage.service';

const mockLlm = {
  transform: jest.fn(),
  transformStream: jest.fn(),
  getTransformationHistory: jest.fn(),
  getAvailableProviders: jest.fn(),
  getUsageStats: jest.fn(),
  analyzeFeedback: jest.fn(),
  analyzeJobMatch: jest.fn(),
  generateInterviewQuestions: jest.fn(),
  inlineAssist: jest.fn(),
};

const mockUsage = { checkAndLog: jest.fn() };

const reqWith = (userId?: string): any => ({ user: userId ? { id: userId } : undefined });

describe('LlmController', () => {
  let controller: LlmController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmController],
      providers: [
        { provide: LlmService, useValue: mockLlm },
        { provide: UsageService, useValue: mockUsage },
      ],
    }).compile();
    controller = module.get(LlmController);
    jest.clearAllMocks();
  });

  describe('transform', () => {
    it('로그인 시 usage checkAndLog 후 transform 호출', async () => {
      mockUsage.checkAndLog.mockResolvedValueOnce(undefined);
      mockLlm.transform.mockResolvedValueOnce({ ok: true });
      const res = await controller.transform('r1', { format: 'standard' } as any, reqWith('u1'));
      expect(mockUsage.checkAndLog).toHaveBeenCalledWith('u1', 'ai_transform');
      expect(mockLlm.transform).toHaveBeenCalledWith('r1', { format: 'standard' }, 'u1');
      expect(res).toEqual({ ok: true });
    });

    it('비로그인 시 usage check 건너뜀', async () => {
      mockLlm.transform.mockResolvedValueOnce({ ok: true });
      await controller.transform('r1', { format: 'standard' } as any, reqWith());
      expect(mockUsage.checkAndLog).not.toHaveBeenCalled();
      expect(mockLlm.transform).toHaveBeenCalledWith('r1', { format: 'standard' }, undefined);
    });

    it('usage check 실패 시 transform 호출 안 함 (쿼터 초과 방어)', async () => {
      mockUsage.checkAndLog.mockRejectedValueOnce(new Error('quota exceeded'));
      await expect(
        controller.transform('r1', { format: 'standard' } as any, reqWith('u1')),
      ).rejects.toThrow('quota exceeded');
      expect(mockLlm.transform).not.toHaveBeenCalled();
    });
  });

  it('getHistory: resumeId 전달', () => {
    controller.getHistory('r1');
    expect(mockLlm.getTransformationHistory).toHaveBeenCalledWith('r1');
  });

  it('getProviders / getUsage: 서비스 위임', () => {
    controller.getProviders();
    controller.getUsage();
    expect(mockLlm.getAvailableProviders).toHaveBeenCalled();
    expect(mockLlm.getUsageStats).toHaveBeenCalled();
  });

  describe('AI 분석', () => {
    it('analyzeFeedback: provider 전달', () => {
      controller.analyzeFeedback('r1', { provider: 'openai' } as any);
      expect(mockLlm.analyzeFeedback).toHaveBeenCalledWith('r1', 'openai');
    });

    it('analyzeJobMatch: JD + provider 전달', () => {
      controller.analyzeJobMatch('r1', {
        jobDescription: 'Senior React',
        provider: 'groq',
      } as any);
      expect(mockLlm.analyzeJobMatch).toHaveBeenCalledWith('r1', 'Senior React', 'groq');
    });

    it('generateInterview: 5개 인자 분해 전달', () => {
      controller.generateInterview('r1', {
        jobRole: 'FE',
        provider: 'openai',
        jobDescription: 'JD',
        difficulty: 'hard',
      } as any);
      expect(mockLlm.generateInterviewQuestions).toHaveBeenCalledWith(
        'r1',
        'FE',
        'openai',
        'JD',
        'hard',
      );
    });

    it('inlineAssist: text + type + provider 전달', () => {
      controller.inlineAssist({
        text: '원문',
        type: 'improve',
        provider: 'openai',
      } as any);
      expect(mockLlm.inlineAssist).toHaveBeenCalledWith('원문', 'improve', 'openai');
    });
  });
});
