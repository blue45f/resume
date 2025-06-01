import { ShareService } from './share.service';
import { CreateShareLinkDto } from './dto/share.dto';
export declare class ShareController {
    private readonly shareService;
    constructor(shareService: ShareService);
    createLink(resumeId: string, dto: CreateShareLinkDto): Promise<{
        id: string;
        token: string;
        url: string;
        expiresAt: string | null;
        hasPassword: boolean;
        createdAt: string;
    }>;
    getLinks(resumeId: string): Promise<{
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
    getShared(token: string, password?: string): Promise<{
        personalInfo: {
            id: string;
            email: string;
            name: string;
            summary: string;
            phone: string;
            address: string;
            website: string;
            resumeId: string;
        } | null;
        experiences: {
            id: string;
            description: string;
            company: string;
            position: string;
            startDate: string;
            endDate: string;
            current: boolean;
            sortOrder: number;
            resumeId: string;
        }[];
        educations: {
            id: string;
            description: string;
            startDate: string;
            endDate: string;
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
            id: string;
            name: string;
            link: string;
            description: string;
            startDate: string;
            endDate: string;
            sortOrder: number;
            role: string;
            resumeId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        title: string;
        visibility: string;
        userId: string | null;
        updatedAt: Date;
    }>;
}
