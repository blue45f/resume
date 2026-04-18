import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
export declare class ApplicationsController {
    private readonly service;
    constructor(service: ApplicationsService);
    findAll(req: any): Promise<$Public.PrismaPromise<T>>;
    getStats(req: any): Promise<{
        total: any;
        byStatus: Record<string, number>;
    }>;
    create(dto: CreateApplicationDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobApplicationPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, dto: UpdateApplicationDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$JobApplicationPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getComments(id: string): Promise<any>;
    addComment(id: string, body: {
        content: string;
    }, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$ApplicationCommentPayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
}
