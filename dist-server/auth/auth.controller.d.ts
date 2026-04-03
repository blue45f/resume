import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getProviders(): string[];
    googleLogin(res: Response): void;
    googleCallback(code: string, state: string, res: Response): Promise<void>;
    githubLogin(res: Response): void;
    githubCallback(code: string, state: string, res: Response): Promise<void>;
    kakaoLogin(res: Response): void;
    kakaoCallback(code: string, state: string, res: Response): Promise<void>;
    register(dto: RegisterDto, res: Response): Promise<void>;
    login(dto: LoginDto, res: Response): Promise<void>;
    logout(res: Response): void;
    changePassword(dto: ChangePasswordDto, req: any, res: Response): Promise<void>;
    deleteAccount(req: any, res: Response): Promise<void>;
    getLinkedAccounts(req: any): Promise<{
        provider: string;
        hasPassword: boolean;
    }> | null;
    linkSocial(provider: string, req: any, res: Response): void;
    getProfile(req: any): Promise<{
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
        resumeCount: number;
        followerCount: number;
        followingCount: number;
    }> | null;
    updateProfile(body: UpdateProfileDto, req: any, res: Response): Promise<void>;
    getAllUsers(req: any, search?: string): Promise<{
        id: string;
        email: string;
        name: string;
        provider: string;
        role: string;
        plan: string;
        createdAt: Date;
    }[]>;
    setUserRole(userId: string, role: string, req: any, res: Response): Promise<void>;
}
