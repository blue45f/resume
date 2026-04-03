import { PrismaService } from '../prisma/prisma.service';
export declare class CoverLettersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        content: string;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
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
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }>;
    update(id: string, userId: string, data: {
        content?: string;
        company?: string;
        position?: string;
    }): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, userId: string): Promise<{
        id: string;
        userId: string;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        applicationId: string | null;
        tone: string;
        jobDescription: string;
        content: string;
    }[]>;
}
