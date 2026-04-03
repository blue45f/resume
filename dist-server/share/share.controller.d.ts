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
}
