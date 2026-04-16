import { PrismaService } from '../prisma/prisma.service';
export declare class JobsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(status?: string, query?: string): Promise<({
        user: {
            id: string;
            name: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        description: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    })[]>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        description: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    findByUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        description: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }[]>;
    create(userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        description: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    update(id: string, userId: string, data: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        description: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    remove(id: string, userId: string, role?: string): Promise<{
        success: boolean;
    }>;
    getExternalLinks(filters: {
        category?: string;
        companySize?: string;
        careerLevel?: string;
        jobType?: string;
        location?: string;
        jobCategory?: string;
        q?: string;
    }): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        description: string;
        location: string;
        badgeText: string;
        logoEmoji: string;
        logoUrl: string;
        gradientFrom: string;
        gradientTo: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }[]>;
    recordExternalLinkClick(id: string): Promise<{
        url: string;
    }>;
    createExternalLink(data: any, role: string): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        description: string;
        location: string;
        badgeText: string;
        logoEmoji: string;
        logoUrl: string;
        gradientFrom: string;
        gradientTo: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }>;
    updateExternalLink(id: string, data: any, role: string): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        description: string;
        location: string;
        badgeText: string;
        logoEmoji: string;
        logoUrl: string;
        gradientFrom: string;
        gradientTo: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }>;
    deleteExternalLink(id: string, role: string): Promise<{
        success: boolean;
    }>;
}
