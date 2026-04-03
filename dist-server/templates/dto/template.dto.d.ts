export declare class CreateTemplateDto {
    name: string;
    description?: string;
    category?: string;
    prompt?: string;
    layout?: string;
    isDefault?: boolean;
}
export declare class UpdateTemplateDto {
    name?: string;
    description?: string;
    category?: string;
    prompt?: string;
    layout?: string;
    visibility?: string;
    isDefault?: boolean;
}
export declare class LocalTransformDto {
    preset?: string;
    templateId?: string;
}
