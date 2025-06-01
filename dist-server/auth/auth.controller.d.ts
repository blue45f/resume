import { Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getProviders(): string[];
    googleLogin(res: Response): void;
    googleCallback(code: string, res: Response): Promise<void>;
    githubLogin(res: Response): void;
    githubCallback(code: string, res: Response): Promise<void>;
    kakaoLogin(res: Response): void;
    kakaoCallback(code: string, res: Response): Promise<void>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        avatar: string;
        provider: string;
    }> | null;
}
