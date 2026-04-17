import { PrismaService } from '../prisma/prisma.service';
export declare class AdminStatsService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
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
}
