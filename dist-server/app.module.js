"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const sanitize_middleware_1 = require("./common/middleware/sanitize.middleware");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const auth_guard_1 = require("./auth/auth.guard");
const resumes_module_1 = require("./resumes/resumes.module");
const llm_module_1 = require("./llm/llm.module");
const templates_module_1 = require("./templates/templates.module");
const versions_module_1 = require("./versions/versions.module");
const tags_module_1 = require("./tags/tags.module");
const share_module_1 = require("./share/share.module");
const attachments_module_1 = require("./attachments/attachments.module");
const health_module_1 = require("./health/health.module");
const applications_module_1 = require("./applications/applications.module");
const comments_module_1 = require("./comments/comments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const social_module_1 = require("./social/social.module");
const cover_letters_module_1 = require("./cover-letters/cover-letters.module");
const jobs_module_1 = require("./jobs/jobs.module");
const banners_module_1 = require("./banners/banners.module");
const notices_module_1 = require("./notices/notices.module");
const system_config_module_1 = require("./system-config/system-config.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware, sanitize_middleware_1.SanitizeMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 30 },
                { name: 'medium', ttl: 60000, limit: 300 },
                { name: 'long', ttl: 3600000, limit: 3000 },
            ]),
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            health_module_1.HealthModule,
            resumes_module_1.ResumesModule,
            llm_module_1.LlmModule,
            templates_module_1.TemplatesModule,
            versions_module_1.VersionsModule,
            tags_module_1.TagsModule,
            share_module_1.ShareModule,
            attachments_module_1.AttachmentsModule,
            applications_module_1.ApplicationsModule,
            comments_module_1.CommentsModule,
            notifications_module_1.NotificationsModule,
            social_module_1.SocialModule,
            cover_letters_module_1.CoverLettersModule,
            jobs_module_1.JobsModule,
            banners_module_1.BannersModule,
            notices_module_1.NoticesModule,
            system_config_module_1.SystemConfigModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: auth_guard_1.AuthGuard },
        ],
    })
], AppModule);
