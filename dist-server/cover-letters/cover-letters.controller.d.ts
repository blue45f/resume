import { CoverLettersService } from './cover-letters.service';
export declare class CoverLettersController {
    private readonly service;
    constructor(service: CoverLettersService);
    findAll(req: any): Promise<$Public.PrismaPromise<T>> | never[];
    findOne(id: string, req: any): Promise<any>;
    create(body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CoverLetterPayload<ExtArgs>, T, "create", GlobalOmitOptions>> | {
        error: string;
    };
    update(id: string, body: any, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CoverLetterPayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getByResume(resumeId: string, req: any): Promise<$Public.PrismaPromise<T>> | never[];
}
