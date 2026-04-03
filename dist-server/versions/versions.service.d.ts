import { PrismaService } from '../prisma/prisma.service';
export declare class VersionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(resumeId: string): Promise<{
        createdAt: string;
        description: string;
        id: string;
        versionNumber: number;
    }[]>;
    findOne(resumeId: string, versionId: string): Promise<{
        snapshot: any;
        createdAt: string;
        description: string;
        id: string;
        resumeId: string;
        versionNumber: number;
    }>;
    restore(resumeId: string, versionId: string, userId?: string): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
}
