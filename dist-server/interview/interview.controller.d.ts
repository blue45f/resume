import { InterviewService, CreateInterviewAnswerDto } from './interview.service';
export declare class InterviewController {
    private readonly service;
    constructor(service: InterviewService);
    findAll(req: any): Promise<{
        id: string;
        resumeId: string | null;
        createdAt: Date;
        question: string;
        answer: string;
        jobRole: string | null;
    }[]>;
    create(body: CreateInterviewAnswerDto, req: any): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        createdAt: Date;
        question: string;
        answer: string;
        jobRole: string | null;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
