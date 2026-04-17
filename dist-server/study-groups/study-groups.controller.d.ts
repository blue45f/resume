import { StudyGroupsService, CreateStudyGroupDto, CreateStudyGroupQuestionDto } from './study-groups.service';
export declare class StudyGroupsController {
    private readonly service;
    constructor(service: StudyGroupsService);
    findAll(req: any, q?: string, companyName?: string, jobPostId?: string, jobKey?: string, mine?: string, page?: string, limit?: string): Promise<{
        items: ({
            owner: {
                id: string;
                name: string;
                avatar: string;
            };
        } & {
            description: string;
            id: string;
            name: string;
            companyName: string | null;
            createdAt: Date;
            updatedAt: Date;
            position: string | null;
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
        description: string;
        id: string;
        name: string;
        companyName: string | null;
        createdAt: Date;
        updatedAt: Date;
        position: string | null;
        jobPostId: string | null;
        jobKey: string | null;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    findOne(id: string, req: any): Promise<{
        owner: {
            id: string;
            name: string;
            avatar: string;
        };
        members: ({
            user: {
                id: string;
                name: string;
                avatar: string;
            };
        } & {
            id: string;
            role: string;
            userId: string;
            joinedAt: Date;
            groupId: string;
        })[];
    } & {
        description: string;
        id: string;
        name: string;
        companyName: string | null;
        createdAt: Date;
        updatedAt: Date;
        position: string | null;
        jobPostId: string | null;
        jobKey: string | null;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    join(id: string, req: any): Promise<{
        id: string;
        role: string;
        userId: string;
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
            id: string;
            name: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        category: string;
        difficulty: string;
        question: string;
        groupId: string;
        sampleAnswer: string;
        upvotes: number;
    })[]>;
    addQuestion(id: string, body: CreateStudyGroupQuestionDto, req: any): Promise<{
        user: {
            id: string;
            name: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        category: string;
        difficulty: string;
        question: string;
        groupId: string;
        sampleAnswer: string;
        upvotes: number;
    }>;
}
