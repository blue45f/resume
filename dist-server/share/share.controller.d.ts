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
            summary: string;
            id: string;
            email: string;
            name: string;
            github: string;
            phone: string;
            address: string;
            website: string;
            photo: string;
            birthYear: string;
            links: string;
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
}
