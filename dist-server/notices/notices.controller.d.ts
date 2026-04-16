import { NoticesService } from './notices.service';
export declare class NoticesController {
    private readonly service;
    constructor(service: NoticesService);
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
    getAll(type?: string, page?: string, limit?: string): Promise<{
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
    create(req: any, body: any): Promise<{
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
    update(req: any, id: string, body: any): Promise<{
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
    remove(req: any, id: string): Promise<{
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
    addComment(req: any, noticeId: string, body: {
        content: string;
    }): Promise<{
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
    deleteComment(req: any, _noticeId: string, commentId: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
        noticeId: string;
        userId: string;
    }>;
    toggleComments(req: any, id: string, body: {
        allow: boolean;
    }): Promise<{
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
    getHistory(req: any, id: string): Promise<({
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
