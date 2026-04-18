import { Module } from '@nestjs/common';
import { StudyGroupsController } from './study-groups.controller';
import { StudyGroupsService } from './study-groups.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudyGroupsController],
  providers: [StudyGroupsService],
  exports: [StudyGroupsService],
})
export class StudyGroupsModule {}
