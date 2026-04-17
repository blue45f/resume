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
    getUsage(req: any): Promise<{
        feature: string;
        count: number;
    }[]>;
    publicStats(): Promise<{
        users: {
            total: number;
            today: number;
            thisWeek: number;
        };
        resumes: {
            total: number;
            public: number;
            today: number;
        };
        activity: {
            totalViews: number;
        };
        content: {
            templates: number;
        };
        community: {
            posts: number;
            comments: number;
        };
        jobs: {
            active: number;
        };
    }>;
    adminStats(req: any): Promise<{
        users: {
            total: number;
            today: number;
            week: number;
            month: number;
        };
        resumes: {
            total: number;
            today: number;
            week: number;
            public: number;
        };
        content: {
            templates: number;
            tags: number;
            comments: number;
            versions: number;
        };
        activity: {
            applications: number;
            transforms: number;
            totalViews: number;
        };
        coaching: {
            totalCoaches: any;
            activeCoaches: any;
            totalSessions: number;
            totalCommission: number;
            byStatus: Record<string, number>;
        };
        recentUsers: {
            id: string;
            name: string;
            email: string;
            provider: string;
            createdAt: string;
        }[];
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
