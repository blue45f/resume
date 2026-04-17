import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
export interface CreateJobInterviewQuestionDto {
    jobPostId?: string;
    curatedJobId?: string;
    companyName: string;
    position: string;
    question: string;
    sampleAnswer?: string;
    category?: string;
    difficulty?: string;
    source?: string;
}
export interface ListJobInterviewQuestionsQuery {
    company?: string;
    position?: string;
    jobPostId?: string;
    curatedJobId?: string;
    limit?: number;
}
export interface AiGenerateDto {
    jobPostId?: string;
    curatedJobId?: string;
    companyName: string;
    position: string;
    description?: string;
    requirements?: string;
    skills?: string;
    count?: number;
    persist?: boolean;
}
export declare class JobInterviewQuestionsService {
    private prisma;
    private llm;
    constructor(prisma: PrismaService, llm: LlmService);
    list(query: ListJobInterviewQuestionsQuery, userId?: string | null): Promise<any>;
    create(userId: string, data: CreateJobInterviewQuestionDto): Promise<any>;
    toggleUpvote(questionId: string, userId: string): Promise<{
        upvoted: boolean;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
    aiGenerate(userId: string | null, dto: AiGenerateDto): Promise<{
        questions: $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
        persisted: boolean;
        provider: string;
        model: string;
    }>;
}
