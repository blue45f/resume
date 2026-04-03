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
            github: string;
            id: string;
            email: string;
            name: string;
            summary: string;
            resumeId: string;
            phone: string;
            address: string;
            website: string;
            photo: string;
            birthYear: string;
            links: string;
            military: string;
        } | null;
        experiences: {
            id: string;
            company: string;
            description: string;
            resumeId: string;
            position: string;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            achievements: string;
            techStack: string;
            sortOrder: number;
        }[];
        educations: {
            id: string;
            description: string;
            resumeId: string;
            startDate: string;
            endDate: string;
            school: string;
            degree: string;
            field: string;
            gpa: string;
            sortOrder: number;
        }[];
        skills: {
            id: string;
            resumeId: string;
            category: string;
            items: string;
            sortOrder: number;
        }[];
        projects: {
            link: string;
            id: string;
            name: string;
            role: string;
            company: string;
            description: string;
            resumeId: string;
            startDate: string;
            endDate: string;
            techStack: string;
            sortOrder: number;
        }[];
    } & {
        id: string;
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
