import { PrismaService } from '../prisma/prisma.service';
export declare class ShareService {
    private prisma;
    constructor(prisma: PrismaService);
    createLink(resumeId: string, options?: {
        expiresInHours?: number;
        password?: string;
    }): Promise<{
        id: string;
        token: string;
        url: string;
        expiresAt: string | null;
        hasPassword: boolean;
        createdAt: string;
    }>;
    getByToken(token: string, password?: string): Promise<{
        personalInfo: {
            name: string;
            email: string;
            phone: string;
            address: string;
            website: string;
            summary: string;
            id: string;
            resumeId: string;
        } | null;
        experiences: {
            id: string;
            company: string;
            position: string;
            startDate: string;
            endDate: string;
            current: boolean;
            description: string;
            sortOrder: number;
            resumeId: string;
        }[];
        educations: {
            id: string;
            startDate: string;
            endDate: string;
            description: string;
            sortOrder: number;
            school: string;
            degree: string;
            field: string;
            resumeId: string;
        }[];
        skills: {
            id: string;
            sortOrder: number;
            category: string;
            items: string;
            resumeId: string;
        }[];
        projects: {
            name: string;
            id: string;
            startDate: string;
            endDate: string;
            description: string;
            sortOrder: number;
            role: string;
            link: string;
            resumeId: string;
        }[];
    } & {
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getLinksForResume(resumeId: string): Promise<{
        id: string;
        token: string;
        url: string;
        expiresAt: string | null;
        hasPassword: boolean;
        isExpired: boolean;
        createdAt: string;
    }[]>;
    removeLink(id: string): Promise<{
        success: boolean;
    }>;
}
