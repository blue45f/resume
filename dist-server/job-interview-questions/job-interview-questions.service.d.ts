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
            id: string;
            name: string;
            avatar: string;
        } | null;
        id: string;
        companyName: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        position: string;
        difficulty: string;
        authorId: string | null;
        question: string;
        jobPostId: string | null;
        sampleAnswer: string;
        upvotes: number;
        curatedJobId: string | null;
        source: string;
    }[]>;
    create(userId: string, data: CreateJobInterviewQuestionDto): Promise<{
        id: string;
        companyName: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        position: string;
        difficulty: string;
        authorId: string | null;
        question: string;
        jobPostId: string | null;
        sampleAnswer: string;
        upvotes: number;
        curatedJobId: string | null;
        source: string;
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
