import { Module } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ExportService } from './export.service';
import { AnalyticsService } from './analytics.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ResumesController],
  providers: [ResumesService, ExportService, AnalyticsService],
  exports: [ResumesService],
})
export class ResumesModule {}
