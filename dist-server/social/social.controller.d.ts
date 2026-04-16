import { SocialService } from './social.service';
export declare class SocialController {
    private readonly service;
    constructor(service: SocialService);
    follow(userId: string, req: any): Promise<{
        followed: boolean;
    }> | {
        error: string;
    };
    unfollow(userId: string, req: any): Promise<{
        followed: boolean;
    }> | {
        error: string;
    };
    getFollowers(req: any): never[] | Promise<{
        followedAt: Date;
        id: string;
        email: string;
        name: string;
        avatar: string;
    }[]>;
    getFollowing(req: any): never[] | Promise<{
        followedAt: Date;
        id: string;
        email: string;
        name: string;
        avatar: string;
    }[]>;
    sendScout(body: {
        receiverId: string;
        resumeId?: string;
        company: string;
        position: string;
        message: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        resumeId: string | null;
        company: string;
        position: string;
        message: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    }> | {
        error: string;
    };
    getScouts(req: any): never[] | Promise<({
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
        senderId: string;
        receiverId: string;
    })[]>;
    markRead(id: string, req: any): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    getConversations(req: any): never[] | Promise<{
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
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    getMessages(partnerId: string, req: any): never[] | Promise<{
        id: string;
        createdAt: Date;
        content: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    }[]>;
    sendMessage(receiverId: string, content: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        read: boolean;
        senderId: string;
        receiverId: string;
    }> | {
        error: string;
    };
}
