import { StudyGroupsService, CreateStudyGroupDto, CreateStudyGroupQuestionDto } from './study-groups.service';
export declare class StudyGroupsController {
    private readonly service;
    constructor(service: StudyGroupsService);
    findAll(req: any, q?: string, companyName?: string, jobPostId?: string, jobKey?: string, mine?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: CreateStudyGroupDto, req: any): Promise<$Utils.JsPromise<R>>;
    findOne(id: string, req: any): Promise<any>;
    join(id: string, req: any): Promise<$Utils.JsPromise<R>>;
    leave(id: string, req: any): Promise<$Utils.JsPromise<R>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    listQuestions(id: string, req: any): Promise<any>;
    addQuestion(id: string, body: CreateStudyGroupQuestionDto, req: any): Promise<any>;
}
