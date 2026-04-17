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
            summary: string;
            id: string;
            resumeId: string;
            email: string;
            github: string;
            links: string;
            phone: string;
            address: string;
            website: string;
            photo: string;
            birthYear: string;
            military: string;
        } | null;
        experiences: {
            description: string;
            id: string;
            resumeId: string;
            company: string;
            position: string;
            sortOrder: number;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            achievements: string;
            techStack: string;
        }[];
        educations: {
            description: string;
            id: string;
            resumeId: string;
            sortOrder: number;
            startDate: string;
            endDate: string;
            school: string;
            degree: string;
            field: string;
            gpa: string;
        }[];
        skills: {
            id: string;
            resumeId: string;
            category: string;
            items: string;
            sortOrder: number;
        }[];
        projects: {
            name: string;
            description: string;
            id: string;
            resumeId: string;
            company: string;
            link: string;
            role: string;
            sortOrder: number;
            startDate: string;
            endDate: string;
            techStack: string;
        }[];
    } & {
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        isSample: boolean;
        title: string;
        slug: string;
        viewCount: number;
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
    removeLink(id: string, userId?: string, role?: string): Promise<{
        success: boolean;
    }>;
}
