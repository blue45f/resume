export declare const TEMPLATE_TYPES: readonly ["standard", "career-description", "cover-letter", "linkedin", "english", "developer", "designer", "custom"];
export type TemplateType = (typeof TEMPLATE_TYPES)[number];
export declare class TransformResumeDto {
    templateType: TemplateType;
    targetLanguage?: string;
    jobDescription?: string;
    customPrompt?: string;
    provider?: string;
}
