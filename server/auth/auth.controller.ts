import { Controller, Get, Query, Res, Req } from '@nestjs/common';
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
    res.redirect(this.authService.getGoogleAuthUrl());
  }

  @Get('google/callback')
  @Public()
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const token = await this.authService.handleGoogleCallback(code);
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
    res.redirect(this.authService.getGithubAuthUrl());
  }

  @Get('github/callback')
  @Public()
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const token = await this.authService.handleGithubCallback(code);
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
    res.redirect(this.authService.getKakaoAuthUrl());
  }

  @Get('kakao/callback')
  @Public()
  async kakaoCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const token = await this.authService.handleKakaoCallback(code);
      res.redirect(`${this.authService.getFrontendUrl()}/auth/callback?token=${token}`);
    } catch {
      res.redirect(`${this.authService.getFrontendUrl()}/login?error=kakao_failed`);
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
