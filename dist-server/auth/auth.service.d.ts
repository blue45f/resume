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
    getAllUsers(search?: string): Promise<{
        id: string;
        email: string;
        name: string;
        provider: string;
        role: string;
        plan: string;
        createdAt: Date;
    }[]>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        provider: string;
        role: string;
        plan: string;
        userType: string;
        companyName: string;
        companyTitle: string;
        isOpenToWork: boolean;
        openToWorkRoles: string;
        resumeCount: number;
        followerCount: number;
        followingCount: number;
    }>;
    getPublicPortfolio(username: string): Promise<{
        user: {
            id: string;
            username: string;
            name: string;
            avatar: string;
            isOpenToWork: boolean;
            openToWorkRoles: string;
            companyName: string | null;
            companyTitle: string | null;
            userType: string;
        };
        stats: {
            publicResumeCount: number;
            followerCount: number;
            followingCount: number;
            totalViews: number;
            totalExperiences: number;
        };
        topSkills: string[];
        resumes: {
            id: string;
            title: string;
            viewCount: number;
            updatedAt: Date;
            name: any;
            summary: any;
            github: any;
            website: any;
            photo: any;
            experiences: any;
            tags: any;
            topSkills: any;
        }[];
    } | null>;
    getAvailableProviders(): string[];
    getGoogleProfile(code: string): Promise<OAuthProfile>;
    getGithubProfile(code: string): Promise<OAuthProfile>;
    getKakaoProfile(code: string): Promise<OAuthProfile>;
    linkSocialAccount(userId: string, provider: string, providerId: string, avatar?: string): Promise<void>;
    getLinkedAccounts(userId: string): Promise<{
        provider: string;
        hasPassword: boolean;
    }>;
    private findOrCreateUser;
    private getCallbackUrl;
    getFrontendUrl(): string;
    register(email: string, password: string, name: string, userType?: string, companyName?: string, companyTitle?: string): Promise<string>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    updateProfile(userId: string, data: {
        userType?: string;
        name?: string;
        companyName?: string;
        companyTitle?: string;
        isOpenToWork?: boolean;
        openToWorkRoles?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        provider: string;
        role: string;
        plan: string;
        userType: string;
        companyName: string;
        companyTitle: string;
        isOpenToWork: boolean;
        openToWorkRoles: string;
    }>;
    deleteAccount(userId: string): Promise<void>;
    login(email: string, password: string): Promise<string>;
}
export {};
