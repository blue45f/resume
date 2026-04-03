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

  // ──────────────────────────────────────────────────
  // inlineAssist
  // ──────────────────────────────────────────────────
  describe('inlineAssist', () => {
    it('improve 타입으로 텍스트 개선', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: '  개선된 문장  ',
        tokensUsed: 50,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      const result = await service.inlineAssist('원래 문장입니다', 'improve');
      expect(result.original).toBe('원래 문장입니다');
      expect(result.improved).toBe('개선된 문장');
      expect(result.type).toBe('improve');
      expect(result.tokensUsed).toBe(50);
      expect(result.provider).toBe('gemini');
    });

    it('quantify 타입 → 수치화 프롬프트 사용', async () => {
      geminiProvider.generate.mockResolvedValue(mockLlmResponse('gemini'));
      await service.inlineAssist('성능을 개선했다', 'quantify');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('수치화');
    });

    it('concise 타입 → 간결화 프롬프트 사용', async () => {
      geminiProvider.generate.mockResolvedValue(mockLlmResponse('gemini'));
      await service.inlineAssist('불필요하게 긴 문장입니다', 'concise');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('간결');
    });

    it('english 타입 → 영어 번역 프롬프트 사용', async () => {
      geminiProvider.generate.mockResolvedValue(mockLlmResponse('gemini'));
      await service.inlineAssist('한국어 문장', 'english');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('English');
    });

    it('알 수 없는 타입 → improve 폴백', async () => {
      geminiProvider.generate.mockResolvedValue(mockLlmResponse('gemini'));
      await service.inlineAssist('테스트 문장', 'unknown-type');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('전문적이고 임팩트');
    });

    it('빈 텍스트 → BadRequestException', async () => {
      await expect(service.inlineAssist('', 'improve')).rejects.toThrow(BadRequestException);
      await expect(service.inlineAssist(' ', 'improve')).rejects.toThrow(BadRequestException);
    });

    it('2000자 초과 텍스트 → BadRequestException', async () => {
      const longText = 'x'.repeat(2001);
      await expect(service.inlineAssist(longText, 'improve')).rejects.toThrow(BadRequestException);
      await expect(service.inlineAssist(longText, 'improve')).rejects.toThrow('2000자 이내');
    });

    it('provider 지정 시 해당 프로바이더로 전달', async () => {
      groqProvider.generate.mockResolvedValue(mockLlmResponse('groq'));
      const result = await service.inlineAssist('테스트', 'improve', 'groq');
      expect(result.provider).toBe('groq');
    });
  });

  // ──────────────────────────────────────────────────
  // analyzeJobMatch
  // ──────────────────────────────────────────────────
  describe('analyzeJobMatch', () => {
    const validJd = 'React, TypeScript, Node.js 경험자. 3년 이상 프론트엔드 개발 경험 필요합니다.';

    it('JD 매칭 분석 성공', async () => {
      const analysisJson = JSON.stringify({
        matchScore: 78,
        matchGrade: 'B+',
        summary: '전체 매칭 평가',
        matchedSkills: ['React'],
        missingSkills: ['GraphQL'],
        matchedExperience: [],
        gaps: [],
        recommendations: [],
        coverLetterPoints: [],
        interviewPrep: [],
      });
      geminiProvider.generate.mockResolvedValue({
        text: analysisJson,
        tokensUsed: 200,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      const result = await service.analyzeJobMatch('resume-1', validJd);
      expect(result.analysis.matchScore).toBe(78);
      expect(result.analysis.matchGrade).toBe('B+');
      expect(result.tokensUsed).toBe(200);
      expect(mockResumesService.findOne).toHaveBeenCalledWith('resume-1');
    });

    it('JD가 20자 미만 → BadRequestException', async () => {
      await expect(service.analyzeJobMatch('resume-1', '짧은 JD')).rejects.toThrow(BadRequestException);
      await expect(service.analyzeJobMatch('resume-1', '짧은 JD')).rejects.toThrow('20자 이상');
    });

    it('JD가 빈 문자열 → BadRequestException', async () => {
      await expect(service.analyzeJobMatch('resume-1', '')).rejects.toThrow(BadRequestException);
    });

    it('JD가 3000자 초과 → BadRequestException', async () => {
      const longJd = 'x'.repeat(3001);
      await expect(service.analyzeJobMatch('resume-1', longJd)).rejects.toThrow(BadRequestException);
      await expect(service.analyzeJobMatch('resume-1', longJd)).rejects.toThrow('3000자 이내');
    });

    it('LLM 응답 파싱 실패 → BadRequestException', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: 'not valid json at all',
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await expect(service.analyzeJobMatch('resume-1', validJd)).rejects.toThrow(BadRequestException);
      await expect(service.analyzeJobMatch('resume-1', validJd)).rejects.toThrow('파싱할 수 없습니다');
    });
  });

  // ──────────────────────────────────────────────────
  // generateInterviewQuestions
  // ──────────────────────────────────────────────────
  describe('generateInterviewQuestions', () => {
    it('면접 질문 생성 성공', async () => {
      const questionsJson = JSON.stringify({
        questions: [
          {
            category: '경험/프로젝트',
            question: '가장 어려웠던 프로젝트는?',
            intent: '문제 해결 능력 평가',
            sampleAnswer: '모범 답변 내용',
            tips: '구체적 수치를 포함하세요',
          },
        ],
      });
      geminiProvider.generate.mockResolvedValue({
        text: questionsJson,
        tokensUsed: 300,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      const result = await service.generateInterviewQuestions('resume-1');
      expect(result.interview.questions).toHaveLength(1);
      expect(result.interview.questions[0].category).toBe('경험/프로젝트');
      expect(result.tokensUsed).toBe(300);
      expect(mockResumesService.findOne).toHaveBeenCalledWith('resume-1');
    });

    it('jobRole 지정 시 프롬프트에 포함', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: JSON.stringify({ questions: [] }),
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await service.generateInterviewQuestions('resume-1', '프론트엔드 개발자');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).toContain('프론트엔드 개발자');
    });

    it('jobRole 미지정 시 프롬프트에 직무 컨텍스트 없음', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: JSON.stringify({ questions: [] }),
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await service.generateInterviewQuestions('resume-1');
      const systemPrompt = geminiProvider.generate.mock.calls[0][0] as string;
      expect(systemPrompt).not.toContain('지원 직무:');
    });

    it('LLM 응답 파싱 실패 → BadRequestException', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: 'invalid json response',
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await expect(service.generateInterviewQuestions('resume-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────
  // analyzeFeedback
  // ──────────────────────────────────────────────────
  describe('analyzeFeedback', () => {
    it('피드백 분석 성공', async () => {
      const feedbackJson = JSON.stringify({
        score: 75,
        grade: 'B+',
        summary: '전체적인 평가',
        strengths: ['강점1'],
        improvements: ['개선점1'],
        sectionScores: {},
        keywords: [],
        tips: [],
      });
      geminiProvider.generate.mockResolvedValue({
        text: feedbackJson,
        tokensUsed: 250,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      const result = await service.analyzeFeedback('resume-1');
      expect(result.feedback.score).toBe(75);
      expect(result.feedback.grade).toBe('B+');
      expect(result.tokensUsed).toBe(250);
    });

    it('LLM 응답 파싱 실패 → BadRequestException', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: 'not json',
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await expect(service.analyzeFeedback('resume-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────
  // autoGenerate
  // ──────────────────────────────────────────────────
  describe('autoGenerate', () => {
    it('비정형 텍스트 → 구조화된 이력서 JSON 생성', async () => {
      const resumeJson = JSON.stringify({
        title: '홍길동의 이력서',
        personalInfo: { name: '홍길동', email: '', phone: '' },
        experiences: [],
        educations: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        activities: [],
      });
      geminiProvider.generate.mockResolvedValue({
        text: resumeJson,
        tokensUsed: 400,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      const result = await service.autoGenerate('홍길동, 3년차 개발자, React 전문');
      expect(result.resume.title).toBe('홍길동의 이력서');
      expect(result.resume.personalInfo.name).toBe('홍길동');
      expect(result.tokensUsed).toBe(400);
    });

    it('instruction 포함 시 user message에 추가', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: JSON.stringify({ title: '이력서' }),
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await service.autoGenerate('데이터', '간결하게 작성해주세요');
      const userMessage = geminiProvider.generate.mock.calls[0][1] as string;
      expect(userMessage).toContain('간결하게 작성해주세요');
    });

    it('LLM 응답 파싱 실패 → BadRequestException', async () => {
      geminiProvider.generate.mockResolvedValue({
        text: 'completely invalid',
        tokensUsed: 100,
        model: 'gemini-2.0-flash',
        provider: 'gemini',
      });

      await expect(service.autoGenerate('데이터')).rejects.toThrow(BadRequestException);
      await expect(service.autoGenerate('데이터')).rejects.toThrow('파싱할 수 없습니다');
    });
  });
});
