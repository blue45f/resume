import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    private readonly config;
    constructor(prisma: PrismaService, config: ConfigService);
    check(): Promise<{
        status: string;
        version: string;
        environment: string;
        timestamp: string;
        uptime: number;
        database: string;
        memory: {
            rss: number;
            heapUsed: number;
        };
        stats: {
            resumes: number;
            users: number;
        };
        providers: {
            google: boolean;
            github: boolean;
            kakao: boolean;
        };
    }>;
}
