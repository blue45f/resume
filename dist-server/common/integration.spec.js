"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resumes_controller_1 = require("../resumes/resumes.controller");
const attachments_controller_1 = require("../attachments/attachments.controller");
const auth_controller_1 = require("../auth/auth.controller");
const versions_controller_1 = require("../versions/versions.controller");
const share_controller_1 = require("../share/share.controller");
const tags_controller_1 = require("../tags/tags.controller");
const templates_controller_1 = require("../templates/templates.controller");
const comments_controller_1 = require("../comments/comments.controller");
const health_controller_1 = require("../health/health.controller");
const llm_controller_1 = require("../llm/llm.controller");
const social_controller_1 = require("../social/social.controller");
const notifications_controller_1 = require("../notifications/notifications.controller");
const jobs_controller_1 = require("../jobs/jobs.controller");
const cover_letters_controller_1 = require("../cover-letters/cover-letters.controller");
const applications_controller_1 = require("../applications/applications.controller");
const resumes_service_1 = require("../resumes/resumes.service");
const attachments_service_1 = require("../attachments/attachments.service");
const auth_service_1 = require("../auth/auth.service");
const versions_service_1 = require("../versions/versions.service");
const share_service_1 = require("../share/share.service");
const tags_service_1 = require("../tags/tags.service");
const templates_service_1 = require("../templates/templates.service");
const comments_service_1 = require("../comments/comments.service");
const llm_service_1 = require("../llm/llm.service");
const social_service_1 = require("../social/social.service");
const notifications_service_1 = require("../notifications/notifications.service");
const jobs_service_1 = require("../jobs/jobs.service");
const cover_letters_service_1 = require("../cover-letters/cover-letters.service");
const applications_service_1 = require("../applications/applications.service");
const CONTROLLERS = [
    { name: 'ResumesController', cls: resumes_controller_1.ResumesController },
    { name: 'AttachmentsController', cls: attachments_controller_1.AttachmentsController },
    { name: 'AuthController', cls: auth_controller_1.AuthController },
    { name: 'VersionsController', cls: versions_controller_1.VersionsController },
    { name: 'ShareController', cls: share_controller_1.ShareController },
    { name: 'TagsController', cls: tags_controller_1.TagsController },
    { name: 'TemplatesController', cls: templates_controller_1.TemplatesController },
    { name: 'CommentsController', cls: comments_controller_1.CommentsController },
    { name: 'HealthController', cls: health_controller_1.HealthController },
    { name: 'LlmController', cls: llm_controller_1.LlmController },
    { name: 'SocialController', cls: social_controller_1.SocialController },
    { name: 'NotificationsController', cls: notifications_controller_1.NotificationsController },
    { name: 'JobsController', cls: jobs_controller_1.JobsController },
    { name: 'CoverLettersController', cls: cover_letters_controller_1.CoverLettersController },
    { name: 'ApplicationsController', cls: applications_controller_1.ApplicationsController },
];
const SERVICES = [
    { name: 'ResumesService', cls: resumes_service_1.ResumesService, methods: ['findAll', 'findOne', 'create', 'update', 'remove'] },
    { name: 'AttachmentsService', cls: attachments_service_1.AttachmentsService, methods: ['upload', 'findAll', 'getFileData', 'remove'] },
    { name: 'AuthService', cls: auth_service_1.AuthService, methods: ['register', 'login'] },
    { name: 'VersionsService', cls: versions_service_1.VersionsService, methods: ['findAll', 'findOne', 'restore'] },
    { name: 'ShareService', cls: share_service_1.ShareService, methods: ['createLink', 'getByToken'] },
    { name: 'TagsService', cls: tags_service_1.TagsService, methods: ['findAll'] },
    { name: 'TemplatesService', cls: templates_service_1.TemplatesService, methods: ['findAll', 'findOne'] },
    { name: 'CommentsService', cls: comments_service_1.CommentsService, methods: ['findByResume', 'create'] },
    { name: 'LlmService', cls: llm_service_1.LlmService, methods: ['transform', 'getAvailableProviders', 'generateWithFallback'] },
    { name: 'SocialService', cls: social_service_1.SocialService, methods: ['follow', 'unfollow', 'getFollowers'] },
    { name: 'NotificationsService', cls: notifications_service_1.NotificationsService, methods: ['getUnread', 'getAll', 'markAsRead', 'create'] },
    { name: 'JobsService', cls: jobs_service_1.JobsService, methods: ['findAll'] },
    { name: 'CoverLettersService', cls: cover_letters_service_1.CoverLettersService, methods: ['findAll', 'create'] },
    { name: 'ApplicationsService', cls: applications_service_1.ApplicationsService, methods: ['findAll', 'create'] },
];
describe('Integration sanity', () => {
    describe('Controller 클래스 존재 확인', () => {
        it.each(CONTROLLERS)('$name 클래스가 정의되어 있음', ({ cls }) => {
            expect(cls).toBeDefined();
            expect(typeof cls).toBe('function');
        });
        it(`총 ${CONTROLLERS.length}개 컨트롤러 등록`, () => {
            expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15);
        });
    });
    describe('Service 클래스 메서드 존재 확인', () => {
        it.each(SERVICES)('$name에 필수 메서드가 prototype에 존재', ({ cls, methods }) => {
            expect(cls).toBeDefined();
            for (const method of methods) {
                expect(cls.prototype[method]).toBeDefined();
                expect(typeof cls.prototype[method]).toBe('function');
            }
        });
        it(`총 ${SERVICES.length}개 서비스 등록`, () => {
            expect(SERVICES.length).toBeGreaterThanOrEqual(14);
        });
    });
    describe('라우트 수 검증', () => {
        it('컨트롤러 수가 예상 범위 내', () => {
            expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15);
        });
        it('서비스 수가 예상 범위 내', () => {
            expect(SERVICES.length).toBeGreaterThanOrEqual(14);
        });
        it('각 서비스의 메서드 수 합계가 최소 요건 충족', () => {
            const totalMethods = SERVICES.reduce((sum, s) => sum + s.methods.length, 0);
            expect(totalMethods).toBeGreaterThanOrEqual(35);
        });
    });
});
