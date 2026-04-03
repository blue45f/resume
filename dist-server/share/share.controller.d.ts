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
            id: string;
            resumeId: string;
            name: string;
            email: string;
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
            resumeId: string;
            company: string;
            position: string;
            department: string;
            startDate: string;
            endDate: string;
            current: boolean;
            description: string;
            achievements: string;
            techStack: string;
            sortOrder: number;
        }[];
        educations: {
            id: string;
            resumeId: string;
            startDate: string;
            endDate: string;
            description: string;
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
            id: string;
            resumeId: string;
            name: string;
            role: string;
            company: string;
            startDate: string;
            endDate: string;
            description: string;
            techStack: string;
            link: string;
            sortOrder: number;
        }[];
    } & {
        id: string;
        title: string;
        slug: string;
        viewCount: number;
        visibility: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
