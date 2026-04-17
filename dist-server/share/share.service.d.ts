import { PrismaService } from '../prisma/prisma.service';
export declare class ShareService {
    private prisma;
    constructor(prisma: PrismaService);
    createLink(resumeId: string, options?: {
        expiresInHours?: number;
        password?: string;
    }): Promise<{
        id: any;
        token: any;
        url: string;
        expiresAt: any;
        hasPassword: boolean;
        createdAt: any;
    }>;
    getByToken(token: string, password?: string): Promise<any>;
    getLinksForResume(resumeId: string): Promise<any>;
    removeLink(id: string): Promise<{
        success: boolean;
    }>;
}
