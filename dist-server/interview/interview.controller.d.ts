import { InterviewService, CreateInterviewAnswerDto } from './interview.service';
export declare class InterviewController {
    private readonly service;
    constructor(service: InterviewService);
    findAll(req: any): Promise<any>;
    create(body: CreateInterviewAnswerDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
