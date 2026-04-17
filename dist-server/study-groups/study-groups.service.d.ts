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
    findOne(id: string, userId?: string): Promise<{
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
    create(userId: string, data: CreateStudyGroupDto): Promise<{
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
    join(groupId: string, userId: string): Promise<{
        id: string;
        role: string;
        userId: string;
        joinedAt: Date;
        groupId: string;
    }>;
    leave(groupId: string, userId: string): Promise<{
        success: boolean;
    }>;
    remove(groupId: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
    addQuestion(groupId: string, userId: string, data: CreateStudyGroupQuestionDto): Promise<{
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
    listQuestions(groupId: string, userId?: string): Promise<({
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
}
