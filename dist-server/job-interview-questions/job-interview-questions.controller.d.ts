import { JobInterviewQuestionsService, CreateJobInterviewQuestionDto, AiGenerateDto } from './job-interview-questions.service';
export declare class JobInterviewQuestionsController {
    private readonly service;
    constructor(service: JobInterviewQuestionsService);
    list(company: string | undefined, position: string | undefined, jobPostId: string | undefined, curatedJobId: string | undefined, limit: string | undefined, req: any): Promise<any>;
    create(body: CreateJobInterviewQuestionDto, req: any): Promise<any>;
    upvote(id: string, req: any): Promise<{
        upvoted: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    aiGenerate(body: AiGenerateDto, req: any): Promise<{
        questions: $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
        persisted: boolean;
        provider: string;
        model: string;
    }>;
}
