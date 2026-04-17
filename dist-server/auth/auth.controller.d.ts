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
        provider: any;
        hasPassword: boolean;
    }> | null;
    linkSocial(provider: string, req: any, res: Response): void;
    getUserPortfolio(username: string): Promise<{
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
    getProfile(req: any): Promise<{
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
    }> | null;
    updateProfile(body: UpdateProfileDto, req: any, res: Response): Promise<void>;
    getAllUsers(req: any, search?: string): Promise<any>;
    setUserRole(userId: string, role: string, req: any, res: Response): Promise<void>;
}
