import { Module } from '@nestjs/common';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupsAdminController } from './study-groups-admin.controller';
import { StudyGroupsService } from './study-groups.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudyGroupsAdminController, StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}
