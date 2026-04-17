import { InterviewService, CreateInterviewAnswerDto } from './interview.service';
export declare class InterviewController {
    private readonly service;
    constructor(service: InterviewService);
    findAll(req: any): Promise<{
        id: string;
        createdAt: Date;
        resumeId: string | null;
        jobRole: string | null;
        question: string;
        answer: string;
    }[]>;
    create(body: CreateInterviewAnswerDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        resumeId: string | null;
        jobRole: string | null;
        question: string;
        answer: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
