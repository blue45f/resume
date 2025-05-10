import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LlmService } from './llm.service';
import { TransformResumeDto } from './dto/transform-resume.dto';
export declare class LlmController {
    private readonly llmService;
    constructor(llmService: LlmService);
    transform(resumeId: string, dto: TransformResumeDto): Promise<{
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
}
