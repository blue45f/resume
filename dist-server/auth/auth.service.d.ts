import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
interface OAuthProfile {
    provider: string;
    providerId: string;
    email: string;
    name: string;
    avatar: string;
}
export declare class AuthService {
    private prisma;
    private jwt;
    private config;
    private readonly frontendUrl;
    private readonly stateSecret;
    private readonly logger;
    private readonly STATE_TTL_MS;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    generateOAuthState(): string;
    validateOAuthState(state: string | undefined): boolean;
    extractLinkUserId(state: string): string | null;
    getGoogleAuthUrl(state: string): string;
    getGithubAuthUrl(state: string): string;
    getKakaoAuthUrl(state: string): string;
    handleGoogleCallback(code: string): Promise<string>;
    handleGithubCallback(code: string): Promise<string>;
    handleKakaoCallback(code: string): Promise<string>;
    setUserRole(adminUserId: string, targetUserId: string, role: string): Promise<{
        success: boolean;
        userId: string;
        role: string;
    }>;
    getAllUsers(search?: string): Promise<$Public.PrismaPromise<T>>;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        name: any;
        avatar: any;
        provider: any;
        role: any;
        plan: any;
        userType: any;
        companyName: any;
        companyTitle: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        username: any;
        resumeCount: any;
        followerCount: any;
        followingCount: any;
    }>;
    getPublicPortfolio(username: string): Promise<{
        user: {
            id: any;
            username: any;
            name: any;
            avatar: any;
            isOpenToWork: any;
            openToWorkRoles: any;
            companyName: any;
            companyTitle: any;
            userType: any;
        };
        stats: {
            publicResumeCount: any;
            followerCount: any;
            followingCount: any;
            totalViews: any;
            totalExperiences: any;
        };
        topSkills: string[];
        resumes: any;
    } | null>;
    getAvailableProviders(): string[];
    getGoogleProfile(code: string): Promise<OAuthProfile>;
    getGithubProfile(code: string): Promise<OAuthProfile>;
    getKakaoProfile(code: string): Promise<OAuthProfile>;
    linkSocialAccount(userId: string, provider: string, providerId: string, avatar?: string): Promise<void>;
    getLinkedAccounts(userId: string): Promise<{
        provider: any;
        hasPassword: boolean;
    }>;
    private findOrCreateUser;
    private getCallbackUrl;
    getFrontendUrl(): string;
    register(email: string, password: string, name: string, userType?: string, companyName?: string, companyTitle?: string, marketingOptIn?: boolean, llmOptIn?: boolean): Promise<string>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    updateProfile(userId: string, data: {
        userType?: string;
        name?: string;
        companyName?: string;
        companyTitle?: string;
        isOpenToWork?: boolean;
        openToWorkRoles?: string | string[];
        username?: string;
        marketingOptIn?: boolean;
        llmOptIn?: boolean;
    }): Promise<{
        id: any;
        email: any;
        name: any;
        avatar: any;
        provider: any;
        role: any;
        plan: any;
        userType: any;
        companyName: any;
        companyTitle: any;
        isOpenToWork: any;
        openToWorkRoles: any;
        username: any;
    }>;
    deleteAccount(userId: string): Promise<void>;
    login(email: string, password: string): Promise<string>;
}
export {};
