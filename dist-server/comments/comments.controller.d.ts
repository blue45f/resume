import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private readonly service;
    constructor(service: CommentsService);
    findAll(resumeId: string): Promise<{
        id: string;
        userId: string | null;
        resumeId: string;
        createdAt: Date;
        authorName: string;
        content: string;
        parentId: string | null;
    }[]>;
    create(resumeId: string, dto: CreateCommentDto, req: any): Promise<{
        id: string;
        userId: string | null;
        resumeId: string;
        createdAt: Date;
        authorName: string;
        content: string;
        parentId: string | null;
    }>;
    remove(commentId: string, req: any): Promise<{
        success: boolean;
    }>;
}
