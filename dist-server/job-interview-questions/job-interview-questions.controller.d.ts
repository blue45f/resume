import { JobInterviewQuestionsService, CreateJobInterviewQuestionDto, AiGenerateDto } from './job-interview-questions.service';
export declare class JobInterviewQuestionsController {
    private readonly service;
    constructor(service: JobInterviewQuestionsService);
    list(company: string | undefined, position: string | undefined, jobPostId: string | undefined, curatedJobId: string | undefined, limit: string | undefined, req: any): Promise<{
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
    create(body: CreateJobInterviewQuestionDto, req: any): Promise<{
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
    upvote(id: string, req: any): Promise<{
        upvoted: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    aiGenerate(body: AiGenerateDto, req: any): Promise<{
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
