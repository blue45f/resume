import { ResumesService } from '../resumes/resumes.service';
import { ShareService } from './share.service';
import { CreateShareLinkDto } from './dto/share.dto';
export declare class ShareController {
    private readonly shareService;
    private readonly resumesService;
    constructor(shareService: ShareService, resumesService: ResumesService);
    createLink(resumeId: string, dto: CreateShareLinkDto, req: any): Promise<{
        id: string;
        token: string;
        url: string;
        expiresAt: string | null;
        hasPassword: boolean;
        createdAt: string;
    }>;
    getLinks(resumeId: string, req: any): Promise<{
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
            github: string;
            id: string;
            email: string;
            name: string;
            resumeId: string;
            phone: string;
            address: string;
            website: string;
            summary: string;
            photo: string;
            birthYear: string;
            links: string;
            military: string;
        } | null;
        experiences: {
            id: string;
            resumeId: string;
            sortOrder: number;
            company: string;
            position: string;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            description: string;
            achievements: string;
            techStack: string;
        }[];
        educations: {
            id: string;
            resumeId: string;
            sortOrder: number;
            startDate: string;
            endDate: string;
            description: string;
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
            link: string;
            id: string;
            name: string;
            role: string;
            resumeId: string;
            sortOrder: number;
            company: string;
            startDate: string;
            endDate: string;
            description: string;
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
}
