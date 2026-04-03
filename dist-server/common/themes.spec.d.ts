interface ResumeTheme {
    id: string;
    name: string;
    description: string;
    headerStyle: string;
    sectionTitleStyle: string;
    bodyStyle: string;
    accentColor: string;
    fontFamily: string;
    premium?: boolean;
    preview?: {
        headerBg: string;
        headerText: string;
        accentBar: string;
        bodyBg: string;
        category: 'basic' | 'professional' | 'creative' | 'academic' | 'tech';
        bestFor: string;
    };
}
declare const resumeThemes: ResumeTheme[];
declare const THEME_CATEGORY_LABELS: Record<string, string>;
declare const REQUIRED_FIELDS: (keyof ResumeTheme)[];
