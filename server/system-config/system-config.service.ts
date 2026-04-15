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
    return Promise.all(configs.map(c => this.set(c.key, c.value)));
  }

  async getPublicConfig() {
    const keys = ['site_name', 'site_description', 'monetization_enabled', 'maintenance_mode', 'allow_signup'];
    const configs = await this.prisma.systemConfig.findMany({ where: { key: { in: keys } } });
    return Object.fromEntries(configs.map(c => [c.key, c.value]));
  }
}
