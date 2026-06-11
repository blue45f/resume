import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupsAdminController } from './study-groups-admin.controller';
import { StudyGroupsService } from './study-groups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ForbiddenWordsModule } from '../forbidden-words/forbidden-words.module';

@Module({
  imports: [
    PrismaModule,
    ForbiddenWordsModule,
    ConfigModule,
    // 첨부 업로드 — memoryStorage 로 buffer 확보 (community 모듈과 동일 패턴)
    MulterModule.register({ storage: multer.memoryStorage() }),
  ],
  controllers: [StudyGroupsAdminController, StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}
