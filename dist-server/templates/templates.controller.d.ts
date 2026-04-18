import { TemplatesService } from './templates.service';
import { LocalTransformService } from './local-transform.service';
import { ResumesService } from '../resumes/resumes.service';
import { CreateTemplateDto, UpdateTemplateDto, LocalTransformDto } from './dto/template.dto';
export declare class TemplatesController {
    private readonly templatesService;
    private readonly localTransformService;
    private readonly resumesService;
    constructor(templatesService: TemplatesService, localTransformService: LocalTransformService, resumesService: ResumesService);
    findAll(): Promise<$Public.PrismaPromise<T>>;
    findPublicTemplates(category?: string): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string): Promise<any>;
    create(dto: CreateTemplateDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TemplatePayload<ExtArgs>, T, "create", GlobalOmitOptions>>;
    update(id: string, dto: UpdateTemplateDto, req: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$TemplatePayload<ExtArgs>, T, "update", GlobalOmitOptions>>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    seed(): Promise<{
        message: string;
    }>;
    localTransform(resumeId: string, dto: LocalTransformDto, req: any): Promise<{
        text: string;
        method: string;
        templateName: any;
        preset?: undefined;
    } | {
        text: string;
        method: string;
        preset: string;
        templateName?: undefined;
    }>;
    getPresets(): {
        id: string;
        name: string;
        description: string;
    }[];
}
