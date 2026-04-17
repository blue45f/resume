import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserDashboard(userId: string): Promise<{
        summary: {
            totalResumes: any;
            publicResumes: any;
            totalViews: any;
            totalTransforms: any;
            recentEdits: $Public.PrismaPromise<T>;
        };
        resumes: any;
        recentVersions: any;
    }>;
    getResumeTrend(resumeId: string): Promise<any>;
    getResumeAnalytics(resumeId: string): Promise<{
        viewCount: any;
        commentCount: any;
        bookmarkCount: any;
        shareCount: any;
        versionCount: any;
        visibility: any;
        createdAt: any;
        updatedAt: any;
    } | null>;
    getPopularSkills(limit?: number): Promise<{
        name: string;
        count: number;
    }[]>;
}
