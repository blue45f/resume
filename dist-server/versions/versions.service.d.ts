import { PrismaService } from '../prisma/prisma.service';
export declare class VersionsService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertOwnership;
    findAll(resumeId: string, userId?: string, role?: string): Promise<{
        createdAt: string;
        description: string;
        id: string;
        versionNumber: number;
    }[]>;
    findOne(resumeId: string, versionId: string, userId?: string, role?: string): Promise<{
        snapshot: any;
        createdAt: string;
        description: string;
        id: string;
        resumeId: string;
        versionNumber: number;
    }>;
    restore(resumeId: string, versionId: string, userId?: string, role?: string): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
}
