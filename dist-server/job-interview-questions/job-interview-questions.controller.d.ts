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
    create(body: CreateJobInterviewQuestionDto, req: any): Promise<{
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
