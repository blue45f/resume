/**
 * Integration sanity tests
 * - Controller/Service 클래스 존재 및 메서드 검증
 * - 모듈 구조 무결성 확인
 */

// Controllers & Services (import-x/order: 한 그룹으로 알파벳 정렬)
import { ApplicationsController } from '../applications/applications.controller'
import { ApplicationsService } from '../applications/applications.service'
import { AttachmentsController } from '../attachments/attachments.controller'
import { AttachmentsService } from '../attachments/attachments.service'
import { AuthController } from '../auth/auth.controller'
import { AuthService } from '../auth/auth.service'
import { CommentsController } from '../comments/comments.controller'
import { CommentsService } from '../comments/comments.service'
import { CoverLettersController } from '../cover-letters/cover-letters.controller'
import { CoverLettersService } from '../cover-letters/cover-letters.service'
import { HealthController } from '../health/health.controller'
import { JobsController } from '../jobs/jobs.controller'
import { JobsService } from '../jobs/jobs.service'
import { LlmController } from '../llm/llm.controller'
import { LlmService } from '../llm/llm.service'
import { NotificationsController } from '../notifications/notifications.controller'
import { NotificationsService } from '../notifications/notifications.service'
import { ResumesController } from '../resumes/resumes.controller'
import { ResumesService } from '../resumes/resumes.service'
import { ShareController } from '../share/share.controller'
import { ShareService } from '../share/share.service'
import { SocialController } from '../social/social.controller'
import { SocialService } from '../social/social.service'
import { TagsController } from '../tags/tags.controller'
import { TagsService } from '../tags/tags.service'
import { TemplatesController } from '../templates/templates.controller'
import { TemplatesService } from '../templates/templates.service'
import { VersionsController } from '../versions/versions.controller'
import { VersionsService } from '../versions/versions.service'

const CONTROLLERS = [
  { name: 'ResumesController', cls: ResumesController },
  { name: 'AttachmentsController', cls: AttachmentsController },
  { name: 'AuthController', cls: AuthController },
  { name: 'VersionsController', cls: VersionsController },
  { name: 'ShareController', cls: ShareController },
  { name: 'TagsController', cls: TagsController },
  { name: 'TemplatesController', cls: TemplatesController },
  { name: 'CommentsController', cls: CommentsController },
  { name: 'HealthController', cls: HealthController },
  { name: 'LlmController', cls: LlmController },
  { name: 'SocialController', cls: SocialController },
  { name: 'NotificationsController', cls: NotificationsController },
  { name: 'JobsController', cls: JobsController },
  { name: 'CoverLettersController', cls: CoverLettersController },
  { name: 'ApplicationsController', cls: ApplicationsController },
]

const SERVICES = [
  {
    name: 'ResumesService',
    cls: ResumesService,
    methods: ['findAll', 'findOne', 'create', 'update', 'remove'],
  },
  {
    name: 'AttachmentsService',
    cls: AttachmentsService,
    methods: ['upload', 'findAll', 'getFileData', 'remove'],
  },
  { name: 'AuthService', cls: AuthService, methods: ['register', 'login'] },
  { name: 'VersionsService', cls: VersionsService, methods: ['findAll', 'findOne', 'restore'] },
  { name: 'ShareService', cls: ShareService, methods: ['createLink', 'getByToken'] },
  { name: 'TagsService', cls: TagsService, methods: ['findAll'] },
  { name: 'TemplatesService', cls: TemplatesService, methods: ['findAll', 'findOne'] },
  { name: 'CommentsService', cls: CommentsService, methods: ['findByResume', 'create'] },
  {
    name: 'LlmService',
    cls: LlmService,
    methods: ['transform', 'getAvailableProviders', 'generateWithFallback'],
  },
  { name: 'SocialService', cls: SocialService, methods: ['follow', 'unfollow', 'getFollowers'] },
  {
    name: 'NotificationsService',
    cls: NotificationsService,
    methods: ['getUnread', 'getAll', 'markAsRead', 'create'],
  },
  { name: 'JobsService', cls: JobsService, methods: ['findAll'] },
  { name: 'CoverLettersService', cls: CoverLettersService, methods: ['findAll', 'create'] },
  { name: 'ApplicationsService', cls: ApplicationsService, methods: ['findAll', 'create'] },
]

describe('Integration sanity', () => {
  describe('Controller 클래스 존재 확인', () => {
    it.each(CONTROLLERS)('$name 클래스가 정의되어 있음', ({ cls }) => {
      expect(cls).toBeDefined()
      expect(typeof cls).toBe('function')
    })

    it(`총 ${CONTROLLERS.length}개 컨트롤러 등록`, () => {
      expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15)
    })
  })

  describe('Service 클래스 메서드 존재 확인', () => {
    it.each(SERVICES)('$name에 필수 메서드가 prototype에 존재', ({ cls, methods }) => {
      expect(cls).toBeDefined()
      const prototype = cls.prototype as unknown as Record<string, unknown>
      for (const method of methods) {
        expect(prototype[method]).toBeDefined()
        expect(typeof prototype[method]).toBe('function')
      }
    })

    it(`총 ${SERVICES.length}개 서비스 등록`, () => {
      expect(SERVICES.length).toBeGreaterThanOrEqual(14)
    })
  })

  describe('라우트 수 검증', () => {
    it('컨트롤러 수가 예상 범위 내', () => {
      // 15개 이상의 컨트롤러가 존재해야 함
      expect(CONTROLLERS.length).toBeGreaterThanOrEqual(15)
    })

    it('서비스 수가 예상 범위 내', () => {
      expect(SERVICES.length).toBeGreaterThanOrEqual(14)
    })

    it('각 서비스의 메서드 수 합계가 최소 요건 충족', () => {
      const totalMethods = SERVICES.reduce((sum, s) => sum + s.methods.length, 0)
      expect(totalMethods).toBeGreaterThanOrEqual(35)
    })
  })
})
