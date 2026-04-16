import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class CommunityService {
    private readonly prisma;
    private readonly notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getPosts(category?: string, search?: string, page?: number, limit?: number, showHidden?: boolean): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                username: string;
                avatar: string;
            } | null;
            _count: {
                likes: number;
                comments: number;
            };
        } & {
            id: string;
            title: string;
            content: string;
            category: string;
            userId: string | null;
            viewCount: number;
            likeCount: number;
            isPinned: boolean;
            isHidden: boolean;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, viewerId?: string): Promise<{
        liked: boolean;
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
        comments: ({} & {
            id: string;
            content: string;
            userId: string | null;
            createdAt: Date;
            updatedAt: Date;
            postId: string;
            authorName: string | null;
        })[];
        _count: {
            likes: number;
            comments: number;
        };
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    createPost(userId: string, body: {
        title: string;
        content: string;
        category: string;
    }): Promise<{
        user: {
            id: string;
            name: string;
            username: string;
            avatar: string;
        } | null;
    } & {
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePost(id: string, userId: string, role: string, body: {
        title?: string;
        content?: string;
        category?: string;
        isPinned?: boolean;
    }): Promise<{
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(id: string, userId: string, role: string): Promise<{
        id: string;
        title: string;
        content: string;
        category: string;
        userId: string | null;
        viewCount: number;
        likeCount: number;
        isPinned: boolean;
        isHidden: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    getComments(postId: string): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }[]>;
    addComment(postId: string, userId: string | undefined, content: string, authorName?: string): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }>;
    deleteComment(commentId: string, userId: string, role: string): Promise<{
        id: string;
        content: string;
        userId: string | null;
        createdAt: Date;
        updatedAt: Date;
        postId: string;
        authorName: string | null;
    }>;
}
