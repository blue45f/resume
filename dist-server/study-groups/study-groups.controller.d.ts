import { StudyGroupsService, CreateStudyGroupDto, CreateStudyGroupQuestionDto } from './study-groups.service';
export declare class StudyGroupsController {
    private readonly service;
    constructor(service: StudyGroupsService);
    findAll(req: any, q?: string, companyName?: string, jobPostId?: string, jobKey?: string, mine?: string, page?: string, limit?: string): Promise<{
        items: ({
            owner: {
                name: string;
                id: string;
                avatar: string;
            };
        } & {
            name: string;
            description: string;
            id: string;
            position: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyName: string | null;
            jobPostId: string | null;
            jobKey: string | null;
            ownerId: string;
            isPrivate: boolean;
            maxMembers: number;
            memberCount: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(body: CreateStudyGroupDto, req: any): Promise<{
        name: string;
        description: string;
        id: string;
        position: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyName: string | null;
        jobPostId: string | null;
        jobKey: string | null;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    findOne(id: string, req: any): Promise<{
        owner: {
            name: string;
            id: string;
            avatar: string;
        };
        members: ({
            user: {
                name: string;
                id: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            role: string;
            joinedAt: Date;
            groupId: string;
        })[];
    } & {
        name: string;
        description: string;
        id: string;
        position: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyName: string | null;
        jobPostId: string | null;
        jobKey: string | null;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    join(id: string, req: any): Promise<{
        id: string;
        userId: string;
        role: string;
        joinedAt: Date;
        groupId: string;
    }>;
    leave(id: string, req: any): Promise<{
        success: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    listQuestions(id: string, req: any): Promise<({
        user: {
            name: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        category: string;
        question: string;
        sampleAnswer: string;
        difficulty: string;
        upvotes: number;
        groupId: string;
    })[]>;
    addQuestion(id: string, body: CreateStudyGroupQuestionDto, req: any): Promise<{
        user: {
            name: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        category: string;
        question: string;
        sampleAnswer: string;
        difficulty: string;
        upvotes: number;
        groupId: string;
    }>;
}
