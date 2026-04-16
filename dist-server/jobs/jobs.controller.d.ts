import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    findAll(query?: string, status?: string): Promise<({
        user: {
            id: string;
            name: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findMy(req: any): never[] | Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getExternalLinks(category?: string, companySize?: string, careerLevel?: string, jobType?: string, location?: string, jobCategory?: string, q?: string): Promise<{
        id: string;
        location: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        url: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        category: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }[]>;
    createExternalLink(body: any, req: any): Promise<{
        id: string;
        location: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        url: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        category: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }>;
    recordClick(id: string): Promise<{
        url: string;
    }>;
    updateExternalLink(id: string, body: any, req: any): Promise<{
        id: string;
        location: string;
        description: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        url: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        category: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }>;
    deleteExternalLink(id: string, req: any): Promise<{
        success: boolean;
    }>;
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
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: any, req: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        location: string;
        salary: string;
        description: string;
        requirements: string;
        benefits: string;
        type: string;
        status: string;
        skills: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
