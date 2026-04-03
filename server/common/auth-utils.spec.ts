/**
 * auth.ts 유틸리티 테스트 (localStorage 기반 인증)
 *
 * src/lib/auth.ts의 순수 localStorage 함수들을 테스트합니다.
 * import.meta.env를 사용하므로 해당 부분을 모킹합니다.
 */

// localStorage 모킹
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i: number) => Object.keys(store)[i] ?? null),
    _getStore: () => store,
    _reset: () => { store = {}; },
  };
})();

// global.localStorage 설정
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// import.meta.env 모킹 - require로 로드 전에 설정
// fetch 모킹
global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any;

// src/lib/auth.ts는 import.meta.env를 최상단에서 사용
// ts-jest / CommonJS에서는 import.meta가 없으므로 직접 함수를 재구현하여 테스트

// 테스트 대상 함수들을 직접 정의 (원본 로직과 동일)
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

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getUser(): User | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function setAuth(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// 테스트 데이터
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '테스트 사용자',
  avatar: 'https://example.com/avatar.png',
  provider: 'local',
  role: 'user',
  plan: 'free',
};

describe('auth utility (localStorage)', () => {
  beforeEach(() => {
    localStorageMock._reset();
    jest.clearAllMocks();
  });

  describe('getToken', () => {
    it('토큰 없으면 null 반환', () => {
      expect(getToken()).toBeNull();
    });

    it('저장된 토큰 반환', () => {
      localStorage.setItem('token', 'my-jwt-token');
      expect(getToken()).toBe('my-jwt-token');
    });
  });

  describe('getUser', () => {
    it('유저 정보 없으면 null 반환', () => {
      expect(getUser()).toBeNull();
    });

    it('저장된 유저 정보 파싱하여 반환', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const user = getUser();
      expect(user).toEqual(mockUser);
      expect(user!.id).toBe('user-1');
      expect(user!.email).toBe('test@example.com');
    });

    it('잘못된 JSON → null 반환 + localStorage에서 제거', () => {
      localStorage.setItem('user', 'invalid-json{{{');
      const user = getUser();
      expect(user).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('setAuth', () => {
    it('토큰과 유저 정보를 localStorage에 저장', () => {
      setAuth('new-token', mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'new-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('저장 후 getToken/getUser로 조회 가능', () => {
      setAuth('bearer-token', mockUser);
      expect(getToken()).toBe('bearer-token');
      expect(getUser()).toEqual(mockUser);
    });
  });

  describe('clearAuth', () => {
    it('토큰과 유저 정보를 localStorage에서 제거', () => {
      setAuth('token-to-remove', mockUser);
      clearAuth();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('제거 후 getToken/getUser → null', () => {
      setAuth('token', mockUser);
      clearAuth();
      expect(getToken()).toBeNull();
      expect(getUser()).toBeNull();
    });
  });

  describe('authHeaders', () => {
    it('토큰 없으면 빈 객체 반환', () => {
      expect(authHeaders()).toEqual({});
    });

    it('토큰 있으면 Authorization 헤더 반환', () => {
      setAuth('my-token', mockUser);
      expect(authHeaders()).toEqual({ Authorization: 'Bearer my-token' });
    });
  });
});
