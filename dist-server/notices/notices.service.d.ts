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
                name: string;
                id: string;
                avatar: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            title: string;
            viewCount: number;
            type: string;
            startAt: Date | null;
            endAt: Date | null;
            isPinned: boolean;
            authorId: string | null;
            isPopup: boolean;
            allowComments: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPopup(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }[]>;
    getOne(id: string): Promise<{
        comments: ({
            user: {
                name: string;
                id: string;
                avatar: string;
            };
        } & {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            noticeId: string;
        })[];
        _count: {
            comments: number;
        };
        author: {
            name: string;
            id: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }>;
    create(data: any, authorId?: string): Promise<{
        author: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }>;
    update(id: string, data: any, editorId?: string, reason?: string): Promise<{
        author: {
            name: string;
            id: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }>;
    addComment(noticeId: string, userId: string, content: string): Promise<{
        user: {
            name: string;
            id: string;
            avatar: string;
        };
    } & {
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    deleteComment(commentId: string, userId: string, role: string): Promise<{
        id: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    toggleComments(noticeId: string, allow: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        title: string;
        viewCount: number;
        type: string;
        startAt: Date | null;
        endAt: Date | null;
        isPinned: boolean;
        authorId: string | null;
        isPopup: boolean;
        allowComments: boolean;
    }>;
    getHistory(noticeId: string): Promise<({
        editor: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        reason: string;
        noticeId: string;
        editorId: string;
        prevTitle: string;
        prevContent: string;
        prevType: string;
    })[]>;
}
