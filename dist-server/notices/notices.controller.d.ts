import { NoticesService } from './notices.service';
export declare class NoticesController {
    private readonly service;
    constructor(service: NoticesService);
    getPopup(): Promise<$Public.PrismaPromise<T>>;
    getAll(type?: string, page?: string, limit?: string): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getOne(id: string): Promise<any>;
    create(req: any, body: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(req: any, id: string, body: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(req: any, id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    addComment(req: any, noticeId: string, body: {
        content: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticeCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    deleteComment(req: any, _noticeId: string, commentId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticeCommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    toggleComments(req: any, id: string, body: {
        allow: boolean;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    getHistory(req: any, id: string): Promise<$Public.PrismaPromise<T>>;
}
