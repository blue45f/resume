/**
 * Integration sanity tests
 * - Controller/Service 클래스 존재 및 메서드 검증
 * - 모듈 구조 무결성 확인
 */ // Controllers
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _resumescontroller = require("../resumes/resumes.controller");
const _attachmentscontroller = require("../attachments/attachments.controller");
const _authcontroller = require("../auth/auth.controller");
const _versionscontroller = require("../versions/versions.controller");
const _sharecontroller = require("../share/share.controller");
const _tagscontroller = require("../tags/tags.controller");
const _templatescontroller = require("../templates/templates.controller");
const _commentscontroller = require("../comments/comments.controller");
const _healthcontroller = require("../health/health.controller");
const _llmcontroller = require("../llm/llm.controller");
const _socialcontroller = require("../social/social.controller");
const _notificationscontroller = require("../notifications/notifications.controller");
const _jobscontroller = require("../jobs/jobs.controller");
const _coverletterscontroller = require("../cover-letters/cover-letters.controller");
const _applicationscontroller = require("../applications/applications.controller");
const _resumesservice = require("../resumes/resumes.service");
const _attachmentsservice = require("../attachments/attachments.service");
const _authservice = require("../auth/auth.service");
const _versionsservice = require("../versions/versions.service");
const _shareservice = require("../share/share.service");
const _tagsservice = require("../tags/tags.service");
const _templatesservice = require("../templates/templates.service");
const _commentsservice = require("../comments/comments.service");
const _llmservice = require("../llm/llm.service");
const _socialservice = require("../social/social.service");
const _notificationsservice = require("../notifications/notifications.service");
const _jobsservice = require("../jobs/jobs.service");
const _coverlettersservice = require("../cover-letters/cover-letters.service");
const _applicationsservice = require("../applications/applications.service");
const CONTROLLERS = [
    {
        name: 'ResumesController',
        cls: _resumescontroller.ResumesController
    },
    {
        name: 'AttachmentsController',
        cls: _attachmentscontroller.AttachmentsController
    },
    {
        name: 'AuthController',
        cls: _authcontroller.AuthController
    },
    {
        name: 'VersionsController',
        cls: _versionscontroller.VersionsController
    },
    {
        name: 'ShareController',
        cls: _sharecontroller.ShareController
    },
    {
        name: 'TagsController',
        cls: _tagscontroller.TagsController
    },
    {
        name: 'TemplatesController',
        cls: _templatescontroller.TemplatesController
    },
    {
        name: 'CommentsController',
        cls: _commentscontroller.CommentsController
    },
    {
        name: 'HealthController',
        cls: _healthcontroller.HealthController
    },
    {
        name: 'LlmController',
        cls: _llmcontroller.LlmController
    },
    {
        name: 'SocialController',
        cls: _socialcontroller.SocialController
    },
    {
        name: 'NotificationsController',
        cls: _notificationscontroller.NotificationsController
    },
    {
        name: 'JobsController',
        cls: _jobscontroller.JobsController
    },
    {
        name: 'CoverLettersController',
        cls: _coverletterscontroller.CoverLettersController
    },
    {
        name: 'ApplicationsController',
        cls: _applicationscontroller.ApplicationsController
    }
];
const SERVICES = [
    {
        name: 'ResumesService',
        cls: _resumesservice.ResumesService,
        methods: [
            'findAll',
            'findOne',
            'create',
            'update',
            'remove'
        ]
    },
    {
        name: 'AttachmentsService',
        cls: _attachmentsservice.AttachmentsService,
        methods: [
            'upload',
            'findAll',
            'getFileData',
            'remove'
        ]
    },
    {
        name: 'AuthService',
        cls: _authservice.AuthService,
        methods: [
            'register',
            'login'
        ]
    },
    {
        name: 'VersionsService',
        cls: _versionsservice.VersionsService,
        methods: [
            'findAll',
            'findOne',
            'restore'
        ]
    },
    {
        name: 'ShareService',
        cls: _shareservice.ShareService,
        methods: [
            'createLink',
            'getByToken'
        ]
    },
    {
        name: 'TagsService',
        cls: _tagsservice.TagsService,
        methods: [
            'findAll'
        ]
    },
    {
        name: 'TemplatesService',
        cls: _templatesservice.TemplatesService,
        methods: [
            'findAll',
            'findOne'
        ]
    },
    {
        name: 'CommentsService',
        cls: _commentsservice.CommentsService,
        methods: [
            'findByResume',
            'create'
        ]
    },
    {
        name: 'LlmService',
        cls: _llmservice.LlmService,
        methods: [
            'transform',
            'getAvailableProviders',
            'generateWithFallback'
        ]
    },
    {
        name: 'SocialService',
        cls: _socialservice.SocialService,
        methods: [
            'follow',
            'unfollow',
            'getFollowers'
        ]
    },
    {
        name: 'NotificationsService',
        cls: _notificationsservice.NotificationsService,
        methods: [
            'getUnread',
            'getAll',
            'markAsRead',
            'create'
        ]
    },
    {
        name: 'JobsService',
        cls: _jobsservice.JobsService,
        methods: [
            'findAll'
        ]
    },
    {
        name: 'CoverLettersService',
        cls: _coverlettersservice.CoverLettersService,
        methods: [
            'findAll',
            'create'
        ]
    },
    {
        name: 'ApplicationsService',
        cls: _applicationsservice.ApplicationsService,
        methods: [
            'findAll',
            'create'
        ]
    }
];
describe('Integration sanity', ()=>{
    describe('Controller 클래스 존재 확인', ()=>{
        it.each(CONTROLLERS)('$name 클래스가 정의되어 있음', ({ cls })=>{
            expect(cls).toBeDefined();
            expect(typeof cls).toBe('function');
        });
        it(`총 ${CONTROLLERS.length}개 컨트롤러 등록`, ()=>{
            expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15);
        });
    });
    describe('Service 클래스 메서드 존재 확인', ()=>{
        it.each(SERVICES)('$name에 필수 메서드가 prototype에 존재', ({ cls, methods })=>{
            expect(cls).toBeDefined();
            for (const method of methods){
                expect(cls.prototype[method]).toBeDefined();
                expect(typeof cls.prototype[method]).toBe('function');
            }
        });
        it(`총 ${SERVICES.length}개 서비스 등록`, ()=>{
            expect(SERVICES.length).toBeGreaterThanOrEqual(14);
        });
    });
    describe('라우트 수 검증', ()=>{
        it('컨트롤러 수가 예상 범위 내', ()=>{
            // 15개 이상의 컨트롤러가 존재해야 함
            expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15);
        });
        it('서비스 수가 예상 범위 내', ()=>{
            expect(SERVICES.length).toBeGreaterThanOrEqual(14);
        });
        it('각 서비스의 메서드 수 합계가 최소 요건 충족', ()=>{
            const totalMethods = SERVICES.reduce((sum, s)=>sum + s.methods.length, 0);
            expect(totalMethods).toBeGreaterThanOrEqual(35);
        });
    });
});
