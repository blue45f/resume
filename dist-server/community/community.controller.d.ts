import { CommunityService } from './community.service';
import { ConfigService } from '@nestjs/config';
export declare class CommunityController {
    private readonly service;
    private readonly config;
    private useCloudinary;
    constructor(service: CommunityService, config: ConfigService);
    getPosts(category?: string, search?: string, page?: string, limit?: string, showHidden?: string, sort?: string, req?: any): Promise<{
        items: ({
            user: {
                name: string;
                id: string;
                username: string;
                avatar: string;
            } | null;
            _count: {
                comments: number;
                likes: number;
            };
        } & {
            id: string;
            userId: string | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            attachments: import("@prisma/client/runtime/client").JsonValue;
            category: string;
            title: string;
            viewCount: number;
            likeCount: number;
            isPinned: boolean;
            isHidden: boolean;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, req: any): Promise<{
        liked: boolean;
        comments: ({} & {
            id: string;
            userId: string | null;
            createdAt: Date;
            updatedAt: Date;
            authorName: string | null;
            content: string;
            parentId: string | null;
            postId: string;
        })[];
        user: {
            name: string;
            id: string;
            username: string;
            avatar: string;
        } | null;
        _count: {
            comments: number;
            likes: number;
        };
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        attachments: import("@prisma/client/runtime/client").JsonValue;
        category: string;
        title: string;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
    } | null>;
    create(body: {
        title: string;
        content: string;
        category: string;
        attachments?: any[];
    }, req: any): Promise<{
        user: {
            name: string;
            id: string;
            username: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        attachments: import("@prisma/client/runtime/client").JsonValue;
        category: string;
        title: string;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
    }> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        attachments: import("@prisma/client/runtime/client").JsonValue;
        category: string;
        title: string;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
    }> | {
        error: string;
    };
    delete(id: string, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        attachments: import("@prisma/client/runtime/client").JsonValue;
        category: string;
        title: string;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
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
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
        postId: string;
    }[]>;
    addComment(id: string, body: {
        content: string;
        authorName?: string;
        parentId?: string;
    }, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
        postId: string;
    }>;
    deleteComment(id: string, commentId: string, req: any): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
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
