import { CommunityService } from './community.service';
import { ConfigService } from '@nestjs/config';
export declare class CommunityController {
    private readonly service;
    private readonly config;
    private useCloudinary;
    constructor(service: CommunityService, config: ConfigService);
    getPosts(category?: string, search?: string, page?: string, limit?: string, showHidden?: string, req?: any): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                username: string;
                avatar: string;
            } | null;
            _count: {
                comments: number;
                likes: number;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            content: string;
            title: string;
            viewCount: number;
            updatedAt: Date;
            attachments: import("@prisma/client/runtime/library").JsonValue;
            category: string;
            isPinned: boolean;
            likeCount: number;
            isHidden: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, req: any): Promise<{
        liked: boolean;
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
        comments: ({} & {
            id: string;
            createdAt: Date;
            userId: string | null;
            content: string;
            updatedAt: Date;
            authorName: string | null;
            postId: string;
        })[];
        _count: {
            comments: number;
            likes: number;
        };
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        title: string;
        viewCount: number;
        updatedAt: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPinned: boolean;
        likeCount: number;
        isHidden: boolean;
    } | null>;
    create(body: {
        title: string;
        content: string;
        category: string;
        attachments?: any[];
    }, req: any): Promise<{
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        title: string;
        viewCount: number;
        updatedAt: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPinned: boolean;
        likeCount: number;
        isHidden: boolean;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        title: string;
        viewCount: number;
        updatedAt: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPinned: boolean;
        likeCount: number;
        isHidden: boolean;
    }> | {
        error: string;
    };
    delete(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        title: string;
        viewCount: number;
        updatedAt: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue;
        category: string;
        isPinned: boolean;
        likeCount: number;
        isHidden: boolean;
    }> | {
        error: string;
    };
    toggleLike(id: string, req: any): Promise<{
        liked: boolean;
    }> | {
        error: string;
    };
    getComments(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        updatedAt: Date;
        authorName: string | null;
        postId: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
        authorName?: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        updatedAt: Date;
        authorName: string | null;
        postId: string;
    }>;
    deleteComment(id: string, commentId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        content: string;
        updatedAt: Date;
        authorName: string | null;
        postId: string;
    }> | {
        error: string;
    };
    uploadAttachment(file: Express.Multer.File, req: any): Promise<{
        url: any;
        name: string;
        size: number;
        type: string;
    }>;
}
