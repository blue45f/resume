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
    getFollowers(userId: string): Promise<{
        followedAt: Date;
        id: string;
        email: string;
        name: string;
        avatar: string;
    }[]>;
    getFollowing(userId: string): Promise<{
        followedAt: Date;
        id: string;
        email: string;
        name: string;
        avatar: string;
    }[]>;
    isFollowing(followerId: string, followingId: string): Promise<boolean>;
    sendScout(senderId: string, data: {
        receiverId: string;
        resumeId?: string;
        company: string;
        position: string;
        message: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
    }>;
    getReceivedScouts(userId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
    })[]>;
    markScoutRead(id: string, userId: string): Promise<{
        success: boolean;
    }>;
    getSentScouts(userId: string): Promise<({
        sender: {
            id: string;
            email: string;
            name: string;
        };
        receiver: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
    })[]>;
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
            id: string;
        } | {
            receiverId: string;
            success: boolean;
            id?: undefined;
        })[];
    }>;
    sendMessage(senderId: string, receiverId: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    }>;
    getConversations(userId: string): Promise<{
        partner: {
            id: string;
            email: string;
            name: string;
            avatar: string;
        };
        lastMessage: {
            content: string;
            createdAt: Date;
            isMine: boolean;
        };
        unreadCount: number;
    }[]>;
    getMessages(userId: string, partnerId: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    }[]>;
    getUnreadMessageCount(userId: string): Promise<number>;
}
