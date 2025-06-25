import { PrismaService } from '../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
export declare class ResumesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(userId?: string): Promise<{
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
    findPublic(): Promise<{
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
    searchPublic(opts: {
        query?: string;
        tag?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
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
        }[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    findOne(id: string, _userId?: string): Promise<{
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
    create(dto: CreateResumeDto, userId?: string): Promise<{
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
    remove(id: string): Promise<{
        success: boolean;
    }>;
    duplicate(id: string, userId?: string): Promise<{
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
    private saveVersionSnapshot;
    private formatSummary;
    private formatFull;
}
