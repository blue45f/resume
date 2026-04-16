import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ConfigModule,
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
