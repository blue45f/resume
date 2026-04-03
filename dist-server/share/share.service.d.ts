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
            github: string;
            links: string;
            phone: string;
            address: string;
            website: string;
            photo: string;
            birthYear: string;
            military: string;
            resumeId: string;
        } | null;
        experiences: {
            description: string;
            achievements: string;
            id: string;
            company: string;
            position: string;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            techStack: string;
            sortOrder: number;
            resumeId: string;
        }[];
        educations: {
            description: string;
            id: string;
            startDate: string;
            endDate: string;
            sortOrder: number;
            school: string;
            degree: string;
            field: string;
            gpa: string;
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
            description: string;
            link: string;
            id: string;
            name: string;
            role: string;
            company: string;
            startDate: string;
            endDate: string;
            techStack: string;
            sortOrder: number;
            resumeId: string;
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
