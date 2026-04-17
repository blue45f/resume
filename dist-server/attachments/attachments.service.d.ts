import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class AttachmentsService {
    private prisma;
    private config;
    private useCloudinary;
    constructor(prisma: PrismaService, config: ConfigService);
    upload(resumeId: string, file: Express.Multer.File, category: string, description: string, userId?: string, role?: string): Promise<{
        id: any;
        resumeId: any;
        originalName: any;
        mimeType: any;
        size: any;
        category: any;
        description: any;
        downloadUrl: any;
        createdAt: any;
    }>;
    findAll(resumeId: string, userId?: string, role?: string): Promise<any>;
    getFileData(id: string, userId?: string): Promise<{
        redirectUrl: any;
        originalName: any;
        mimeType: any;
        data?: undefined;
    } | {
        data: Buffer<ArrayBuffer> | null;
        originalName: any;
        mimeType: any;
        redirectUrl?: undefined;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
    removeAllByResume(resumeId: string): Promise<void>;
    private deleteFromCloudinary;
    private format;
}
