export interface LayoutConfig {
    sections: string[];
    dateFormat?: 'dot' | 'dash' | 'text';
    nameFirst?: boolean;
    includePhoto?: boolean;
    style?: 'formal' | 'modern' | 'minimal' | 'creative';
}
export declare class LocalTransformService {
    transform(resume: any, layout: LayoutConfig): string;
    transformByPreset(resume: any, preset: string): string;
    private renderSection;
    private renderPersonalInfo;
    private renderList;
    private fmtDate;
}
