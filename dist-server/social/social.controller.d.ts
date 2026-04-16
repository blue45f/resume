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
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
        resumeId: string | null;
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
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
        resumeId: string | null;
    })[]>;
    getSentScouts(req: any): never[] | Promise<({
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
        company: string;
        position: string;
        message: string;
        read: boolean;
        status: string;
        senderId: string;
        receiverId: string;
        resumeId: string | null;
    })[]>;
    sendBulkScout(body: {
        targetIds: string[];
        message: string;
        company: string;
    }, req: any): Promise<{
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
    }> | {
        error: string;
    };
    markRead(id: string, req: any): Promise<{
        success: boolean;
    }> | {
        success: boolean;
    };
    respondToScout(id: string, body: {
        status: string;
    }, req: any): Promise<{
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
        read: boolean;
        senderId: string;
        receiverId: string;
        content: string;
    }[]>;
    sendMessage(receiverId: string, content: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        read: boolean;
        senderId: string;
        receiverId: string;
        content: string;
    }> | {
        error: string;
    };
}
