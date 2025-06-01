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
        description: string;
        category: string;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    create(dto: CreateTemplateDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    update(id: string, dto: UpdateTemplateDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        description: string;
        category: string;
        updatedAt: Date;
        prompt: string;
        layout: string;
        isDefault: boolean;
    }>;
    remove(id: string): Promise<{
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
