import { PrismaService } from '../prisma/prisma.service';
export declare class CoverLettersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
    }[]>;
    findOne(id: string, userId: string): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
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
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }>;
    update(id: string, userId: string, data: {
        content?: string;
        company?: string;
        position?: string;
    }): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, userId: string): Promise<{
        id: string;
        userId: string;
        resumeId: string | null;
        company: string;
        position: string;
        createdAt: Date;
        updatedAt: Date;
        applicationId: string | null;
        content: string;
        tone: string;
        jobDescription: string;
    }[]>;
}
