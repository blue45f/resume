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
    transform(resumeId: string, dto: TransformResumeDto): Promise<{
        id: string;
        text: string;
        tokensUsed: number;
        provider: string;
        model: string;
        createdAt: string;
    }>;
    transformStream(resumeId: string, dto: TransformResumeDto): AsyncGenerator<LlmStreamChunk>;
    getTransformationHistory(resumeId: string): Promise<{
        id: string;
        templateType: string;
        targetLanguage: string;
        tokensUsed: number;
        model: string;
        createdAt: string;
        result: any;
    }[]>;
    autoGenerate(rawText: string, instruction?: string, provider?: string): Promise<{
        resume: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    getUsageStats(): Promise<{
        totalTransformations: number;
        totalTokensUsed: number;
    }>;
    private getProvider;
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
    generateInterviewQuestions(resumeId: string, jobRole?: string, provider?: string): Promise<{
        interview: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
}
