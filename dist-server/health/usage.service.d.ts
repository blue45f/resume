import { PrismaService } from '../prisma/prisma.service';
export declare class UsageService {
    private prisma;
    constructor(prisma: PrismaService);
    checkAndLog(userId: string, feature: string): Promise<void>;
    getUsage(userId: string): Promise<{
        feature: string;
        count: number;
    }[]>;
}
