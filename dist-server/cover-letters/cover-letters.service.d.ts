import { PrismaService } from '../prisma/prisma.service';
export declare class CoverLettersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        company: string;
        content: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        content: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }>;
    create(userId: string, data: {
        resumeId?: string;
        applicationId?: string;
        company: string;
        position: string;
        tone: string;
        jobDescription: string;
        content: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        content: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }>;
    update(id: string, userId: string, data: {
        content?: string;
        company?: string;
        position?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        content: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        company: string;
        content: string;
        position: string;
        updatedAt: Date;
        resumeId: string | null;
        jobDescription: string;
        applicationId: string | null;
        tone: string;
    }[]>;
}
