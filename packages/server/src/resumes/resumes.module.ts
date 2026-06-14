import { Module, forwardRef } from '@nestjs/common'

import { LlmModule } from '../llm/llm.module'
import { NotificationsModule } from '../notifications/notifications.module'

import { AiCoachingNudgeService } from './ai-coaching-nudge.service'
import { AnalyticsService } from './analytics.service'
import { ExportService } from './export.service'
import { ResumeViewerCleanupService } from './resume-viewer-cleanup.service'
import { ResumesController } from './resumes.controller'
import { ResumesService } from './resumes.service'

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
