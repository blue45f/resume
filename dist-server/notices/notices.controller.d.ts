import { NoticesService } from './notices.service';
export declare class NoticesController {
    private readonly service;
    constructor(service: NoticesService);
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
    getAll(type?: string, page?: string, limit?: string): Promise<{
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
    create(req: any, body: any): Promise<{
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
    update(req: any, id: string, body: any): Promise<{
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
    remove(req: any, id: string): Promise<{
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
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    deleteComment(req: any, _noticeId: string, commentId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        content: string;
        noticeId: string;
    }>;
    toggleComments(req: any, id: string, body: {
        allow: boolean;
    }): Promise<{
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
    getHistory(req: any, id: string): Promise<({
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
