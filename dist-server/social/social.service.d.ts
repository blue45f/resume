import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SocialService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
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
        company: string;
        position: string;
        createdAt: Date;
        resumeId: string | null;
        message: string;
        read: boolean;
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
        company: string;
        position: string;
        createdAt: Date;
        resumeId: string | null;
        message: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    })[]>;
    markScoutRead(id: string, userId: string): Promise<{
        success: boolean;
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
