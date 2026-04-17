import { PrismaService } from '../prisma/prisma.service';
export interface StudyGroupListFilters {
    q?: string;
    companyName?: string;
    jobPostId?: string;
    jobKey?: string;
    mine?: boolean;
    userId?: string;
    page?: number;
    limit?: number;
}
export interface CreateStudyGroupDto {
    name: string;
    description?: string;
    jobPostId?: string | null;
    jobKey?: string | null;
    companyName?: string | null;
    position?: string | null;
    isPrivate?: boolean;
    maxMembers?: number;
}
export interface CreateStudyGroupQuestionDto {
    question: string;
    sampleAnswer?: string;
    category?: string;
    difficulty?: string;
}
export declare class StudyGroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters: StudyGroupListFilters): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string, userId?: string): Promise<any>;
    create(userId: string, data: CreateStudyGroupDto): Promise<$Utils.JsPromise<R>>;
    join(groupId: string, userId: string): Promise<$Utils.JsPromise<R>>;
    leave(groupId: string, userId: string): Promise<$Utils.JsPromise<R>>;
    remove(groupId: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
    addQuestion(groupId: string, userId: string, data: CreateStudyGroupQuestionDto): Promise<any>;
    listQuestions(groupId: string, userId?: string): Promise<any>;
}
