import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private readonly service;
    constructor(service: CommentsService);
    findAll(resumeId: string): Promise<$Public.PrismaPromise<T>>;
    create(resumeId: string, dto: CreateCommentDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    remove(commentId: string, req: any): Promise<{
        success: boolean;
    }>;
}
