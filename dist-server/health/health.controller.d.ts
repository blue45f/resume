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
        };
        resumes: {
            total: number;
        };
        activity: {
            totalViews: number;
        };
        content: {
            templates: number;
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
        recentUsers: {
            id: string;
            name: string;
            email: string;
            provider: string;
            createdAt: string;
        }[];
    }>;
    sitemapXml(res: Response): Promise<void>;
}
