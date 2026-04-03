import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { LlmService } from './llm.service';
import { PrismaService } from '../prisma/prisma.service';
import { ResumesService } from '../resumes/resumes.service';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { N8nWebhookProvider } from './providers/n8n-webhook.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';

const mockLlmResponse = (provider: string) => ({
  text: 'Generated text',
  tokensUsed: 100,
  model: 'test-model',
  provider,
});

const makeProvider = (name: string, available: boolean, generateFn?: jest.Mock) => ({
  name,
  isAvailable: available,
  generate: generateFn || jest.fn().mockResolvedValue(mockLlmResponse(name)),
  generateStream: jest.fn(),
});

const mockPrisma = {
  llmTransformation: {
    create: jest.fn().mockResolvedValue({
      id: 'trans-1',
      createdAt: new Date('2024-01-01'),
    }),
    findMany: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue({ _sum: { tokensUsed: 500 }, _count: 10 }),
  },
};

const mockResumesService = {
  findOne: jest.fn().mockResolvedValue({
    id: 'resume-1',
    title: '테스트 이력서',
    personalInfo: { name: '홍길동' },
    experiences: [],
  }),
};

describe('LlmService', () => {
  let service: LlmService;
  let geminiProvider: ReturnType<typeof makeProvider>;
  let groqProvider: ReturnType<typeof makeProvider>;
  let anthropicProvider: ReturnType<typeof makeProvider>;
  let n8nProvider: ReturnType<typeof makeProvider>;
  let openAiProvider: ReturnType<typeof makeProvider>;

  beforeEach(async () => {
    geminiProvider = makeProvider('gemini', true);
    groqProvider = makeProvider('groq', true);
    anthropicProvider = makeProvider('anthropic', true);
    n8nProvider = makeProvider('n8n', false);
    openAiProvider = makeProvider('openai-compatible', false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: { get: () => null } },
        { provide: ResumesService, useValue: mockResumesService },
        { provide: AnthropicProvider, useValue: anthropicProvider },
        { provide: GeminiProvider, useValue: geminiProvider },
        { provide: GroqProvider, useValue: groqProvider },
        { provide: N8nWebhookProvider, useValue: n8nProvider },
        { provide: OpenAiCompatibleProvider, useValue: openAiProvider },
      ],
    }).compile();
    service = module.get(LlmService);
    jest.clearAllMocks();
  });

  describe('getAvailableProviders', () => {
    it('등록된 프로바이더 목록 반환', () => {
      const providers = service.getAvailableProviders();
      const names = providers.map((p) => p.name);
      expect(names).toContain('gemini');
      expect(names).toContain('groq');
      expect(names).toContain('anthropic');
      // n8n and openai-compatible are not available
      expect(names).not.toContain('n8n');
      expect(names).not.toContain('openai-compatible');
    });

    it('기본 프로바이더가 isDefault=true', () => {
      const providers = service.getAvailableProviders();
      const defaultProvider = providers.find((p) => p.isDefault);
      expect(defaultProvider).toBeDefined();
      expect(defaultProvider!.name).toBe('gemini');
    });
  });

  describe('generateWithFallback', () => {
    it('첫 번째 프로바이더 성공 시 바로 반환', async () => {
      const result = await service.generateWithFallback('system', 'user');
      expect(result.provider).toBe('gemini');
      expect(geminiProvider.generate).toHaveBeenCalledWith('system', 'user');
      expect(groqProvider.generate).not.toHaveBeenCalled();
    });

    it('첫 번째 프로바이더 rate-limit → 두 번째 성공', async () => {
      geminiProvider.generate.mockRejectedValue(new Error('429 rate limit exceeded'));
      const result = await service.generateWithFallback('system', 'user');
      expect(result.provider).toBe('groq');
      expect(geminiProvider.generate).toHaveBeenCalled();
      expect(groqProvider.generate).toHaveBeenCalled();
    });

    it('모든 프로바이더 rate-limit → BadRequestException', async () => {
      geminiProvider.generate.mockRejectedValue(new Error('429 rate limit'));
      groqProvider.generate.mockRejectedValue(new Error('quota exceeded limit'));
      anthropicProvider.generate.mockRejectedValue(new Error('rate limit reached'));

      await expect(service.generateWithFallback('system', 'user'))
        .rejects.toThrow(BadRequestException);
    });

    it('비 rate-limit 에러도 다음 프로바이더로 fallback', async () => {
      const authError = new Error('Invalid API key');
      geminiProvider.generate.mockRejectedValue(authError);

      // gemini 실패해도 groq로 fallback
      const result = await service.generateWithFallback('system', 'user');
      expect(groqProvider.generate).toHaveBeenCalled();
      expect(result.provider).toBe('groq');
    });

    it('preferredProvider 지정 시 해당 프로바이더 우선 시도', async () => {
      const result = await service.generateWithFallback('system', 'user', 'groq');
      expect(result.provider).toBe('groq');
      expect(groqProvider.generate).toHaveBeenCalled();
      expect(geminiProvider.generate).not.toHaveBeenCalled();
    });
  });

  describe('transform', () => {
    it('generateWithFallback를 호출하고 결과를 DB에 저장', async () => {
      const dto = { templateType: 'standard' as const };
      const result = await service.transform('resume-1', dto);

      expect(mockResumesService.findOne).toHaveBeenCalledWith('resume-1');
      expect(result.text).toBe('Generated text');
      expect(result.provider).toBe('gemini');
      expect(result.id).toBe('trans-1');
      expect(mockPrisma.llmTransformation.create).toHaveBeenCalled();
    });

    it('영어 변환 옵션 적용', async () => {
      const dto = { templateType: 'standard' as const, targetLanguage: 'en' };
      await service.transform('resume-1', dto);

      const createCall = mockPrisma.llmTransformation.create.mock.calls[0][0];
      expect(createCall.data.targetLanguage).toBe('en');
    });
  });

  describe('buildSystemPrompt (간접 테스트 via transform)', () => {
    it('standard 템플릿 → 표준 프롬프트 사용', async () => {
      const dto = { templateType: 'standard' as const };
      await service.transform('resume-1', dto);

      const callArgs = geminiProvider.generate.mock.calls[0];
      const systemPrompt = callArgs[0] as string;
      expect(systemPrompt).toContain('전문 이력서 작성 전문가');
    });

    it('developer 템플릿 → 개발자 프롬프트 사용', async () => {
      const dto = { templateType: 'developer' as const };
      await service.transform('resume-1', dto);

      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('개발자 이력서 전문가');
    });

    it('custom 템플릿 + 커스텀 프롬프트 사용', async () => {
      const dto = { templateType: 'custom' as const, customPrompt: '나만의 프롬프트' };
      await service.transform('resume-1', dto);

      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('나만의 프롬프트');
    });

    it('custom 프롬프트 길이 초과 → BadRequestException', async () => {
      const dto = {
        templateType: 'custom' as const,
        customPrompt: 'x'.repeat(2001),
      };
      await expect(service.transform('resume-1', dto))
        .rejects.toThrow(BadRequestException);
    });

    it('영어 타겟 → IMPORTANT: Write in English 포함', async () => {
      const dto = { templateType: 'standard' as const, targetLanguage: 'en' };
      await service.transform('resume-1', dto);

      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('Write the entire output in English');
    });

    it('알 수 없는 templateType → standard 폴백', async () => {
      const dto = { templateType: 'unknown-type' as any };
      await service.transform('resume-1', dto);

      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('전문 이력서 작성 전문가');
    });
  });

  describe('buildUserMessage (간접 테스트 via transform)', () => {
    it('이력서 데이터가 JSON으로 포함됨', async () => {
      const dto = { templateType: 'standard' as const };
      await service.transform('resume-1', dto);

      const userMessage = geminiProvider.generate.mock.calls[0][1] as string;
      expect(userMessage).toContain('이력서 원본 데이터');
      expect(userMessage).toContain('홍길동');
    });
  });

  describe('getUsageStats', () => {
    it('사용 통계 반환', async () => {
      const stats = await service.getUsageStats();
      expect(stats.totalTransformations).toBe(10);
      expect(stats.totalTokensUsed).toBe(500);
    });
  });
});
