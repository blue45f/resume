declare const localStorageMock: {
    getItem: jest.Mock<string, [key: string], any>;
    setItem: jest.Mock<void, [key: string, value: string], any>;
    removeItem: jest.Mock<void, [key: string], any>;
    clear: jest.Mock<void, [], any>;
    readonly length: number;
    key: jest.Mock<string, [i: number], any>;
    _getStore: () => Record<string, string>;
    _reset: () => void;
};
interface User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    provider: string;
    role?: string;
    plan?: string;
    userType?: string;
    companyName?: string;
}
declare function getToken(): string | null;
declare function getUser(): User | null;
declare function setAuth(token: string, user: User): void;
declare function clearAuth(): void;
declare function authHeaders(): Record<string, string>;
declare const mockUser: User;
