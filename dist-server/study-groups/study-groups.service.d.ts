import { PrismaService } from '../prisma/prisma.service';
export interface StudyGroupListFilters {
    q?: string;
    companyName?: string;
    jobPostId?: string;
    jobKey?: string;
    companyTier?: string;
    cafeCategory?: string;
    experienceLevel?: string;
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
    companyTier?: string;
    cafeCategory?: string;
    experienceLevel?: string;
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
            experienceLevel: string;
            jobKey: string | null;
            companyTier: string;
            cafeCategory: string;
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
        experienceLevel: string;
        jobKey: string | null;
        companyTier: string;
        cafeCategory: string;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    create(userId: string, data: CreateStudyGroupDto): Promise<{
        name: string;
        description: string;
        id: string;
        position: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyName: string | null;
        jobPostId: string | null;
        experienceLevel: string;
        jobKey: string | null;
        companyTier: string;
        cafeCategory: string;
        ownerId: string;
        isPrivate: boolean;
        maxMembers: number;
        memberCount: number;
    }>;
    join(groupId: string, userId: string): Promise<{
        id: string;
        userId: string;
        role: string;
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
    listQuestions(groupId: string, userId?: string): Promise<({
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
}
