import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    AuthModule,
    PrismaModule,
    ResumesModule,
    LlmModule,
    TemplatesModule,
    VersionsModule,
    TagsModule,
    ShareModule,
    AttachmentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
