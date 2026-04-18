import { Controller, Get, Post, Patch, Delete, Query, Res, Req, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('providers')
  @Public()
  @ApiOperation({ summary: '사용 가능한 소셜 로그인 프로바이더' })
  getProviders() {
    return this.authService.getAvailableProviders();
  }

  // ---- Google ----
  @Get('google')
  @Public()
  @ApiOperation({ summary: 'Google 로그인 리다이렉트' })
  googleLogin(@Res() res: Response) {
    const state = this.authService.generateOAuthState();
    res.redirect(this.authService.getGoogleAuthUrl(state));
  }

  @Get('google/callback')
  @Public()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      if (!code || !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state or missing code');
      }

      // Check if this is a link request (state contains userId)
      const linkUserId = this.authService.extractLinkUserId(state);
      if (linkUserId) {
        const profile = await this.authService.getGoogleProfile(code);
        await this.authService.linkSocialAccount(
          linkUserId,
          'google',
          profile.providerId,
          profile.avatar,
        );
        res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=google`);
        return;
      }

      const token = await this.authService.handleGoogleCallback(code);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
    } catch {
      res.redirect(`${this.authService.getFrontendUrl()}/login?error=google_failed`);
    }
  }

  // ---- GitHub ----
  @Get('github')
  @Public()
  @ApiOperation({ summary: 'GitHub 로그인 리다이렉트' })
  githubLogin(@Res() res: Response) {
    const state = this.authService.generateOAuthState();
    res.redirect(this.authService.getGithubAuthUrl(state));
  }

  @Get('github/callback')
  @Public()
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      if (!code || !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state or missing code');
      }

      const linkUserId = this.authService.extractLinkUserId(state);
      if (linkUserId) {
        const profile = await this.authService.getGithubProfile(code);
        await this.authService.linkSocialAccount(
          linkUserId,
          'github',
          profile.providerId,
          profile.avatar,
        );
        res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=github`);
        return;
      }

      const token = await this.authService.handleGithubCallback(code);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
    } catch {
      res.redirect(`${this.authService.getFrontendUrl()}/login?error=github_failed`);
    }
  }

  // ---- Kakao ----
  @Get('kakao')
  @Public()
  @ApiOperation({ summary: 'Kakao 로그인 리다이렉트' })
  kakaoLogin(@Res() res: Response) {
    const state = this.authService.generateOAuthState();
    res.redirect(this.authService.getKakaoAuthUrl(state));
  }

  @Get('kakao/callback')
  @Public()
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      // Kakao는 state 미전달 가능 → state 없으면 스킵
      if (!code) throw new Error('Missing authorization code');
      if (state && !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state');
      }

      if (state) {
        const linkUserId = this.authService.extractLinkUserId(state);
        if (linkUserId) {
          const profile = await this.authService.getKakaoProfile(code);
          await this.authService.linkSocialAccount(
            linkUserId,
            'kakao',
            profile.providerId,
            profile.avatar,
          );
          res.redirect(`${this.authService.getFrontendUrl()}/settings?linked=kakao`);
          return;
        }
      }

      const token = await this.authService.handleKakaoCallback(code);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
    } catch {
      res.redirect(`${this.authService.getFrontendUrl()}/login?error=kakao_failed`);
    }
  }

  // ---- 이메일 회원가입/로그인 ----
  @Post('register')
  @Public()
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 registrations/min per IP
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiResponse({ status: 200, description: '회원가입 성공, JWT 토큰 반환' })
  @ApiResponse({ status: 401, description: '중복 이메일 또는 유효성 검증 실패' })
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    try {
      const token = await this.authService.register(
        dto.email,
        dto.password,
        dto.name!,
        dto.userType,
        dto.companyName,
        dto.companyTitle,
        dto.marketingOptIn,
        dto.llmOptIn,
      );
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.json({ token });
    } catch (e: any) {
      res.status(401).json({ message: e.message || '회원가입에 실패했습니다' });
    }
  }

  @Post('login')
  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 login attempts/min per IP
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiResponse({ status: 200, description: '로그인 성공, JWT 토큰 반환' })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치' })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    try {
      const token = await this.authService.login(dto.email, dto.password);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      res.json({ token });
    } catch (e: any) {
      res.status(401).json({ message: e.message || '로그인에 실패했습니다' });
    }
  }

  // ---- 로그아웃 ----
  @Post('logout')
  @Public()
  @ApiOperation({ summary: '로그아웃 (쿠키 삭제)' })
  logout(@Res() res: Response) {
    res.clearCookie('token', { path: '/' });
    res.json({ success: true });
  }

  // ---- 비밀번호 변경 ----
  @Post('change-password')
  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 401, description: '현재 비밀번호 불일치 또는 인증 필요' })
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: any, @Res() res: Response) {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: '로그인이 필요합니다' });
        return;
      }
      await this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
      res.json({ success: true, message: '비밀번호가 변경되었습니다' });
    } catch (e: any) {
      res.status(401).json({ message: e.message || '비밀번호 변경에 실패했습니다' });
    }
  }

  // ---- 계정 삭제 ----
  @Delete('account')
  @ApiOperation({ summary: '계정 삭제 (모든 데이터 영구 삭제)' })
  @ApiResponse({ status: 200, description: '계정 삭제 완료' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async deleteAccount(@Req() req: any, @Res() res: Response) {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: '로그인이 필요합니다' });
        return;
      }
      await this.authService.deleteAccount(req.user.id);
      res.clearCookie('token', { path: '/' });
      res.json({ success: true, message: '계정이 삭제되었습니다' });
    } catch (e: any) {
      res.status(400).json({ message: e.message || '계정 삭제에 실패했습니다' });
    }
  }

  // ---- 소셜 계정 연동 ----
  @Get('linked-accounts')
  @ApiOperation({ summary: '연결된 소셜 계정 정보' })
  getLinkedAccounts(@Req() req: any) {
    if (!req.user?.id) return null;
    return this.authService.getLinkedAccounts(req.user.id);
  }

  @Get('link/:provider')
  @ApiOperation({ summary: '소셜 계정 연동 시작' })
  linkSocial(@Param('provider') provider: string, @Req() req: any, @Res() res: Response) {
    if (!req.user?.id) {
      res.redirect(`${this.authService.getFrontendUrl()}/login`);
      return;
    }
    const state = this.authService.generateOAuthState() + '.' + req.user.id;
    switch (provider) {
      case 'google':
        res.redirect(this.authService.getGoogleAuthUrl(state));
        break;
      case 'github':
        res.redirect(this.authService.getGithubAuthUrl(state));
        break;
      case 'kakao':
        res.redirect(this.authService.getKakaoAuthUrl(state));
        break;
      default:
        res.status(400).json({ message: '지원하지 않는 프로바이더입니다' });
    }
  }

  // ---- 공개 포트폴리오 (username 조회) ----
  @Get('u/:username')
  @Public()
  @ApiOperation({ summary: '공개 포트폴리오 페이지용 사용자 프로필 조회 (username)' })
  getUserPortfolio(@Param('username') username: string) {
    return this.authService.getPublicPortfolio(username);
  }

  // ---- 내 정보 ----
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  @ApiResponse({ status: 200, description: '프로필 정보 반환 (passwordHash 미포함)' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getProfile(@Req() req: any) {
    if (!req.user) return null;
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: '프로필 수정 (userType, name 등)' })
  @ApiResponse({ status: 200, description: '수정된 프로필 반환' })
  @ApiResponse({ status: 400, description: '유효하지 않은 사용자 유형 등' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async updateProfile(@Body() body: UpdateProfileDto, @Req() req: any, @Res() res: Response) {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: '로그인이 필요합니다' });
        return;
      }
      const updated = await this.authService.updateProfile(req.user.id, body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message || '프로필 수정에 실패했습니다' });
    }
  }

  // ---- 관리자 기능 ----

  @Get('admin/users')
  @ApiOperation({ summary: '전체 사용자 목록 (관리자)' })
  async getAllUsers(@Req() req: any, @Query('search') search?: string) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') return [];
    return this.authService.getAllUsers(search);
  }

  @Post('admin/users/:userId/role')
  @ApiOperation({ summary: '사용자 역할 변경 (관리자)' })
  async setUserRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.setUserRole(req.user?.id, userId, role);
      res.json(result);
    } catch (e: any) {
      res.status(403).json({ message: e.message || '권한이 없습니다' });
    }
  }
}
