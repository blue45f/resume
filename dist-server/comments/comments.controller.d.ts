import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/comment.dto';
export declare class CommentsController {
    private readonly service;
    constructor(service: CommentsService);
    findAll(resumeId: string): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        authorName: string;
    }[]>;
    create(resumeId: string, dto: CreateCommentDto, req: any): Promise<{
        content: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        resumeId: string;
        authorName: string;
    }>;
    remove(commentId: string, req: any): Promise<{
        success: boolean;
    }>;
}
