import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { MulterModule } from '@nestjs/platform-express'
import * as multer from 'multer'

import { ForbiddenWordsModule } from '../forbidden-words/forbidden-words.module'
import { PrismaModule } from '../prisma/prisma.module'

import { StudyGroupsAdminController } from './study-groups-admin.controller'
import { StudyGroupsController } from './study-groups.controller'
import { StudyGroupsService } from './study-groups.service'

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
