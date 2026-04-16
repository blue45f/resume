import { TemplatesService } from './templates.service';
import { LocalTransformService } from './local-transform.service';
import { ResumesService } from '../resumes/resumes.service';
import { CreateTemplateDto, UpdateTemplateDto, LocalTransformDto } from './dto/template.dto';
export declare class TemplatesController {
    private readonly templatesService;
    private readonly localTransformService;
    private readonly resumesService;
    constructor(templatesService: TemplatesService, localTransformService: LocalTransformService, resumesService: ResumesService);
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }[]>;
    findPublicTemplates(category?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }>;
    create(dto: CreateTemplateDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }>;
    update(id: string, dto: UpdateTemplateDto, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        userId: string | null;
        visibility: string;
        updatedAt: Date;
        category: string;
        description: string;
        prompt: string;
        layout: string;
        usageCount: number;
        rating: number | null;
        isDefault: boolean;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    seed(): Promise<{
        message: string;
    }>;
    localTransform(resumeId: string, dto: LocalTransformDto): Promise<{
        text: string;
        method: string;
        templateName: string;
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
