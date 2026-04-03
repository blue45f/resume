import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';

interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  avatar: string;
}

@Injectable()
export class AuthService {
  private readonly frontendUrl: string;
  private readonly stateSecret: string;
  private readonly logger = new Logger(AuthService.name);
  private readonly STATE_TTL_MS = 10 * 60 * 1000; // 10분 (cold start 고려)

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {
    this.frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';
    // JWT secret 재사용 (state 서명용)
    this.stateSecret = this.config.get('JWT_SECRET') || 'dev-only-state-secret';
  }

  /**
   * HMAC 서명 기반 stateless OAuth state 생성
   * 형식: {timestamp}.{nonce}.{hmac}
   * 서버 재시작에도 검증 가능 (인메모리 저장 불필요)
   */
  generateOAuthState(): string {
    const timestamp = Date.now().toString(36);
    const nonce = randomBytes(8).toString('hex');
    const payload = `${timestamp}.${nonce}`;
    const hmac = createHmac('sha256', this.stateSecret).update(payload).digest('hex').slice(0, 16);
    return `${payload}.${hmac}`;
  }

  validateOAuthState(state: string | undefined): boolean {
    if (!state) return false;
    const parts = state.split('.');
    // 3 parts = normal login, 4 parts = linking mode (timestamp.nonce.hmac.userId)
    if (parts.length !== 3 && parts.length !== 4) return false;

    const [timestamp, nonce, hmac] = parts;
    const payload = `${timestamp}.${nonce}`;
    const expected = createHmac('sha256', this.stateSecret).update(payload).digest('hex').slice(0, 16);

    if (hmac !== expected) {
      this.logger.warn('OAuth state HMAC 불일치');
      return false;
    }

    // TTL 확인
    const createdAt = parseInt(timestamp, 36);
    if (Date.now() - createdAt > this.STATE_TTL_MS) {
      this.logger.warn('OAuth state 만료');
      return false;
    }

    return true;
  }

  /**
   * state에서 linking mode의 userId를 추출. 없으면 null.
   */
  extractLinkUserId(state: string): string | null {
    const parts = state.split('.');
    if (parts.length === 4) return parts[3];
    return null;
  }

  // ---- OAuth URL 생성 ----

  getGoogleAuthUrl(state: string) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('google');
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email+profile&prompt=select_account&state=${state}`;
  }

  getGithubAuthUrl(state: string) {
    const clientId = this.config.get('GITHUB_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('github');
    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
  }

  getKakaoAuthUrl(state: string) {
    const clientId = this.config.get('KAKAO_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('kakao');
    return `https://kauth.kakao.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  }

  // ---- OAuth 콜백 처리 ----

  async handleGoogleCallback(code: string): Promise<string> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.getCallbackUrl('google');

    // 코드 → 토큰
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('Google 인증 실패');

    // 프로필 조회
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    return this.findOrCreateUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.email || '',
      name: profile.name || '',
      avatar: profile.picture || '',
    });
  }

  async handleGithubCallback(code: string): Promise<string> {
    const clientId = this.config.get('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');

    // 코드 → 토큰
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('GitHub 인증 실패');

    // 프로필 조회
    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // 이메일 조회 (private일 수 있음)
    let email = profile.email || '';
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary);
      email = primary?.email || emails[0]?.email || '';
    }

    return this.findOrCreateUser({
      provider: 'github',
      providerId: String(profile.id),
      email,
      name: profile.name || profile.login || '',
      avatar: profile.avatar_url || '',
    });
  }

  async handleKakaoCallback(code: string): Promise<string> {
    const clientId = this.config.get('KAKAO_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('kakao');

    // 코드 → 토큰
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('Kakao 인증 실패');

    // 프로필 조회
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const kakaoAccount = profile.kakao_account || {};

    return this.findOrCreateUser({
      provider: 'kakao',
      providerId: String(profile.id),
      email: kakaoAccount.email || '',
      name: kakaoAccount.profile?.nickname || '',
      avatar: kakaoAccount.profile?.thumbnail_image_url || '',
    });
  }

  // ---- 관리자 기능 ----

  async setUserRole(adminUserId: string, targetUserId: string, role: string) {
    const admin = await this.prisma.user.findUnique({ where: { id: adminUserId } });
    if (!admin || admin.role !== 'superadmin') {
      throw new UnauthorizedException('관리자만 역할을 변경할 수 있습니다');
    }
    if (!['user', 'admin', 'superadmin'].includes(role)) {
      throw new UnauthorizedException('유효하지 않은 역할입니다');
    }
    await this.prisma.user.update({ where: { id: targetUserId }, data: { role } });
    return { success: true, userId: targetUserId, role };
  }

  async getAllUsers(search?: string) {
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    return this.prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, provider: true, role: true, plan: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- 내 정보 ----

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const [resumeCount, followerCount, followingCount] = await Promise.all([
      this.prisma.resume.count({ where: { userId } }),
      this.prisma.follow.count({ where: { followingId: userId } }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);
    return {
      id: user.id, email: user.email, name: user.name, avatar: user.avatar,
      provider: user.provider, role: user.role || 'user', plan: user.plan || 'free',
      resumeCount,
      followerCount,
      followingCount,
    };
  }

  getAvailableProviders() {
    const providers: string[] = [];
    if (this.config.get('GOOGLE_CLIENT_ID')) providers.push('google');
    if (this.config.get('GITHUB_CLIENT_ID')) providers.push('github');
    if (this.config.get('KAKAO_CLIENT_ID')) providers.push('kakao');
    return providers;
  }

  // ---- 소셜 계정 연동 ----

  async getGoogleProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.getCallbackUrl('google');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('Google 인증 실패');

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    return {
      provider: 'google',
      providerId: profile.id,
      email: profile.email || '',
      name: profile.name || '',
      avatar: profile.picture || '',
    };
  }

  async getGithubProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.config.get('GITHUB_CLIENT_ID');
    const clientSecret = this.config.get('GITHUB_CLIENT_SECRET');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('GitHub 인증 실패');

    const profileRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    let email = profile.email || '';
    if (!email) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary);
      email = primary?.email || emails[0]?.email || '';
    }

    return {
      provider: 'github',
      providerId: String(profile.id),
      email,
      name: profile.name || profile.login || '',
      avatar: profile.avatar_url || '',
    };
  }

  async getKakaoProfile(code: string): Promise<OAuthProfile> {
    const clientId = this.config.get('KAKAO_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('kakao');

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new UnauthorizedException('Kakao 인증 실패');

    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const kakaoAccount = profile.kakao_account || {};

    return {
      provider: 'kakao',
      providerId: String(profile.id),
      email: kakaoAccount.email || '',
      name: kakaoAccount.profile?.nickname || '',
      avatar: kakaoAccount.profile?.thumbnail_image_url || '',
    };
  }

  async linkSocialAccount(userId: string, provider: string, providerId: string, avatar?: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');

    // Check if this social account is already linked to another user
    const existing = await this.prisma.user.findFirst({
      where: { provider, providerId, id: { not: userId } },
    });
    if (existing) {
      throw new UnauthorizedException('이 소셜 계정은 다른 사용자에게 연결되어 있습니다');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { provider, providerId, avatar: avatar || user.avatar },
    });
  }

  async getLinkedAccounts(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return {
      provider: user.provider,
      hasPassword: !!user.passwordHash,
    };
  }

  // ---- 내부 ----

  private async findOrCreateUser(profile: OAuthProfile): Promise<string> {
    let user = await this.prisma.user.findFirst({
      where: { provider: profile.provider, providerId: profile.providerId },
    });

    if (!user) {
      // 같은 이메일로 가입된 유저 확인
      if (profile.email) {
        user = await this.prisma.user.findUnique({ where: { email: profile.email } });
        if (user) {
          // 기존 계정에 소셜 프로바이더 연결
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { provider: profile.provider, providerId: profile.providerId, avatar: profile.avatar || user.avatar },
          });
        }
      }

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: profile.email || `${profile.provider}_${profile.providerId}@noemail`,
            name: profile.name,
            avatar: profile.avatar,
            provider: profile.provider,
            providerId: profile.providerId,
          },
        });
      }
    }

    return this.jwt.sign({ sub: user.id, role: user.role || 'user' });
  }

  private getCallbackUrl(provider: string): string {
    const apiUrl = this.config.get('API_URL') || `http://localhost:${this.config.get('PORT') || 3001}`;
    return `${apiUrl}/api/auth/${provider}/callback`;
  }

  getFrontendUrl(): string {
    return this.frontendUrl;
  }

  async register(email: string, password: string, name: string): Promise<string> {
    if (!email || !password || !name) {
      throw new UnauthorizedException('이메일, 비밀번호, 이름은 필수입니다');
    }
    if (password.length < 8) {
      throw new UnauthorizedException('비밀번호는 8자 이상이어야 합니다');
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException('이미 가입된 이메일입니다');
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        provider: 'local',
        providerId: email,
      },
    });

    return this.jwt.sign({ sub: user.id, role: user.role || 'user' });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('새 비밀번호는 8자 이상이어야 합니다');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');

    if (user.passwordHash) {
      const bcrypt = await import('bcryptjs');
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다');
    }

    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');

    // Delete all user data (cascade should handle related records)
    await this.prisma.user.delete({ where: { id: userId } });
  }

  async login(email: string, password: string): Promise<string> {
    if (!email || !password) {
      throw new UnauthorizedException('이메일과 비밀번호를 입력해주세요');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }

    return this.jwt.sign({ sub: user.id, role: user.role || 'user' });
  }
}
