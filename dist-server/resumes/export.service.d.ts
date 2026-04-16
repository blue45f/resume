import { PrismaService } from '../prisma/prisma.service';
export declare class ExportService {
    private prisma;
    constructor(prisma: PrismaService);
    exportAsText(resumeId: string): Promise<string>;
    exportAsMarkdown(resumeId: string): Promise<string>;
    exportAsJson(resumeId: string): Promise<string>;
    exportAsDocx(resumeId: string): Promise<Buffer>;
    exportAsHtml(resumeId: string): Promise<string>;
    private getResumeData;
}
