import { Response } from 'express';
import { ResumesService } from './resumes.service';
import { ExportService } from './export.service';
import { AnalyticsService } from './analytics.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
export declare class ResumesController {
    private readonly resumesService;
    private readonly exportService;
    private readonly analyticsService;
    constructor(resumesService: ResumesService, exportService: ExportService, analyticsService: AnalyticsService);
    findAll(req: any, isPublic?: string, page?: string, limit?: string): Promise<{
        data: {
            id: any;
            title: any;
            slug: any;
            userId: any;
            viewCount: any;
            visibility: any;
            isOpenToWork: any;
            openToWorkRoles: any;
            personalInfo: {
                name: any;
                email: any;
                phone: any;
                address: any;
                website: any;
                github: any;
                summary: any;
                photo: any;
                birthYear: any;
                links: any;
                military: any;
            };
            tags: any;
            skills: any;
            createdAt: any;
            updatedAt: any;
        }[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    }>;
    analytics(req: any): Promise<{
        summary: {
            totalResumes: number;
            publicResumes: number;
            totalViews: number;
            totalTransforms: number;
            recentEdits: number;
        };
        resumes: {
            id: string;
            title: string;
            viewCount: number;
            visibility: string;
            updatedAt: string;
        }[];
        recentVersions: {
            id: string;
            versionNumber: number;
            resumeId: string;
            createdAt: string;
        }[];
    }>;
    getResumeTrend(resumeId: string): Promise<{
        version: number;
        sections: number;
        createdAt: string;
    }[]>;
    getPopularSkills(): Promise<{
        name: string;
        count: number;
    }[]>;
    getResumeAnalytics(resumeId: string): Promise<{
        viewCount: number;
        commentCount: number;
        bookmarkCount: number;
        shareCount: number;
        versionCount: number;
        visibility: string;
        createdAt: string;
        updatedAt: string;
    } | null>;
    getBookmarks(req: any): Promise<{
        id: string;
        resumeId: string;
        title: string;
        name: any;
        createdAt: string;
    }[]>;
    findBySlug(username: string, slug: string): Promise<{
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
        slug: any;
        userId: any;
        viewCount: any;
        visibility: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            github: any;
            summary: any;
            photo: any;
            birthYear: any;
            links: any;
            military: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    findByShortCode(code: string, res: Response): Promise<Response<any, Record<string, any>>>;
    findPublicResumes(query?: string, tag?: string, sort?: string, page?: string, limit?: string): Promise<{
        data: {
            id: any;
            title: any;
            slug: any;
            userId: any;
            viewCount: any;
            visibility: any;
            isOpenToWork: any;
            openToWorkRoles: any;
            personalInfo: {
                name: any;
                email: any;
                phone: any;
                address: any;
                website: any;
                github: any;
                summary: any;
                photo: any;
                birthYear: any;
                links: any;
                military: any;
            };
            tags: any;
            skills: any;
            createdAt: any;
            updatedAt: any;
        }[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    }>;
    isBookmarked(id: string, req: any): Promise<{
        bookmarked: boolean;
    }>;
    findOne(id: string, req: any): Promise<{
        bookmarkCount: number;
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
        slug: any;
        userId: any;
        viewCount: any;
        visibility: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            github: any;
            summary: any;
            photo: any;
            birthYear: any;
            links: any;
            military: any;
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
        slug: any;
        userId: any;
        viewCount: any;
        visibility: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            github: any;
            summary: any;
            photo: any;
            birthYear: any;
            links: any;
            military: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    update(id: string, dto: UpdateResumeDto, req: any): Promise<{
        bookmarkCount: number;
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
        slug: any;
        userId: any;
        viewCount: any;
        visibility: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            github: any;
            summary: any;
            photo: any;
            birthYear: any;
            links: any;
            military: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    setVisibility(id: string, visibility: string, req: any): Promise<{
        id: string;
        visibility: string;
    }>;
    updateSlug(id: string, slug: string, req: any): Promise<{
        id: string;
        slug: string;
    }>;
    transferOwnership(id: string, newUserId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    addBookmark(id: string, req: any): Promise<{
        bookmarked: boolean;
    }>;
    removeBookmark(id: string, req: any): Promise<{
        bookmarked: boolean;
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
        slug: any;
        userId: any;
        viewCount: any;
        visibility: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        personalInfo: {
            name: any;
            email: any;
            phone: any;
            address: any;
            website: any;
            github: any;
            summary: any;
            photo: any;
            birthYear: any;
            links: any;
            military: any;
        };
        tags: any;
        createdAt: any;
        updatedAt: any;
    }>;
    exportText(id: string, res: Response): Promise<void>;
    exportMarkdown(id: string, res: Response): Promise<void>;
    exportJson(id: string, res: Response): Promise<void>;
    exportDocx(id: string, res: Response): Promise<void>;
    getEndorsements(id: string, req: any): Promise<Record<string, {
        count: number;
        endorsed: boolean;
    }>>;
    toggleEndorse(id: string, skill: string, req: any): Promise<{
        endorsed: boolean;
        count: number;
    }>;
}
