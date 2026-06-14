import { Test, TestingModule } from '@nestjs/testing'

import { StudyGroupsAdminController } from './study-groups-admin.controller'
import { StudyGroupsService } from './study-groups.service'

const mockService = {
  adminList: jest.fn(),
  adminForceClose: jest.fn(),
  adminUpdate: jest.fn(),
  adminDelete: jest.fn(),
  adminListPosts: jest.fn(),
  adminDeletePost: jest.fn(),
  adminRemovePostAttachment: jest.fn(),
  adminListPostComments: jest.fn(),
  adminDeleteComment: jest.fn(),
  adminListAnswers: jest.fn(),
  adminDeleteAnswer: jest.fn(),
}

describe('StudyGroupsAdminController', () => {
  let controller: StudyGroupsAdminController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyGroupsAdminController],
      providers: [{ provide: StudyGroupsService, useValue: mockService }],
    }).compile()
    controller = module.get(StudyGroupsAdminController)
    jest.clearAllMocks()
  })

  describe('list', () => {
    it('기본값 page=1, limit=20', () => {
      controller.list()
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: undefined,
        tier: undefined,
        cafe: undefined,
        experienceLevel: undefined,
        page: 1,
        limit: 20,
      })
    })

    it('필터 + 페이지네이션 파라미터 전달', () => {
      controller.list('네이버', 'large', 'interview', 'mid', '2', '30')
      expect(mockService.adminList).toHaveBeenCalledWith({
        q: '네이버',
        tier: 'large',
        cafe: 'interview',
        experienceLevel: 'mid',
        page: 2,
        limit: 30,
      })
    })
  })

  it('forceClose: id 그대로 위임', () => {
    controller.forceClose('g1')
    expect(mockService.adminForceClose).toHaveBeenCalledWith('g1')
  })

  it('update: body 그대로 전달', () => {
    controller.update('g1', { name: '새 이름', isPrivate: true })
    expect(mockService.adminUpdate).toHaveBeenCalledWith('g1', {
      name: '새 이름',
      isPrivate: true,
    })
  })

  it('remove: 삭제 위임', () => {
    controller.remove('g1')
    expect(mockService.adminDelete).toHaveBeenCalledWith('g1')
  })

  describe('게시글/댓글/답변 모더레이션', () => {
    it('listPosts: 기본 page=1, limit=20 + 필터 전달', () => {
      controller.listPosts()
      expect(mockService.adminListPosts).toHaveBeenCalledWith({
        q: undefined,
        groupId: undefined,
        page: 1,
        limit: 20,
      })
      controller.listPosts('욕설', 'g1', '3', '10')
      expect(mockService.adminListPosts).toHaveBeenCalledWith({
        q: '욕설',
        groupId: 'g1',
        page: 3,
        limit: 10,
      })
    })

    it('removePost / removeComment / removeAnswer: id 위임', () => {
      controller.removePost('p1')
      expect(mockService.adminDeletePost).toHaveBeenCalledWith('p1')
      controller.removeComment('c1')
      expect(mockService.adminDeleteComment).toHaveBeenCalledWith('c1')
      controller.removeAnswer('a1')
      expect(mockService.adminDeleteAnswer).toHaveBeenCalledWith('a1')
    })

    it('removePostAttachment: url body 전달', () => {
      controller.removePostAttachment('p1', { url: 'https://res.cloudinary.com/x.png' })
      expect(mockService.adminRemovePostAttachment).toHaveBeenCalledWith(
        'p1',
        'https://res.cloudinary.com/x.png'
      )
    })

    it('listPostComments: postId 위임', () => {
      controller.listPostComments('p1')
      expect(mockService.adminListPostComments).toHaveBeenCalledWith('p1')
    })

    it('listAnswers: 기본 페이지네이션 + 필터 전달', () => {
      controller.listAnswers()
      expect(mockService.adminListAnswers).toHaveBeenCalledWith({
        q: undefined,
        groupId: undefined,
        page: 1,
        limit: 20,
      })
      controller.listAnswers('검색', 'g1', '2', '50')
      expect(mockService.adminListAnswers).toHaveBeenCalledWith({
        q: '검색',
        groupId: 'g1',
        page: 2,
        limit: 50,
      })
    })
  })
})
