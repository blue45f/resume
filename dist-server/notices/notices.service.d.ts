import { PrismaService } from '../prisma/prisma.service';
export declare class NoticesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(type?: string, page?: number, limit?: number): Promise<{
        items: ({
            _count: {
                comments: number;
            };
            author: {
                id: string;
                name: string;
                avatar: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            title: string;
            viewCount: number;
            updatedAt: Date;
            content: string;
            type: string;
            isPinned: boolean;
            startAt: Date | null;
            endAt: Date | null;
            isPopup: boolean;
            allowComments: boolean;
            authorId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPopup(): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }[]>;
    getOne(id: string): Promise<{
        comments: ({
            user: {
                id: string;
                name: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            content: string;
            noticeId: string;
        })[];
        _count: {
            comments: number;
        };
        author: {
            id: string;
            name: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }>;
    create(data: any, authorId?: string): Promise<{
        author: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }>;
    update(id: string, data: any, editorId?: string, reason?: string): Promise<{
        author: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }>;
    addComment(noticeId: string, userId: string, content: string): Promise<{
        user: {
            id: string;
            name: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    deleteComment(commentId: string, userId: string, role: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    toggleComments(noticeId: string, allow: boolean): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        viewCount: number;
        updatedAt: Date;
        content: string;
        type: string;
        isPinned: boolean;
        startAt: Date | null;
        endAt: Date | null;
        isPopup: boolean;
        allowComments: boolean;
        authorId: string | null;
    }>;
    getHistory(noticeId: string): Promise<({
        editor: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        prevTitle: string;
        prevContent: string;
        prevType: string;
        reason: string;
        noticeId: string;
        editorId: string;
    })[]>;
}
