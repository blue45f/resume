import { Controller, Get, Post, Delete, Query, Res, Req, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';

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
  async googleCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      if (!code || !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state or missing code');
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
  async githubCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      if (!code || !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state or missing code');
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
  async kakaoCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    try {
      // Kakao는 state 미전달 가능 → state 없으면 스킵
      if (!code) throw new Error('Missing authorization code');
      if (state && !this.authService.validateOAuthState(state)) {
        throw new Error('Invalid OAuth state');
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
  @ApiOperation({ summary: '이메일 회원가입' })
  async register(
    @Body() body: { email: string; password: string; name: string },
    @Res() res: Response,
  ) {
    try {
      const token = await this.authService.register(body.email, body.password, body.name);
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
  @ApiOperation({ summary: '이메일 로그인' })
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const token = await this.authService.login(body.email, body.password);
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
  async changePassword(
    @Body() body: { currentPassword: string; newPassword: string },
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: '로그인이 필요합니다' });
        return;
      }
      await this.authService.changePassword(req.user.id, body.currentPassword, body.newPassword);
      res.json({ success: true, message: '비밀번호가 변경되었습니다' });
    } catch (e: any) {
      res.status(401).json({ message: e.message || '비밀번호 변경에 실패했습니다' });
    }
  }

  // ---- 계정 삭제 ----
  @Delete('account')
  @ApiOperation({ summary: '계정 삭제 (모든 데이터 영구 삭제)' })
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

  // ---- 내 정보 ----
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getProfile(@Req() req: any) {
    if (!req.user) return null;
    return this.authService.getProfile(req.user.id);
  }
}
