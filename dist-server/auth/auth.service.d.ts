import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private readonly frontendUrl;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    getGoogleAuthUrl(): string;
    getGithubAuthUrl(): string;
    getKakaoAuthUrl(): string;
    handleGoogleCallback(code: string): Promise<string>;
    handleGithubCallback(code: string): Promise<string>;
    handleKakaoCallback(code: string): Promise<string>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        provider: string;
    }>;
    getAvailableProviders(): string[];
    private findOrCreateUser;
    private getCallbackUrl;
    getFrontendUrl(): string;
}
