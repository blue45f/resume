import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { APP_GUARD } from '@nestjs/core';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { ResumesModule } from './resumes/resumes.module';
import { LlmModule } from './llm/llm.module';
import { TemplatesModule } from './templates/templates.module';
import { VersionsModule } from './versions/versions.module';
import { TagsModule } from './tags/tags.module';
import { ShareModule } from './share/share.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { HealthModule } from './health/health.module';
import { ApplicationsModule } from './applications/applications.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SocialModule } from './social/social.module';
import { CoverLettersModule } from './cover-letters/cover-letters.module';
import { JobsModule } from './jobs/jobs.module';
import { BannersModule } from './banners/banners.module';
import { NoticesModule } from './notices/notices.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { CommunityModule } from './community/community.module';
import { ForbiddenWordsModule } from './forbidden-words/forbidden-words.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, SanitizeMiddleware).forRoutes('*');
  }
}
