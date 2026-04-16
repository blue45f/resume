import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { ForbiddenException } from '@nestjs/common';
import { Public } from '../auth/auth.guard';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get('public')
  getPublic() {
    return this.service.getPublicConfig();
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
