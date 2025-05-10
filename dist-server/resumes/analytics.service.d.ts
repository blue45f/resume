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
}
