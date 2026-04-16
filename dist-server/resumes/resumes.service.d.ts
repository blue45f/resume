import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
export declare class ResumesService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    private sendViewNotification;
    findAll(userId?: string, page?: number, limit?: number): Promise<{
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
    findPublic(page?: number, limit?: number): Promise<{
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
    searchPublic(opts: {
        query?: string;
        tag?: string;
        sort?: string;
        page: number;
        limit: number;
    }): Promise<{
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
    findByShortCode(code: string): Promise<{
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
    } | null>;
    findOne(id: string, userId?: string): Promise<{
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
    private verifyOwnership;
    setVisibility(id: string, visibility: string, userId?: string, role?: string): Promise<{
        id: string;
        visibility: string;
    }>;
    updateSlug(id: string, slug: string, userId?: string, role?: string): Promise<{
        id: string;
        slug: string;
    }>;
    private generateSlug;
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
    update(id: string, dto: UpdateResumeDto, userId?: string): Promise<{
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
    transferOwnership(id: string, newUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    remove(id: string, userId?: string, role?: string): Promise<{
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
    private saveVersionSnapshot;
    incrementViewCount(id: string): void;
    addBookmark(resumeId: string, userId: string): Promise<{
        bookmarked: boolean;
    }>;
    removeBookmark(resumeId: string, userId: string): Promise<{
        bookmarked: boolean;
    }>;
    getBookmarks(userId: string): Promise<{
        id: string;
        resumeId: string;
        title: string;
        name: any;
        createdAt: string;
    }[]>;
    isBookmarked(resumeId: string, userId: string): Promise<boolean>;
    private formatSummary;
    private formatFull;
}
