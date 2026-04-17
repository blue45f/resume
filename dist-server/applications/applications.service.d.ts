import { PrismaService } from '../prisma/prisma.service';
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId: string): Promise<{
        id: string;
        userId: string | null;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
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
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
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
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    findOne(id: string): Promise<{
        id: string;
        userId: string | null;
        resumeId: string | null;
        company: string;
        position: string;
        url: string | null;
        status: string;
        appliedDate: string | null;
        notes: string | null;
        salary: string | null;
        location: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    getComments(applicationId: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        authorName: string;
        content: string;
    }[]>;
    addComment(applicationId: string, content: string, userId?: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        applicationId: string;
        authorName: string;
        content: string;
    }>;
}
