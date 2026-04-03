"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const llm_service_1 = require("./llm.service");
const prisma_service_1 = require("../prisma/prisma.service");
const resumes_service_1 = require("../resumes/resumes.service");
const anthropic_provider_1 = require("./providers/anthropic.provider");
const gemini_provider_1 = require("./providers/gemini.provider");
const groq_provider_1 = require("./providers/groq.provider");
const n8n_webhook_provider_1 = require("./providers/n8n-webhook.provider");
const openai_compatible_provider_1 = require("./providers/openai-compatible.provider");
const mockLlmResponse = (provider) => ({
    text: 'Generated text',
    tokensUsed: 100,
    model: 'test-model',
    provider,
});
const makeProvider = (name, available, generateFn) => ({
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
    let service;
    let geminiProvider;
    let groqProvider;
    let anthropicProvider;
    let n8nProvider;
    let openAiProvider;
    beforeEach(async () => {
        geminiProvider = makeProvider('gemini', true);
        groqProvider = makeProvider('groq', true);
        anthropicProvider = makeProvider('anthropic', true);
        n8nProvider = makeProvider('n8n', false);
        openAiProvider = makeProvider('openai-compatible', false);
        const module = await testing_1.Test.createTestingModule({
            providers: [
                llm_service_1.LlmService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: config_1.ConfigService, useValue: { get: () => null } },
                { provide: resumes_service_1.ResumesService, useValue: mockResumesService },
                { provide: anthropic_provider_1.AnthropicProvider, useValue: anthropicProvider },
                { provide: gemini_provider_1.GeminiProvider, useValue: geminiProvider },
                { provide: groq_provider_1.GroqProvider, useValue: groqProvider },
                { provide: n8n_webhook_provider_1.N8nWebhookProvider, useValue: n8nProvider },
                { provide: openai_compatible_provider_1.OpenAiCompatibleProvider, useValue: openAiProvider },
            ],
        }).compile();
        service = module.get(llm_service_1.LlmService);
        jest.clearAllMocks();
    });
    describe('getAvailableProviders', () => {
        it('등록된 프로바이더 목록 반환', () => {
            const providers = service.getAvailableProviders();
            const names = providers.map((p) => p.name);
            expect(names).toContain('gemini');
            expect(names).toContain('groq');
            expect(names).toContain('anthropic');
            expect(names).not.toContain('n8n');
            expect(names).not.toContain('openai-compatible');
        });
        it('기본 프로바이더가 isDefault=true', () => {
            const providers = service.getAvailableProviders();
            const defaultProvider = providers.find((p) => p.isDefault);
            expect(defaultProvider).toBeDefined();
            expect(defaultProvider.name).toBe('gemini');
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
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('비 rate-limit 에러는 즉시 re-throw', async () => {
            const authError = new Error('Invalid API key');
            geminiProvider.generate.mockRejectedValue(authError);
            await expect(service.generateWithFallback('system', 'user'))
                .rejects.toThrow('Invalid API key');
            expect(groqProvider.generate).not.toHaveBeenCalled();
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
            const dto = { templateType: 'standard' };
            const result = await service.transform('resume-1', dto);
            expect(mockResumesService.findOne).toHaveBeenCalledWith('resume-1');
            expect(result.text).toBe('Generated text');
            expect(result.provider).toBe('gemini');
            expect(result.id).toBe('trans-1');
            expect(mockPrisma.llmTransformation.create).toHaveBeenCalled();
        });
        it('영어 변환 옵션 적용', async () => {
            const dto = { templateType: 'standard', targetLanguage: 'en' };
            await service.transform('resume-1', dto);
            const createCall = mockPrisma.llmTransformation.create.mock.calls[0][0];
            expect(createCall.data.targetLanguage).toBe('en');
        });
    });
    describe('buildSystemPrompt (간접 테스트 via transform)', () => {
        it('standard 템플릿 → 표준 프롬프트 사용', async () => {
            const dto = { templateType: 'standard' };
            await service.transform('resume-1', dto);
            const callArgs = geminiProvider.generate.mock.calls[0];
            const systemPrompt = callArgs[0];
            expect(systemPrompt).toContain('전문 이력서 작성 전문가');
        });
        it('developer 템플릿 → 개발자 프롬프트 사용', async () => {
            const dto = { templateType: 'developer' };
            await service.transform('resume-1', dto);
            const systemPrompt = geminiProvider.generate.mock.calls[0][0];
            expect(systemPrompt).toContain('개발자 이력서 전문가');
        });
        it('custom 템플릿 + 커스텀 프롬프트 사용', async () => {
            const dto = { templateType: 'custom', customPrompt: '나만의 프롬프트' };
            await service.transform('resume-1', dto);
            const systemPrompt = geminiProvider.generate.mock.calls[0][0];
            expect(systemPrompt).toContain('나만의 프롬프트');
        });
        it('custom 프롬프트 길이 초과 → BadRequestException', async () => {
            const dto = {
                templateType: 'custom',
                customPrompt: 'x'.repeat(2001),
            };
            await expect(service.transform('resume-1', dto))
                .rejects.toThrow(common_1.BadRequestException);
        });
        it('영어 타겟 → IMPORTANT: Write in English 포함', async () => {
            const dto = { templateType: 'standard', targetLanguage: 'en' };
            await service.transform('resume-1', dto);
            const systemPrompt = geminiProvider.generate.mock.calls[0][0];
            expect(systemPrompt).toContain('Write the entire output in English');
        });
        it('알 수 없는 templateType → standard 폴백', async () => {
            const dto = { templateType: 'unknown-type' };
            await service.transform('resume-1', dto);
            const systemPrompt = geminiProvider.generate.mock.calls[0][0];
            expect(systemPrompt).toContain('전문 이력서 작성 전문가');
        });
    });
    describe('buildUserMessage (간접 테스트 via transform)', () => {
        it('이력서 데이터가 JSON으로 포함됨', async () => {
            const dto = { templateType: 'standard' };
            await service.transform('resume-1', dto);
            const userMessage = geminiProvider.generate.mock.calls[0][1];
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
