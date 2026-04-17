import { PrismaService } from '../prisma/prisma.service';
export declare class VersionsService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertOwnership;
    findAll(resumeId: string, userId?: string, role?: string): Promise<any>;
    findOne(resumeId: string, versionId: string, userId?: string, role?: string): Promise<any>;
    restore(resumeId: string, versionId: string, userId?: string, role?: string): Promise<{
        success: boolean;
        restoredVersion: any;
    }>;
}
