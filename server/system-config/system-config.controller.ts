import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { ForbiddenException } from '@nestjs/common';
import { Public } from '../auth/auth.guard';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('public')
  @Public()
  getPublic() {
    return this.service.getPublicConfig();
  }

  @Get('content/:key')
  @Public()
  async getContent(@Req() req: any, @Body() body: any) {
    const key = (req.params as any).key;
    const val = await this.service.get(`content_${key}`);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  }

  @Patch('content/:key')
  async setContent(@Req() req: any, @Body() body: any) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException();
    const key = (req.params as any).key;
    const value = typeof body === 'string' ? body : JSON.stringify(body);
    await this.service.set(`content_${key}`, value);
    return { success: true };
  }

  @Get('permissions')
  @Public()
  getPermissions() {
    return this.service.getPermissions();
  }

  @Patch('permissions')
  setPermissions(@Req() req: any, @Body() body: Record<string, string>) {
    if (req.user?.role !== 'admin' && req.user?.role !== 'superadmin') throw new ForbiddenException();
    return this.service.setPermissions(body);
  }

  @Get()
  getAll(@Req() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.getAll();
  }

  @Patch()
  setMany(@Req() req: any, @Body() body: { configs: { key: string; value: string }[] }) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.setMany(body.configs);
  }
}
