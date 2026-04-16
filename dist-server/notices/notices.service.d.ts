import { PrismaService } from '../prisma/prisma.service';
export declare class NoticesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(type?: string, page?: number, limit?: number): Promise<{
        items: ({
            author: {
                id: string;
                name: string;
                avatar: string;
            } | null;
            _count: {
                comments: number;
            };
        } & {
            id: string;
            title: string;
            content: string;
            type: string;
            isPopup: boolean;
            isPinned: boolean;
            allowComments: boolean;
            viewCount: number;
            authorId: string | null;
            startAt: Date | null;
            endAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPopup(): Promise<{
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getOne(id: string): Promise<{
        author: {
            id: string;
            name: string;
            avatar: string;
        } | null;
        comments: ({
            user: {
                id: string;
                name: string;
                avatar: string;
            };
        } & {
            id: string;
            content: string;
            createdAt: Date;
            updatedAt: Date;
            noticeId: string;
            userId: string;
        })[];
        _count: {
            comments: number;
        };
    } & {
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(data: any, authorId?: string): Promise<{
        author: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, data: any, editorId?: string, reason?: string): Promise<{
        author: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    addComment(noticeId: string, userId: string, content: string): Promise<{
        user: {
            id: string;
            name: string;
            avatar: string;
        };
    } & {
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        noticeId: string;
        userId: string;
    }>;
    deleteComment(commentId: string, userId: string, role: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        noticeId: string;
        userId: string;
    }>;
    toggleComments(noticeId: string, allow: boolean): Promise<{
        id: string;
        title: string;
        content: string;
        type: string;
        isPopup: boolean;
        isPinned: boolean;
        allowComments: boolean;
        viewCount: number;
        authorId: string | null;
        startAt: Date | null;
        endAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getHistory(noticeId: string): Promise<({
        editor: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        noticeId: string;
        editorId: string;
        prevTitle: string;
        prevContent: string;
        prevType: string;
        reason: string;
    })[]>;
}
