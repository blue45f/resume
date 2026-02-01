import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

const mockAuthService = {
  generateOAuthState: jest.fn(),
  validateOAuthState: jest.fn(),
  getGoogleAuthUrl: jest.fn(),
  getGithubAuthUrl: jest.fn(),
  getKakaoAuthUrl: jest.fn(),
  handleGoogleCallback: jest.fn(),
  handleGithubCallback: jest.fn(),
  handleKakaoCallback: jest.fn(),
  getFrontendUrl: jest.fn().mockReturnValue('http://localhost:5173'),
  getAvailableProviders: jest.fn(),
  getProfile: jest.fn(),
  register: jest.fn(),
  login: jest.fn(),
};

function mockResponse(): Response {
  const res = {
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as any;
  return res;
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  describe('getProviders', () => {
    it('사용 가능한 프로바이더 목록 반환', () => {
      mockAuthService.getAvailableProviders.mockReturnValue(['google', 'github']);
      const result = controller.getProviders();
      expect(result).toEqual(['google', 'github']);
    });
  });

  describe('Google OAuth', () => {
    it('로그인 → state 생성 후 Google 리다이렉트', () => {
      mockAuthService.generateOAuthState.mockReturnValue('test-state');
      mockAuthService.getGoogleAuthUrl.mockReturnValue('https://accounts.google.com/...');
      const res = mockResponse();
      controller.googleLogin(res);
      expect(mockAuthService.generateOAuthState).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('https://accounts.google.com/...');
    });

    it('콜백 성공 → 프론트엔드로 token 전달', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(true);
      mockAuthService.handleGoogleCallback.mockResolvedValue('jwt-token-123');
      const res = mockResponse();
      await controller.googleCallback('auth-code', 'valid-state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback?token=jwt-token-123');
    });

    it('콜백 state 검증 실패 → 에러 리다이렉트', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(false);
      const res = mockResponse();
      await controller.googleCallback('auth-code', 'bad-state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=google_failed');
    });

    it('콜백 code 없음 → 에러 리다이렉트', async () => {
      const res = mockResponse();
      await controller.googleCallback('', 'state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=google_failed');
    });

    it('콜백 외부 API 실패 → 에러 리다이렉트', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(true);
      mockAuthService.handleGoogleCallback.mockRejectedValue(new Error('Google API failed'));
      const res = mockResponse();
      await controller.googleCallback('code', 'state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=google_failed');
    });
  });

  describe('GitHub OAuth', () => {
    it('로그인 → GitHub 리다이렉트', () => {
      mockAuthService.generateOAuthState.mockReturnValue('state');
      mockAuthService.getGithubAuthUrl.mockReturnValue('https://github.com/...');
      const res = mockResponse();
      controller.githubLogin(res);
      expect(res.redirect).toHaveBeenCalledWith('https://github.com/...');
    });

    it('콜백 성공', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(true);
      mockAuthService.handleGithubCallback.mockResolvedValue('jwt-gh');
      const res = mockResponse();
      await controller.githubCallback('code', 'state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback?token=jwt-gh');
    });

    it('콜백 실패', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(false);
      const res = mockResponse();
      await controller.githubCallback('code', 'bad', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=github_failed');
    });
  });

  describe('Kakao OAuth', () => {
    it('로그인 → Kakao 리다이렉트', () => {
      mockAuthService.generateOAuthState.mockReturnValue('state');
      mockAuthService.getKakaoAuthUrl.mockReturnValue('https://kauth.kakao.com/...');
      const res = mockResponse();
      controller.kakaoLogin(res);
      expect(res.redirect).toHaveBeenCalledWith('https://kauth.kakao.com/...');
    });

    it('콜백 성공 (state 있음)', async () => {
      mockAuthService.validateOAuthState.mockReturnValue(true);
      mockAuthService.handleKakaoCallback.mockResolvedValue('jwt-kakao');
      const res = mockResponse();
      await controller.kakaoCallback('code', 'state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback?token=jwt-kakao');
    });

    it('콜백 성공 (state 없음 - Kakao 특성)', async () => {
      mockAuthService.handleKakaoCallback.mockResolvedValue('jwt-kakao');
      const res = mockResponse();
      await controller.kakaoCallback('code', '', res);
      // state 없으면 검증 스킵하고 진행
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/auth/callback?token=jwt-kakao');
    });

    it('콜백 code 없음 → 에러', async () => {
      const res = mockResponse();
      await controller.kakaoCallback('', 'state', res);
      expect(res.redirect).toHaveBeenCalledWith('http://localhost:5173/login?error=kakao_failed');
    });
  });

  describe('getProfile', () => {
    it('로그인 사용자 → 프로필 반환', async () => {
      mockAuthService.getProfile.mockResolvedValue({ id: 'u1', name: '홍길동' });
      const result = await controller.getProfile({ user: { id: 'u1' } });
      expect(result).toEqual({ id: 'u1', name: '홍길동' });
    });

    it('비로그인 → null', () => {
      const result = controller.getProfile({ user: null });
      expect(result).toBeNull();
    });
  });
});
