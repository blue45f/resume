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
            summary: string;
            id: string;
            email: string;
            name: string;
            resumeId: string;
            phone: string;
            address: string;
            website: string;
            github: string;
            photo: string;
            birthYear: string;
            links: string;
            military: string;
        } | null;
        experiences: {
            description: string;
            achievements: string;
            id: string;
            resumeId: string;
            sortOrder: number;
            company: string;
            position: string;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
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
            description: string;
            link: string;
            id: string;
            name: string;
            role: string;
            resumeId: string;
            sortOrder: number;
            company: string;
            startDate: string;
            endDate: string;
            techStack: string;
        }[];
    } & {
        id: string;
        isSample: boolean;
        createdAt: Date;
        userId: string | null;
        title: string;
        slug: string;
        viewCount: number;
        visibility: string;
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
