import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getUserDashboard(userId: string): Promise<{
        summary: {
            totalResumes: number;
            publicResumes: number;
            totalViews: number;
            totalTransforms: number;
            recentEdits: number;
        };
        resumes: {
            id: string;
            title: string;
            viewCount: number;
            visibility: string;
            updatedAt: string;
        }[];
        recentVersions: {
            id: string;
            versionNumber: number;
            resumeId: string;
            createdAt: string;
        }[];
    }>;
    getResumeTrend(resumeId: string): Promise<{
        version: number;
        sections: number;
        createdAt: string;
    }[]>;
    getResumeAnalytics(resumeId: string): Promise<{
        viewCount: number;
        commentCount: number;
        bookmarkCount: number;
        shareCount: number;
        versionCount: number;
        visibility: string;
        createdAt: string;
        updatedAt: string;
    } | null>;
    getPopularSkills(limit?: number): Promise<{
        name: string;
        count: number;
    }[]>;
}
