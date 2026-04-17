import { PrismaService } from '../prisma/prisma.service';
export declare class AdminStatsService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(): Promise<{
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
}
