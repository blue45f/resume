export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    userType?: string;
    companyName?: string;
    companyTitle?: string;
    marketingOptIn?: boolean;
    llmOptIn?: boolean;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateProfileDto {
    userType?: string;
    name?: string;
    companyName?: string;
    companyTitle?: string;
    username?: string;
    isOpenToWork?: boolean;
    openToWorkRoles?: string[];
    marketingOptIn?: boolean;
    llmOptIn?: boolean;
}
