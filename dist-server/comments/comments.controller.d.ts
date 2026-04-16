import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private readonly service;
    constructor(service: CommentsService);
    findAll(resumeId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        content: string;
        authorName: string;
    }[]>;
    create(resumeId: string, dto: CreateCommentDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        content: string;
        authorName: string;
    }>;
    remove(commentId: string, req: any): Promise<{
        success: boolean;
    }>;
}
