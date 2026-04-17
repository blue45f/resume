import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    findAll(query?: string, status?: string): Promise<({
        user: {
            name: string;
            id: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        description: string;
        id: string;
        userId: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        skills: string;
        type: string;
        requirements: string;
        benefits: string;
    })[]>;
    getStats(location?: string, type?: string, skill?: string): Promise<{
        total: number;
        byCompany: {
            name: string;
            count: number;
        }[];
        byLocation: {
            name: string;
            count: number;
        }[];
        byType: {
            name: string;
            count: number;
        }[];
        bySkill: {
            name: string;
            count: number;
        }[];
        byMonth: {
            month: string;
            count: number;
        }[];
    }>;
    findMy(req: any): never[] | Promise<{
        description: string;
        id: string;
        userId: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        skills: string;
        type: string;
        requirements: string;
        benefits: string;
    }[]>;
    getExternalLinks(category?: string, companySize?: string, careerLevel?: string, jobType?: string, location?: string, jobCategory?: string, q?: string): Promise<{
        name: string;
        description: string;
        id: string;
        url: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        isActive: boolean;
        order: number;
        companySize: string;
        clickCount: number;
        careerLevel: string;
        jobCategory: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        jobTypes: string;
    }[]>;
    createExternalLink(body: any, req: any): Promise<{
        name: string;
        description: string;
        id: string;
        url: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        isActive: boolean;
        order: number;
        companySize: string;
        clickCount: number;
        careerLevel: string;
        jobCategory: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        jobTypes: string;
    }>;
    recordClick(id: string): Promise<{
        url: string;
    }>;
    updateExternalLink(id: string, body: any, req: any): Promise<{
        name: string;
        description: string;
        id: string;
        url: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        isActive: boolean;
        order: number;
        companySize: string;
        clickCount: number;
        careerLevel: string;
        jobCategory: string;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        jobTypes: string;
    }>;
    deleteExternalLink(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getCuratedJobs(jobType?: string, experienceLevel?: string, companySize?: string, industry?: string, location?: string, q?: string, page?: string, limit?: string): Promise<{
        items: ({
            author: {
                name: string;
                id: string;
                companyName: string | null;
            } | null;
        } & {
            summary: string;
            id: string;
            company: string;
            position: string;
            status: string;
            salary: string;
            location: string;
            createdAt: Date;
            updatedAt: Date;
            viewCount: number;
            skills: string;
            department: string;
            authorId: string | null;
            requirements: string;
            benefits: string;
            companyLogo: string;
            jobType: string;
            experienceLevel: string;
            education: string;
            companySize: string;
            industry: string;
            sourceUrl: string;
            sourceSite: string;
            deadline: Date | null;
            isRolling: boolean;
            clickCount: number;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCuratedJob(id: string): Promise<{
        author: {
            name: string;
            id: string;
            companyName: string | null;
        } | null;
    } & {
        summary: string;
        id: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        viewCount: number;
        skills: string;
        department: string;
        authorId: string | null;
        requirements: string;
        benefits: string;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        education: string;
        companySize: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        clickCount: number;
    }>;
    createCuratedJob(body: any, req: any): Promise<{
        summary: string;
        id: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        viewCount: number;
        skills: string;
        department: string;
        authorId: string | null;
        requirements: string;
        benefits: string;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        education: string;
        companySize: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        clickCount: number;
    }>;
    updateCuratedJob(id: string, body: any, req: any): Promise<{
        summary: string;
        id: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        viewCount: number;
        skills: string;
        department: string;
        authorId: string | null;
        requirements: string;
        benefits: string;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        education: string;
        companySize: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        clickCount: number;
    }>;
    deleteCuratedJob(id: string, req: any): Promise<{
        success: boolean;
    }>;
    recordCuratedJobClick(id: string): Promise<{
        sourceUrl: string;
    }>;
    findOne(id: string): Promise<{
        user: {
            name: string;
            id: string;
            email: string;
            avatar: string;
            companyName: string | null;
        };
    } & {
        description: string;
        id: string;
        userId: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        skills: string;
        type: string;
        requirements: string;
        benefits: string;
    }>;
    create(body: any, req: any): Promise<{
        description: string;
        id: string;
        userId: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        skills: string;
        type: string;
        requirements: string;
        benefits: string;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        description: string;
        id: string;
        userId: string;
        company: string;
        position: string;
        status: string;
        salary: string;
        location: string;
        createdAt: Date;
        updatedAt: Date;
        skills: string;
        type: string;
        requirements: string;
        benefits: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
