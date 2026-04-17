import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenWordsService } from '../forbidden-words/forbidden-words.service';
export declare class SocialService {
    private prisma;
    private notificationsService;
    private forbiddenWords;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, forbiddenWords: ForbiddenWordsService);
    follow(followerId: string, followingId: string): Promise<{
        followed: boolean;
    }>;
    unfollow(followerId: string, followingId: string): Promise<{
        followed: boolean;
    }>;
    getFollowers(userId: string): Promise<any>;
    getFollowing(userId: string): Promise<any>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    sendScout(senderId: string, data: {
        receiverId: string;
        resumeId?: string;
        company: string;
        position: string;
        message: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ScoutMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    getReceivedScouts(userId: string): Promise<$Public.PrismaPromise<T>>;
    markScoutRead(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getSentScouts(userId: string): Promise<$Public.PrismaPromise<T>>;
    respondToScout(id: string, userId: string, status: string): Promise<{
        success: boolean;
    }>;
    sendBulkScout(senderId: string, data: {
        targetIds: string[];
        message: string;
        company: string;
    }): Promise<{
        sent: number;
        failed: number;
        results: ({
            receiverId: string;
            success: boolean;
            id: any;
        } | {
            receiverId: string;
            success: boolean;
            id?: undefined;
        })[];
    }>;
    sendMessage(senderId: string, receiverId: string, content: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$DirectMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    getConversations(userId: string): Promise<{
        partner: any;
        lastMessage: {
            content: any;
            createdAt: any;
            isMine: boolean;
        };
        unreadCount: $Public.PrismaPromise<T>;
    }[]>;
    getMessages(userId: string, partnerId: string): Promise<$Public.PrismaPromise<T>>;
    getUnreadMessageCount(userId: string): Promise<number>;
}
