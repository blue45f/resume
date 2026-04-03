export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
    userType?: string;
    companyName?: string;
    companyTitle?: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
