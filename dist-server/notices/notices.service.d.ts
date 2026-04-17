import { PrismaService } from '../prisma/prisma.service';
export declare class NoticesService {
    private prisma;
    constructor(prisma: PrismaService);
    getAll(type?: string, page?: number, limit?: number): Promise<{
        items: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPopup(): Promise<$Public.PrismaPromise<T>>;
    getOne(id: string): Promise<any>;
    create(data: any, authorId?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, data: any, editorId?: string, reason?: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    addComment(noticeId: string, userId: string, content: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticeCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    deleteComment(commentId: string, userId: string, role: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticeCommentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>>;
    toggleComments(noticeId: string, allow: boolean): Promise<$Result.GetResult<import(".prisma/client").Prisma.$NoticePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    getHistory(noticeId: string): Promise<$Public.PrismaPromise<T>>;
}
