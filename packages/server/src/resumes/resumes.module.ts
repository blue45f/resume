import { Module, forwardRef } from '@nestjs/common';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { ExportService } from './export.service';
import { AnalyticsService } from './analytics.service';
import { ResumeViewerCleanupService } from './resume-viewer-cleanup.service';
import { AiCoachingNudgeService } from './ai-coaching-nudge.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [NotificationsModule, forwardRef(() => LlmModule)],
  controllers: [ResumesController],
  providers: [
    ResumesService,
    ExportService,
    AnalyticsService,
    ResumeViewerCleanupService,
    AiCoachingNudgeService,
  ],
  exports: [ResumesService],
})
export class ResumesModule {}
