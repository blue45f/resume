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
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }[]>;
    findPublicTemplates(category?: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    create(dto: CreateTemplateDto, req: any): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    update(id: string, dto: UpdateTemplateDto, req: any): Promise<{
        name: string;
        description: string;
        id: string;
        userId: string | null;
        visibility: string;
        createdAt: Date;
        updatedAt: Date;
        category: string;
        prompt: string;
        layout: string;
        isDefault: boolean;
        usageCount: number;
        rating: number | null;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
    seed(): Promise<{
        message: string;
    }>;
    localTransform(resumeId: string, dto: LocalTransformDto, req: any): Promise<{
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
