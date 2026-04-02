import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
      { name: 'long', ttl: 3600000, limit: 1000 },
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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, SanitizeMiddleware).forRoutes('*');
  }
}
