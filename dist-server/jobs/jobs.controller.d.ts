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
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
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
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }[]>;
    getExternalLinks(category?: string, companySize?: string, careerLevel?: string, jobType?: string, location?: string, jobCategory?: string, q?: string): Promise<{
        description: string;
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        location: string;
        isActive: boolean;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        order: number;
        clickCount: number;
    }[]>;
    createExternalLink(body: any, req: any): Promise<{
        description: string;
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        location: string;
        isActive: boolean;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        order: number;
        clickCount: number;
    }>;
    recordClick(id: string): Promise<{
        url: string;
    }>;
    updateExternalLink(id: string, body: any, req: any): Promise<{
        description: string;
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        location: string;
        isActive: boolean;
        logoEmoji: string;
        logoUrl: string;
        badgeText: string;
        gradientFrom: string;
        gradientTo: string;
        matchKeywords: string;
        companySize: string;
        jobTypes: string;
        careerLevel: string;
        jobCategory: string;
        order: number;
        clickCount: number;
    }>;
    deleteExternalLink(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getCuratedJobs(jobType?: string, experienceLevel?: string, companySize?: string, industry?: string, location?: string, q?: string, page?: string, limit?: string): Promise<{
        items: ({
            author: {
                id: string;
                name: string;
                companyName: string | null;
            } | null;
        } & {
            summary: string;
            education: string;
            id: string;
            createdAt: Date;
            viewCount: number;
            updatedAt: Date;
            skills: string;
            company: string;
            position: string;
            department: string;
            status: string;
            salary: string;
            location: string;
            requirements: string;
            benefits: string;
            companySize: string;
            clickCount: number;
            companyLogo: string;
            jobType: string;
            experienceLevel: string;
            industry: string;
            sourceUrl: string;
            sourceSite: string;
            deadline: Date | null;
            isRolling: boolean;
            authorId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCuratedJob(id: string): Promise<{
        author: {
            id: string;
            name: string;
            companyName: string | null;
        } | null;
    } & {
        summary: string;
        education: string;
        id: string;
        createdAt: Date;
        viewCount: number;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        department: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
        companySize: string;
        clickCount: number;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        authorId: string | null;
    }>;
    createCuratedJob(body: any, req: any): Promise<{
        summary: string;
        education: string;
        id: string;
        createdAt: Date;
        viewCount: number;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        department: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
        companySize: string;
        clickCount: number;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        authorId: string | null;
    }>;
    updateCuratedJob(id: string, body: any, req: any): Promise<{
        summary: string;
        education: string;
        id: string;
        createdAt: Date;
        viewCount: number;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        department: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
        companySize: string;
        clickCount: number;
        companyLogo: string;
        jobType: string;
        experienceLevel: string;
        industry: string;
        sourceUrl: string;
        sourceSite: string;
        deadline: Date | null;
        isRolling: boolean;
        authorId: string | null;
    }>;
    deleteCuratedJob(id: string, req: any): Promise<{
        success: boolean;
    }>;
    recordCuratedJobClick(id: string): Promise<{
        sourceUrl: string;
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
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
        type: string;
        status: string;
        salary: string;
        location: string;
        requirements: string;
        benefits: string;
    }>;
    create(body: any, req: any): Promise<{
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
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
        description: string;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        skills: string;
        company: string;
        position: string;
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
}
