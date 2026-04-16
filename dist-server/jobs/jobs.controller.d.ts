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
    findMy(req: any): never[] | Promise<{
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
    create(body: any, req: any): Promise<{
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
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getExternalLinks(category?: string, companySize?: string, careerLevel?: string, jobType?: string, location?: string, jobCategory?: string, q?: string): Promise<{
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
        matchKeywords: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }[]>;
    recordClick(id: string): Promise<{
        url: string;
    }>;
    createExternalLink(body: any, req: any): Promise<{
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
        matchKeywords: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        isActive: boolean;
        order: number;
        clickCount: number;
    }>;
    updateExternalLink(id: string, body: any, req: any): Promise<{
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
        matchKeywords: string;
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
}
