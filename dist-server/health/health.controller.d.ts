import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AdminStatsService } from './admin-stats.service';
import { UsageService } from './usage.service';
export declare class HealthController {
    private readonly prisma;
    private readonly config;
    private readonly statsService;
    private readonly usageService;
    constructor(prisma: PrismaService, config: ConfigService, statsService: AdminStatsService, usageService: UsageService);
    ping(): {
        status: string;
        timestamp: string;
        version: string;
        uptime: number;
        env: string;
    };
    check(): Promise<{
        status: string;
        version: string;
        environment: string;
        timestamp: string;
        uptime: number;
        database: string;
        storage: string;
        memory: {
            rss: number;
            heapUsed: number;
        };
        stats: {
            resumes: number;
            users: number;
        };
        providers: {
            google: boolean;
            github: boolean;
            kakao: boolean;
        };
    }>;
    getUsage(req: any): Promise<any>;
    publicStats(): Promise<{
        users: {
            total: any;
            today: any;
            thisWeek: any;
        };
        resumes: {
            total: any;
            public: any;
            today: any;
        };
        activity: {
            totalViews: any;
        };
        content: {
            templates: any;
        };
        community: {
            posts: any;
            comments: any;
        };
        jobs: {
            active: any;
        };
    }>;
    adminStats(req: any): Promise<{
        users: {
            total: any;
            today: any;
            week: any;
            month: any;
        };
        resumes: {
            total: any;
            today: any;
            week: any;
            public: any;
        };
        content: {
            templates: any;
            tags: any;
            comments: any;
            versions: any;
        };
        activity: {
            applications: any;
            transforms: any;
            totalViews: any;
        };
        coaching: {
            totalCoaches: any;
            activeCoaches: any;
            totalSessions: number;
            totalCommission: number;
            byStatus: Record<string, number>;
        };
        recentUsers: any;
    }>;
    private newsCache;
    newsRss(): Promise<any[]>;
    getAnnouncement(): Promise<any>;
    getDraft(type: string, req: any): Promise<any>;
    saveDraft(type: string, body: any, req: any): Promise<{
        success: boolean;
    }>;
    deleteDraft(type: string, req: any): Promise<{
        success: boolean;
    }>;
    sitemapXml(res: Response): Promise<void>;
}
