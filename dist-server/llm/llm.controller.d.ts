import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { TransformResumeDto } from './dto/transform-resume.dto';
import { FeedbackDto, JobMatchDto, InterviewDto, InlineAssistDto } from './dto/analysis.dto';
import { UsageService } from '../health/usage.service';
export declare class LlmController {
    private readonly llmService;
    private readonly usageService;
    constructor(llmService: LlmService, usageService: UsageService);
    transform(resumeId: string, dto: TransformResumeDto, req: any): Promise<{
        id: string;
        text: string;
        tokensUsed: number;
        provider: string;
        model: string;
        createdAt: string;
    }>;
    transformStream(resumeId: string, dto: TransformResumeDto): Observable<MessageEvent>;
    getHistory(resumeId: string): Promise<{
        id: string;
        templateType: string;
        targetLanguage: string;
        tokensUsed: number;
        model: string;
        createdAt: string;
        result: any;
    }[]>;
    getProviders(): {
        name: string;
        available: boolean;
        isDefault: boolean;
    }[];
    getUsage(): Promise<{
        totalTransformations: number;
        totalTokensUsed: number;
    }>;
    analyzeFeedback(resumeId: string, dto: FeedbackDto): Promise<{
        feedback: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    analyzeJobMatch(resumeId: string, dto: JobMatchDto): Promise<{
        analysis: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    generateInterview(resumeId: string, dto: InterviewDto): Promise<{
        interview: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
    inlineAssist(dto: InlineAssistDto): Promise<{
        original: string;
        improved: string;
        type: string;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
}
