import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ResumesService } from '../resumes/resumes.service';
import { LlmStreamChunk } from './llm-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { N8nWebhookProvider } from './providers/n8n-webhook.provider';
import { OpenAiCompatibleProvider } from './providers/openai-compatible.provider';
import { TransformResumeDto } from './dto/transform-resume.dto';
export declare class LlmService {
    private config;
    private prisma;
    private resumesService;
    private anthropicProvider;
    private geminiProvider;
    private groqProvider;
    private n8nProvider;
    private openAiCompatibleProvider;
    private readonly logger;
    private readonly providers;
    private readonly defaultProvider;
    constructor(config: ConfigService, prisma: PrismaService, resumesService: ResumesService, anthropicProvider: AnthropicProvider, geminiProvider: GeminiProvider, groqProvider: GroqProvider, n8nProvider: N8nWebhookProvider, openAiCompatibleProvider: OpenAiCompatibleProvider);
    getAvailableProviders(): {
        name: string;
        available: boolean;
        isDefault: boolean;
    }[];
    transform(resumeId: string, dto: TransformResumeDto, userId?: string): Promise<{
        id: any;
        text: string;
        tokensUsed: number;
        provider: string;
        model: string;
        createdAt: any;
    }>;
    transformStream(resumeId: string, dto: TransformResumeDto): AsyncGenerator<LlmStreamChunk>;
    getTransformationHistory(resumeId: string): Promise<any>;
    autoGenerate(rawText: string, instruction?: string, _provider?: string): Promise<{
        resume: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    getUsageStats(): Promise<{
        totalTransformations: any;
        totalTokensUsed: any;
    }>;
    private readonly FREE_PROVIDER_PRIORITY;
    private getProvider;
    generateWithFallback(systemPrompt: string, userMessage: string, preferredProvider?: string): Promise<import('./llm-provider.interface').LlmResponse>;
    private buildSystemPrompt;
    private buildUserMessage;
    analyzeFeedback(resumeId: string, provider?: string): Promise<{
        feedback: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    analyzeJobMatch(resumeId: string, jobDescription: string, provider?: string): Promise<{
        analysis: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    generateInterviewQuestions(resumeId: string, jobRole?: string, provider?: string, jobDescription?: string, difficulty?: string): Promise<{
        interview: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    inlineAssist(text: string, type: string, provider?: string): Promise<{
        original: string;
        improved: string;
        type: string;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
}
