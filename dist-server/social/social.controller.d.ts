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
    getFollowers(req: any): Promise<any> | never[];
    getFollowing(req: any): Promise<any> | never[];
    sendScout(body: {
        receiverId: string;
        resumeId?: string;
        company: string;
        position: string;
        message: string;
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ScoutMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
    getScouts(req: any): Promise<$Public.PrismaPromise<T>> | never[];
    getSentScouts(req: any): Promise<$Public.PrismaPromise<T>> | never[];
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
            id: any;
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
        partner: any;
        lastMessage: {
            content: any;
            createdAt: any;
            isMine: boolean;
        };
        unreadCount: $Public.PrismaPromise<T>;
    }[]>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    getMessages(partnerId: string, req: any): Promise<$Public.PrismaPromise<T>> | never[];
    sendMessage(receiverId: string, content: string, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$DirectMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
}
