import { Controller, Get, Patch, Body, Req } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { ForbiddenException } from '@nestjs/common';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  // 공개 설정 (누구나 조회 가능 - 사이트명, 점검모드 등)
  @Get('public')
  getPublic() {
    return this.service.getPublicConfig();
  }

  // 어드민 전체 설정 조회
  @Get()
  getAll(@Req() req: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.getAll();
  }

  // 어드민 설정 일괄 업데이트
  @Patch()
  setMany(@Req() req: any, @Body() body: { configs: { key: string; value: string }[] }) {
    if (req.user?.role !== 'admin') throw new ForbiddenException();
    return this.service.setMany(body.configs);
  }
}
