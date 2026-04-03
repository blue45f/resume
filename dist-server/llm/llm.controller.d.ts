import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { TransformResumeDto } from './dto/transform-resume.dto';
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
    generateInterview(resumeId: string, jobRole?: string, provider?: string): Promise<{
        interview: any;
        tokensUsed: number;
        provider: string;
        model: string;
    }>;
}
