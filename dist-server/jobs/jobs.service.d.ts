import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
export declare class JobsService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: SystemConfigService);
    findAll(status?: string, query?: string): Promise<({
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
    findByUser(userId: string): Promise<{
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
    create(userId: string, data: any): Promise<{
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
    update(id: string, userId: string, data: any): Promise<{
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
    recordExternalLinkClick(id: string): Promise<{
        url: string;
    }>;
    createExternalLink(data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<{
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
    updateExternalLink(id: string, data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<{
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
    deleteExternalLink(id: string, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<{
        success: boolean;
    }>;
    getCuratedJobs(filters: {
        jobType?: string;
        experienceLevel?: string;
        companySize?: string;
        industry?: string;
        location?: string;
        q?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
    createCuratedJob(data: any, userId: string, userRole: string, userType: string): Promise<{
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
    updateCuratedJob(id: string, data: any, userId: string, userRole: string, userType?: string): Promise<{
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
    deleteCuratedJob(id: string, userId: string, userRole: string, userType?: string): Promise<{
        success: boolean;
    }>;
    getJobStats(location?: string, type?: string, skill?: string): Promise<{
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
    recordCuratedJobClick(id: string): Promise<{
        sourceUrl: string;
    }>;
}
