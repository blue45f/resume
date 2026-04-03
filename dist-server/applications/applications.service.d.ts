import { PrismaService } from '../prisma/prisma.service';
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }[]>;
    getStats(userId: string): Promise<{
        total: number;
        byStatus: Record<string, number>;
    }>;
    create(data: {
        company: string;
        position: string;
        url?: string;
        status?: string;
        appliedDate?: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }, userId: string): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }>;
    update(id: string, data: Partial<{
        company: string;
        position: string;
        url?: string;
        status: string;
        notes?: string;
        salary?: string;
        location?: string;
        resumeId?: string;
    }>, userId: string): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    findOne(id: string): Promise<{
        id: string;
        userId: string | null;
        company: string;
        position: string;
        location: string | null;
        salary: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        resumeId: string | null;
        url: string | null;
        appliedDate: string | null;
        notes: string | null;
        visibility: string;
    } | null>;
    getComments(applicationId: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        content: string;
        authorName: string;
    }[]>;
    addComment(applicationId: string, content: string, userId?: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        content: string;
        authorName: string;
    }>;
}
