import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
export declare class JobsService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: SystemConfigService);
    findAll(status?: string, query?: string): Promise<({
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
    findByUser(userId: string): Promise<{
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
    create(userId: string, data: any): Promise<{
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
    update(id: string, userId: string, data: any): Promise<{
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
    recordExternalLinkClick(id: string): Promise<{
        url: string;
    }>;
    createExternalLink(data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<{
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
    updateExternalLink(id: string, data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<{
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
    createCuratedJob(data: any, userId: string, userRole: string, userType: string): Promise<{
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
    updateCuratedJob(id: string, data: any, userId: string, userRole: string, userType?: string): Promise<{
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
