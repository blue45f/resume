import { JobsService } from './jobs.service';
export declare class JobsController {
    private readonly service;
    constructor(service: JobsService);
    findAll(query?: string, status?: string): Promise<$Public.PrismaPromise<T>>;
    getStats(location?: string, type?: string, skill?: string): Promise<{
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
    findMy(req: any): Promise<$Public.PrismaPromise<T>> | never[];
    getExternalLinks(category?: string, companySize?: string, careerLevel?: string, jobType?: string, location?: string, jobCategory?: string, q?: string): Promise<$Public.PrismaPromise<T>>;
    createExternalLink(body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ExternalJobLinkPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    recordClick(id: string): Promise<{
        url: any;
    }>;
    updateExternalLink(id: string, body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ExternalJobLinkPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    deleteExternalLink(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getCuratedJobs(jobType?: string, experienceLevel?: string, companySize?: string, industry?: string, location?: string, q?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getCuratedJob(id: string): Promise<any>;
    createCuratedJob(body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CuratedJobPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    updateCuratedJob(id: string, body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CuratedJobPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    deleteCuratedJob(id: string, req: any): Promise<{
        success: boolean;
    }>;
    recordCuratedJobClick(id: string): Promise<{
        sourceUrl: any;
    }>;
    findOne(id: string): Promise<any>;
    create(body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobPostPayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobPostPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
