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
    list(query: ListJobInterviewQuestionsQuery, userId?: string | null): Promise<{
        myVote: boolean;
        _count: {
            votes: number;
        };
        author: {
            name: string;
            id: string;
            avatar: string;
        } | null;
        id: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        category: string;
        question: string;
        jobPostId: string | null;
        curatedJobId: string | null;
        sampleAnswer: string;
        difficulty: string;
        source: string;
        authorId: string | null;
        upvotes: number;
    }[]>;
    create(userId: string, data: CreateJobInterviewQuestionDto): Promise<{
        id: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        companyName: string;
        category: string;
        question: string;
        jobPostId: string | null;
        curatedJobId: string | null;
        sampleAnswer: string;
        difficulty: string;
        source: string;
        authorId: string | null;
        upvotes: number;
    }>;
    toggleUpvote(questionId: string, userId: string): Promise<{
        upvoted: boolean;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
    aiGenerate(userId: string | null, dto: AiGenerateDto): Promise<{
        questions: {
            question: string;
            sampleAnswer: string;
            category: string;
            difficulty: any;
        }[];
        persisted: boolean;
        provider: string;
        model: string;
    }>;
}
