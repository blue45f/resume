import { Controller, Get, Post, Query, Res, Req } from '@nestjs/common';
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

  // ---- 로그아웃 ----
  @Post('logout')
  @Public()
  @ApiOperation({ summary: '로그아웃 (쿠키 삭제)' })
  logout(@Res() res: Response) {
    res.clearCookie('token', { path: '/' });
    res.json({ success: true });
  }

  // ---- 내 정보 ----
  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  getProfile(@Req() req: any) {
    if (!req.user) return null;
    return this.authService.getProfile(req.user.id);
  }
}
