import { PrismaService } from '../prisma/prisma.service';
import { SystemConfigService } from '../system-config/system-config.service';
export declare class JobsService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: SystemConfigService);
    findAll(status?: string, query?: string): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string): Promise<any>;
    findByUser(userId: string): Promise<$Public.PrismaPromise<T>>;
    create(userId: string, data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobPostPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, userId: string, data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobPostPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
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
    }): Promise<$Public.PrismaPromise<T>>;
    recordExternalLinkClick(id: string): Promise<{
        url: any;
    }>;
    createExternalLink(data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ExternalJobLinkPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    updateExternalLink(id: string, data: any, user: {
        id?: string;
        role?: string;
        userType?: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ExternalJobLinkPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
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
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCuratedJob(id: string): Promise<any>;
    createCuratedJob(data: any, userId: string, userRole: string, userType: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CuratedJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    updateCuratedJob(id: string, data: any, userId: string, userRole: string, userType?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CuratedJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    deleteCuratedJob(id: string, userId: string, userRole: string, userType?: string): Promise<{
        success: boolean;
    }>;
    getJobStats(location?: string, type?: string, skill?: string): Promise<{
        total: any;
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
        sourceUrl: any;
    }>;
}
