"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _throttler = require("@nestjs/throttler");
const _customthrottlerguard = require("./common/guards/custom-throttler.guard");
const _core = require("@nestjs/core");
const _sanitizemiddleware = require("./common/middleware/sanitize.middleware");
const _requestidmiddleware = require("./common/middleware/request-id.middleware");
const _prismamodule = require("./prisma/prisma.module");
const _authmodule = require("./auth/auth.module");
const _authguard = require("./auth/auth.guard");
const _resumesmodule = require("./resumes/resumes.module");
const _llmmodule = require("./llm/llm.module");
const _templatesmodule = require("./templates/templates.module");
const _versionsmodule = require("./versions/versions.module");
const _tagsmodule = require("./tags/tags.module");
const _sharemodule = require("./share/share.module");
const _attachmentsmodule = require("./attachments/attachments.module");
const _healthmodule = require("./health/health.module");
const _applicationsmodule = require("./applications/applications.module");
const _commentsmodule = require("./comments/comments.module");
const _notificationsmodule = require("./notifications/notifications.module");
const _socialmodule = require("./social/social.module");
const _coverlettersmodule = require("./cover-letters/cover-letters.module");
const _jobsmodule = require("./jobs/jobs.module");
const _bannersmodule = require("./banners/banners.module");
const _noticesmodule = require("./notices/notices.module");
const _systemconfigmodule = require("./system-config/system-config.module");
const _communitymodule = require("./community/community.module");
const _forbiddenwordsmodule = require("./forbidden-words/forbidden-words.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(_requestidmiddleware.RequestIdMiddleware, _sanitizemiddleware.SanitizeMiddleware).forRoutes('*');
    }
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true
            }),
            _throttler.ThrottlerModule.forRoot([
                {
                    name: 'short',
                    ttl: 1000,
                    limit: 120
                },
                {
                    name: 'medium',
                    ttl: 60000,
                    limit: 1200
                },
                {
                    name: 'long',
                    ttl: 3600000,
                    limit: 10000
                }
            ]),
            _authmodule.AuthModule,
            _prismamodule.PrismaModule,
            _healthmodule.HealthModule,
            _resumesmodule.ResumesModule,
            _llmmodule.LlmModule,
            _templatesmodule.TemplatesModule,
            _versionsmodule.VersionsModule,
            _tagsmodule.TagsModule,
            _sharemodule.ShareModule,
            _attachmentsmodule.AttachmentsModule,
            _applicationsmodule.ApplicationsModule,
            _commentsmodule.CommentsModule,
            _notificationsmodule.NotificationsModule,
            _socialmodule.SocialModule,
            _coverlettersmodule.CoverLettersModule,
            _jobsmodule.JobsModule,
            _bannersmodule.BannersModule,
            _noticesmodule.NoticesModule,
            _systemconfigmodule.SystemConfigModule,
            _communitymodule.CommunityModule,
            _forbiddenwordsmodule.ForbiddenWordsModule
        ],
        providers: [
            {
                provide: _core.APP_GUARD,
                useClass: _customthrottlerguard.CustomThrottlerGuard
            },
            {
                provide: _core.APP_GUARD,
                useClass: _authguard.AuthGuard
            }
        ]
    })
], AppModule);
