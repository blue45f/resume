import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'

import { ApplicationsModule } from './applications/applications.module'
import { AttachmentsModule } from './attachments/attachments.module'
import { AuthGuard } from './auth/auth.guard'
import { AuthModule } from './auth/auth.module'
import { BannersModule } from './banners/banners.module'
import { BillingModule } from './billing/billing.module'
import { CoachingModule } from './coaching/coaching.module'
import { CoffeeChatModule } from './coffee-chat/coffee-chat.module'
import { CommentsModule } from './comments/comments.module'
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard'
import { RequestIdMiddleware } from './common/middleware/request-id.middleware'
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware'
import { CommunityModule } from './community/community.module'
import { CoverLettersModule } from './cover-letters/cover-letters.module'
import { ForbiddenWordsModule } from './forbidden-words/forbidden-words.module'
import { HealthModule } from './health/health.module'
import { InterviewModule } from './interview/interview.module'
import { JobInterviewQuestionsModule } from './job-interview-questions/job-interview-questions.module'
import { JobsModule } from './jobs/jobs.module'
import { LlmModule } from './llm/llm.module'
import { NoticesModule } from './notices/notices.module'
import { NotificationsModule } from './notifications/notifications.module'
import { PrismaModule } from './prisma/prisma.module'
import { ResumesModule } from './resumes/resumes.module'
import { ShareModule } from './share/share.module'
import { SocialModule } from './social/social.module'
import { StudyGroupsModule } from './study-groups/study-groups.module'
import { SystemConfigModule } from './system-config/system-config.module'
import { TagsModule } from './tags/tags.module'
import { TemplatesModule } from './templates/templates.module'
import { VersionsModule } from './versions/versions.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 120 },
      { name: 'medium', ttl: 60000, limit: 1200 },
      { name: 'long', ttl: 3600000, limit: 10000 },
    ]),
    AuthModule,
    PrismaModule,
    HealthModule,
    ResumesModule,
    LlmModule,
    TemplatesModule,
    VersionsModule,
    TagsModule,
    ShareModule,
    AttachmentsModule,
    ApplicationsModule,
    CommentsModule,
    NotificationsModule,
    SocialModule,
    CoverLettersModule,
    JobsModule,
    BannersModule,
    NoticesModule,
    SystemConfigModule,
    CommunityModule,
    ForbiddenWordsModule,
    InterviewModule,
    StudyGroupsModule,
    JobInterviewQuestionsModule,
    CoachingModule,
    CoffeeChatModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, SanitizeMiddleware).forRoutes('*')
  }
}
