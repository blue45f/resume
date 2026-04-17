import { CommunityService } from './community.service';
import { ConfigService } from '@nestjs/config';
export declare class CommunityController {
    private readonly service;
    private readonly config;
    private useCloudinary;
    constructor(service: CommunityService, config: ConfigService);
    getPosts(category?: string, search?: string, page?: string, limit?: string, showHidden?: string, sort?: string, req?: any): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPost(id: string, req: any): Promise<any>;
    create(body: {
        title: string;
        content: string;
        category: string;
        attachments?: any[];
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "update", GlobalOmitOptions>> | {
        error: string;
    };
    delete(id: string, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityPostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>> | {
        error: string;
    };
    toggleLike(id: string, req: any): Promise<{
        liked: boolean;
    }> | {
        error: string;
    };
    getComments(id: string): Promise<$Public.PrismaPromise<T>>;
    addComment(id: string, body: {
        content: string;
        authorName?: string;
        parentId?: string;
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    deleteComment(id: string, commentId: string, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommunityCommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>> | {
        error: string;
    };
    uploadAttachment(file: Express.Multer.File, req: any): Promise<{
        url: any;
        name: string;
        size: number;
        type: string;
    }>;
}
