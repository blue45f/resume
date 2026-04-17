import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
export declare class CommunityService {
    private readonly prisma;
    private readonly notifications;
    private readonly forbiddenWords;
    constructor(prisma: PrismaService, notifications: NotificationsService, forbiddenWords: ForbiddenWordsService);
    getPosts(category?: string, search?: string, page?: number, limit?: number, showHidden?: boolean, sort?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, viewerId?: string): Promise<any>;
    createPost(userId: string, body: {
        title: string;
        content: string;
        category: string;
        attachments?: any[];
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    updatePost(id: string, userId: string, role: string, body: {
        title?: string;
        content?: string;
        category?: string;
        isPinned?: boolean;
        isHidden?: boolean;
        attachments?: any[];
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    deletePost(id: string, userId: string, role: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    toggleLike(postId: string, userId: string): Promise<{
        liked: boolean;
    }>;
    getComments(postId: string): Promise<$Public.PrismaPromise<T>>;
    addComment(postId: string, userId: string | undefined, content: string, authorName?: string, parentId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    deleteComment(commentId: string, userId: string, role: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityCommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
}
