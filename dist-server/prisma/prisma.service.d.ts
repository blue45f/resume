import { OnModuleInit, OnModuleDestroy, BeforeApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy, BeforeApplicationShutdown {
    private readonly logger;
    private isConnected;
    constructor();
    onModuleInit(): Promise<void>;
    beforeApplicationShutdown(signal?: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
