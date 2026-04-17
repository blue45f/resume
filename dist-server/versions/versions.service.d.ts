import { PrismaService } from '../prisma/prisma.service';
export declare class VersionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(resumeId: string): Promise<any>;
    findOne(resumeId: string, versionId: string): Promise<any>;
    restore(resumeId: string, versionId: string, userId?: string): Promise<{
        success: boolean;
        restoredVersion: any;
    }>;
}
