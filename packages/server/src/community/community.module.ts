import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import * as multer from 'multer'

import { NotificationsModule } from '../notifications/notifications.module'
import { PrismaModule } from '../prisma/prisma.module'

import { CommunityAdminController } from './community-admin.controller'
import { CommunityController } from './community.controller'
import { CommunityService } from './community.service'

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ConfigModule,
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [CommunityAdminController, CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
