import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  }

  async get(key: string): Promise<string | null> {
    const config = await this.prisma.systemConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  async getBoolean(key: string, defaultValue = false): Promise<boolean> {
    const val = await this.get(key);
    if (val === null) return defaultValue;
    return val === 'true';
  }

  async getNumber(key: string, defaultValue = 0): Promise<number> {
    const val = await this.get(key);
    if (val === null) return defaultValue;
    const n = parseInt(val, 10);
    return isNaN(n) ? defaultValue : n;
  }

  async set(key: string, value: string) {
    return this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async setMany(configs: { key: string; value: string }[]) {
    return Promise.all(configs.map((c) => this.set(c.key, c.value)));
  }

  async getPublicConfig() {
    const keys = [
      'site_name',
      'site_description',
      'monetization_enabled',
      'maintenance_mode',
      'allow_signup',
    ];
    const configs = await this.prisma.systemConfig.findMany({ where: { key: { in: keys } } });
    return Object.fromEntries(configs.map((c) => [c.key, c.value]));
  }

  // ── 파일 업로드 설정 (전역 토글) ─────────────────────────────
  /** 파일 업로드 기능 활성화 여부 — admin이 /admin/system-config 에서 토글 */
  static readonly UPLOAD_KEY_ENABLED = 'feature.fileUpload.enabled';
  static readonly UPLOAD_KEY_MAX_MB = 'feature.fileUpload.maxSizeMb';
  static readonly UPLOAD_KEY_MIME = 'feature.fileUpload.allowedMime';
  static readonly UPLOAD_DEFAULTS = {
    enabled: true,
    maxSizeMb: 10,
    allowedMime: 'image/*,application/pdf,application/zip',
  };

  async getUploadSettings(): Promise<{
    enabled: boolean;
    maxSizeMb: number;
    allowedMime: string;
  }> {
    const [enabled, maxSizeMb, mime] = await Promise.all([
      this.getBoolean(
        SystemConfigService.UPLOAD_KEY_ENABLED,
        SystemConfigService.UPLOAD_DEFAULTS.enabled,
      ),
      this.getNumber(
        SystemConfigService.UPLOAD_KEY_MAX_MB,
        SystemConfigService.UPLOAD_DEFAULTS.maxSizeMb,
      ),
      this.get(SystemConfigService.UPLOAD_KEY_MIME),
    ]);
    return {
      enabled,
      maxSizeMb,
      allowedMime: mime ?? SystemConfigService.UPLOAD_DEFAULTS.allowedMime,
    };
  }

  async assertUploadAllowed(file: { size: number; mimetype: string }): Promise<void> {
    const settings = await this.getUploadSettings();
    if (!settings.enabled) {
      throw new Error('파일 업로드가 관리자에 의해 비활성화되었습니다');
    }
    const maxBytes = settings.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`파일 크기가 ${settings.maxSizeMb}MB 를 초과합니다`);
    }
    const patterns = settings.allowedMime
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (patterns.length === 0) return;
    const matched = patterns.some((p) => {
      if (p === '*/*') return true;
      if (p.endsWith('/*')) return file.mimetype.startsWith(p.slice(0, -1));
      return file.mimetype === p;
    });
    if (!matched) {
      throw new Error(`허용되지 않은 파일 형식입니다 (${file.mimetype})`);
    }
  }

  // ── Content Permissions ─────────────────────────────────────────────

  private static readonly PERMISSION_DEFAULTS: Record<string, string> = {
    'perm.curatedJobs.create': 'admin,recruiter',
    'perm.curatedJobs.edit': 'admin,recruiter,author',
    'perm.curatedJobs.delete': 'admin,author',
    'perm.externalLinks.create': 'admin',
    'perm.externalLinks.edit': 'admin',
    'perm.externalLinks.delete': 'admin',
    'perm.jobPosts.create': 'admin,recruiter',
    'perm.jobPosts.edit': 'admin,recruiter,author',
    'perm.jobPosts.delete': 'admin,author',
    'perm.notices.create': 'admin',
    'perm.notices.edit': 'admin',
    'perm.notices.delete': 'admin',
    'perm.community.create': 'all',
    'perm.community.edit': 'admin,author',
    'perm.community.delete': 'admin,author',
    'perm.banners.create': 'admin',
    'perm.banners.edit': 'admin',
    'perm.banners.delete': 'admin',
  };

  async getPermissions(): Promise<Record<string, string>> {
    const keys = Object.keys(SystemConfigService.PERMISSION_DEFAULTS);
    const configs = await this.prisma.systemConfig.findMany({
      where: { key: { in: keys } },
    });
    const stored = Object.fromEntries(configs.map((c) => [c.key, c.value]));
    return { ...SystemConfigService.PERMISSION_DEFAULTS, ...stored };
  }

  async setPermissions(perms: Record<string, string>) {
    const validKeys = new Set(Object.keys(SystemConfigService.PERMISSION_DEFAULTS));
    const configs = Object.entries(perms)
      .filter(([k]) => validKeys.has(k))
      .map(([key, value]) => ({ key, value }));
    await this.setMany(configs);
    return this.getPermissions();
  }

  async checkPermission(
    permKey: string,
    user: { id?: string; role?: string; userType?: string } | null,
    authorId?: string | null,
  ): Promise<boolean> {
    const perms = await this.getPermissions();
    const allowed = (perms[permKey] || 'admin').split(',').map((r) => r.trim());

    if (allowed.includes('all')) return true;
    if (!user) return false;

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';
    const isRecruiter = user.userType === 'recruiter' || user.userType === 'company';
    const isAuthor = authorId ? user.id === authorId : false;

    if (allowed.includes('admin') && isAdmin) return true;
    if (allowed.includes('recruiter') && isRecruiter) return true;
    if (allowed.includes('author') && isAuthor) return true;
    if (allowed.includes('user') && user.id) return true;

    return false;
  }
}
