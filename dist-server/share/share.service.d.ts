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
        skills: {
            id: string;
            resumeId: string;
            category: string;
            sortOrder: number;
            items: string;
        }[];
        personalInfo: {
            id: string;
            email: string;
            name: string;
            resumeId: string;
            phone: string;
            address: string;
            website: string;
            github: string;
            summary: string;
            photo: string;
            birthYear: string;
            links: string;
            military: string;
        } | null;
        experiences: {
            id: string;
            company: string;
            position: string;
            description: string;
            resumeId: string;
            sortOrder: number;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            achievements: string;
            techStack: string;
        }[];
        educations: {
            id: string;
            description: string;
            resumeId: string;
            sortOrder: number;
            startDate: string;
            endDate: string;
            school: string;
            degree: string;
            field: string;
            gpa: string;
        }[];
        projects: {
            id: string;
            company: string;
            description: string;
            name: string;
            role: string;
            link: string;
            resumeId: string;
            sortOrder: number;
            startDate: string;
            endDate: string;
            techStack: string;
        }[];
    } & {
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: string;
        viewCount: number;
        title: string;
        slug: string;
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
