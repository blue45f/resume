import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
export declare class CommunityService {
    private readonly prisma;
    private readonly notifications;
    private readonly forbiddenWords;
    constructor(prisma: PrismaService, notifications: NotificationsService, forbiddenWords: ForbiddenWordsService);
    getPosts(category?: string, search?: string, page?: number, limit?: number, showHidden?: boolean, sort?: string): Promise<{
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
    getPost(id: string, viewerId?: string): Promise<{
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
    createPost(userId: string, body: {
        title: string;
        content: string;
        category: string;
        attachments?: any[];
    }): Promise<{
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
    }>;
    updatePost(id: string, userId: string, role: string, body: {
        title?: string;
        content?: string;
        category?: string;
        isPinned?: boolean;
        isHidden?: boolean;
        attachments?: any[];
    }): Promise<{
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
    }>;
    deletePost(id: string, userId: string, role: string): Promise<{
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
    }>;
    toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    getComments(postId: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
        postId: string;
    }[]>;
    addComment(postId: string, userId: string | undefined, content: string, authorName?: string, parentId?: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
        postId: string;
    }>;
    deleteComment(commentId: string, userId: string, role: string): Promise<{
        id: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        authorName: string | null;
        content: string;
        parentId: string | null;
        postId: string;
    }>;
}
