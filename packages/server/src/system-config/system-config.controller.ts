import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { Public } from '../auth/auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('public')
  @Public()
  getPublic() {
    return this.service.getPublicConfig();
  }

  @Get('upload-settings')
  @Public()
  getUploadSettings() {
    return this.service.getUploadSettings();
  }

  @Get('feature-toggles')
  @Public()
  getFeatureToggles() {
    return this.service.getAllFeatureToggles();
  }

  @Patch('feature-toggles')
  @UseGuards(AdminGuard)
  setFeatureToggles(@Body() body: Record<string, boolean>) {
    return this.service.setFeatureToggles(body);
  }

  @Get('content/:key')
  @Public()
  async getContent(@Req() req: any, @Body() body: any) {
    const key = (req.params as any).key;
    const val = await this.service.get(`content_${key}`);
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }

  @Patch('content/:key')
  @UseGuards(AdminGuard)
  async setContent(@Req() req: any, @Body() body: any) {
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
  @UseGuards(AdminGuard)
  setPermissions(@Body() body: Record<string, string>) {
    return this.service.setPermissions(body);
  }

  @Get()
  @UseGuards(AdminGuard)
  getAll() {
    return this.service.getAll();
  }

  @Patch()
  @UseGuards(AdminGuard)
  setMany(@Body() body: { configs: { key: string; value: string }[] }) {
    return this.service.setMany(body.configs);
  }
}
