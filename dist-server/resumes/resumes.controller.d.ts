import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
export declare class ResumesController {
    private readonly resumesService;
    constructor(resumesService: ResumesService);
    findAll(req: any, isPublic?: string): Promise<{
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    findPublicResumes(): Promise<{
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    findOne(id: string, req: any): Promise<{
        experiences: {
            [k: string]: any;
        }[];
        educations: {
            [k: string]: any;
        }[];
        skills: {
            [k: string]: any;
        }[];
        projects: {
            [k: string]: any;
        }[];
        certifications: {
            [k: string]: any;
        }[];
        languages: {
            [k: string]: any;
        }[];
        awards: {
            [k: string]: any;
        }[];
        activities: {
            [k: string]: any;
        }[];
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    create(dto: CreateResumeDto, req: any): Promise<{
        experiences: {
            [k: string]: any;
        }[];
        educations: {
            [k: string]: any;
        }[];
        skills: {
            [k: string]: any;
        }[];
        projects: {
            [k: string]: any;
        }[];
        certifications: {
            [k: string]: any;
        }[];
        languages: {
            [k: string]: any;
        }[];
        awards: {
            [k: string]: any;
        }[];
        activities: {
            [k: string]: any;
        }[];
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateResumeDto): Promise<{
        experiences: {
            [k: string]: any;
        }[];
        educations: {
            [k: string]: any;
        }[];
        skills: {
            [k: string]: any;
        }[];
        projects: {
            [k: string]: any;
        }[];
        certifications: {
            [k: string]: any;
        }[];
        languages: {
            [k: string]: any;
        }[];
        awards: {
            [k: string]: any;
        }[];
        activities: {
            [k: string]: any;
        }[];
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    setVisibility(id: string, visibility: string): Promise<{
        id: string;
        visibility: string;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    duplicate(id: string, req: any): Promise<{
        experiences: {
            [k: string]: any;
        }[];
        educations: {
            [k: string]: any;
        }[];
        skills: {
            [k: string]: any;
        }[];
        projects: {
            [k: string]: any;
        }[];
        certifications: {
            [k: string]: any;
        }[];
        languages: {
            [k: string]: any;
        }[];
        awards: {
            [k: string]: any;
        }[];
        activities: {
            [k: string]: any;
        }[];
        id: any;
        title: any;
        visibility: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            summary: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
