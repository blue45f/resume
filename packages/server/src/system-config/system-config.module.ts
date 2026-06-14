import { Module, Global } from '@nestjs/common'

import { PrismaModule } from '../prisma/prisma.module'

import { SystemConfigController } from './system-config.controller'
import { SystemConfigService } from './system-config.service'

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
