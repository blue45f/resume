import { PrismaService } from '../prisma/prisma.service';
export declare class AttachmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    upload(resumeId: string, file: Express.Multer.File, category: string, description: string): Promise<{
        id: any;
        resumeId: any;
        originalName: any;
        mimeType: any;
        size: any;
        category: any;
        description: any;
        downloadUrl: string;
        createdAt: any;
    }>;
    findAll(resumeId: string): Promise<{
        id: any;
        resumeId: any;
        originalName: any;
        mimeType: any;
        size: any;
        category: any;
        description: any;
        downloadUrl: string;
        createdAt: any;
    }[]>;
    getFilePath(id: string): Promise<{
        path: string;
        originalName: string;
        mimeType: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    private format;
}
