"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _common = require("@nestjs/common");
const _resumescontroller = require("./resumes.controller");
const _resumesservice = require("./resumes.service");
const _exportservice = require("./export.service");
const _analyticsservice = require("./analytics.service");
const mockResumesService = {
    findAll: jest.fn(),
    findPublic: jest.fn(),
    searchPublic: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    setVisibility: jest.fn(),
    remove: jest.fn(),
    addBookmark: jest.fn(),
    removeBookmark: jest.fn(),
    isBookmarked: jest.fn(),
    getBookmarks: jest.fn(),
    duplicate: jest.fn(),
    transferOwnership: jest.fn(),
    incrementViewCount: jest.fn(),
    findBySlug: jest.fn(),
    updateSlug: jest.fn()
};
const mockExportService = {
    exportAsText: jest.fn(),
    exportAsMarkdown: jest.fn(),
    exportAsJson: jest.fn()
};
const mockAnalyticsService = {
    getUserDashboard: jest.fn(),
    getResumeTrend: jest.fn(),
    getPopularSkills: jest.fn(),
    getResumeAnalytics: jest.fn()
};
function mockResponse() {
    const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    };
    return res;
}
describe('ResumesController', ()=>{
    let controller;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            controllers: [
                _resumescontroller.ResumesController
            ],
            providers: [
                {
                    provide: _resumesservice.ResumesService,
                    useValue: mockResumesService
                },
                {
                    provide: _exportservice.ExportService,
                    useValue: mockExportService
                },
                {
                    provide: _analyticsservice.AnalyticsService,
                    useValue: mockAnalyticsService
                }
            ]
        }).compile();
        controller = module.get(_resumescontroller.ResumesController);
        jest.clearAllMocks();
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes — 내 이력서 목록
    // ──────────────────────────────────────────────────
    describe('findAll (GET /resumes)', ()=>{
        it('로그인 사용자 → 내 이력서 목록 반환', async ()=>{
            const mockData = {
                data: [
                    {
                        id: 'r1',
                        title: '이력서1'
                    }
                ],
                total: 1
            };
            mockResumesService.findAll.mockResolvedValue(mockData);
            const result = await controller.findAll({
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(mockData);
            expect(mockResumesService.findAll).toHaveBeenCalledWith('u1', 1, 20);
        });
        it('비로그인 → findPublic 호출 (공개 이력서만)', async ()=>{
            mockResumesService.findPublic.mockResolvedValue({
                data: [],
                total: 0
            });
            await controller.findAll({
                user: null
            });
            expect(mockResumesService.findPublic).toHaveBeenCalledWith(1, 20);
        });
        it('public=true → findPublic 호출 (공개 이력서 목록)', async ()=>{
            const mockData = {
                data: [
                    {
                        id: 'r2'
                    }
                ],
                total: 1
            };
            mockResumesService.findPublic.mockResolvedValue(mockData);
            // When isPublic query param is 'true', should not call findAll but call findPublic
            // Looking at controller: isPublic === 'true' calls searchPublic, but actually it calls findPublic
            // Actually looking at findAll: if isPublic === 'true' calls this.resumesService.findPublic
            const result = await controller.findAll({
                user: {
                    id: 'u1'
                }
            }, 'true');
            expect(result).toEqual(mockData);
            expect(mockResumesService.findPublic).toHaveBeenCalledWith(1, 20);
        });
        it('page, limit 파라미터 파싱', async ()=>{
            mockResumesService.findAll.mockResolvedValue({
                data: [],
                total: 0
            });
            await controller.findAll({
                user: {
                    id: 'u1'
                }
            }, undefined, '3', '10');
            expect(mockResumesService.findAll).toHaveBeenCalledWith('u1', 3, 10);
        });
        it('limit 최대 50 제한', async ()=>{
            mockResumesService.findAll.mockResolvedValue({
                data: [],
                total: 0
            });
            await controller.findAll({
                user: {
                    id: 'u1'
                }
            }, undefined, '1', '100');
            expect(mockResumesService.findAll).toHaveBeenCalledWith('u1', 1, 50);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/public — 공개 이력서 검색
    // ──────────────────────────────────────────────────
    describe('findPublicResumes (GET /resumes/public)', ()=>{
        it('검색 파라미터 없이 호출 → 기본값으로 searchPublic', async ()=>{
            const mockData = {
                data: [],
                total: 0
            };
            mockResumesService.searchPublic.mockResolvedValue(mockData);
            const result = await controller.findPublicResumes();
            expect(result).toEqual(mockData);
            expect(mockResumesService.searchPublic).toHaveBeenCalledWith({
                query: undefined,
                tag: undefined,
                sort: undefined,
                page: 1,
                limit: 20
            });
        });
        it('검색어, 태그, 정렬 조건으로 검색', async ()=>{
            const mockData = {
                data: [
                    {
                        id: 'r1'
                    }
                ],
                total: 1
            };
            mockResumesService.searchPublic.mockResolvedValue(mockData);
            const result = await controller.findPublicResumes('개발자', 'react', 'views', '2', '10');
            expect(result).toEqual(mockData);
            expect(mockResumesService.searchPublic).toHaveBeenCalledWith({
                query: '개발자',
                tag: 'react',
                sort: 'views',
                page: 2,
                limit: 10
            });
        });
        it('limit 최대 50 제한', async ()=>{
            mockResumesService.searchPublic.mockResolvedValue({
                data: [],
                total: 0
            });
            await controller.findPublicResumes(undefined, undefined, undefined, '1', '999');
            expect(mockResumesService.searchPublic).toHaveBeenCalledWith(expect.objectContaining({
                limit: 50
            }));
        });
    });
    // ──────────────────────────────────────────────────
    // POST /api/resumes — 이력서 생성
    // ──────────────────────────────────────────────────
    describe('create (POST /resumes)', ()=>{
        it('로그인 사용자 → 이력서 생성 성공', async ()=>{
            const dto = {
                title: '새 이력서'
            };
            const created = {
                id: 'r1',
                title: '새 이력서',
                userId: 'u1'
            };
            mockResumesService.create.mockResolvedValue(created);
            const result = await controller.create(dto, {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(created);
            expect(mockResumesService.create).toHaveBeenCalledWith(dto, 'u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.create({}, {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
        it('user.id 없음 → UnauthorizedException', ()=>{
            expect(()=>controller.create({}, {
                    user: {}
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/:id — 이력서 상세 조회
    // ──────────────────────────────────────────────────
    describe('findOne (GET /resumes/:id)', ()=>{
        it('로그인 사용자 → userId 포함하여 조회', async ()=>{
            const resume = {
                id: 'r1',
                title: '이력서',
                userId: 'u1'
            };
            mockResumesService.findOne.mockResolvedValue(resume);
            const result = await controller.findOne('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(resume);
            expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', 'u1');
        });
        it('비로그인 → userId undefined으로 조회 (공개 이력서만 가능)', async ()=>{
            const resume = {
                id: 'r1',
                title: '공개 이력서',
                visibility: 'public'
            };
            mockResumesService.findOne.mockResolvedValue(resume);
            const result = await controller.findOne('r1', {
                user: null
            });
            expect(result).toEqual(resume);
            expect(mockResumesService.findOne).toHaveBeenCalledWith('r1', undefined);
        });
    });
    // ──────────────────────────────────────────────────
    // PUT /api/resumes/:id — 이력서 수정
    // ──────────────────────────────────────────────────
    describe('update (PUT /resumes/:id)', ()=>{
        it('소유자 → 이력서 수정 성공', async ()=>{
            const dto = {
                title: '수정된 이력서'
            };
            const updated = {
                id: 'r1',
                title: '수정된 이력서'
            };
            mockResumesService.update.mockResolvedValue(updated);
            const result = await controller.update('r1', dto, {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(updated);
            expect(mockResumesService.update).toHaveBeenCalledWith('r1', dto, 'u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.update('r1', {}, {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // PATCH /api/resumes/:id/visibility — 공개/비공개 설정
    // ──────────────────────────────────────────────────
    describe('setVisibility (PATCH /resumes/:id/visibility)', ()=>{
        it('소유자 → 공개 설정 성공', async ()=>{
            const result = {
                id: 'r1',
                visibility: 'public'
            };
            mockResumesService.setVisibility.mockResolvedValue(result);
            const res = await controller.setVisibility('r1', 'public', {
                user: {
                    id: 'u1',
                    role: 'user'
                }
            });
            expect(res).toEqual(result);
            expect(mockResumesService.setVisibility).toHaveBeenCalledWith('r1', 'public', 'u1', 'user');
        });
        it('관리자 → 다른 사용자 이력서 공개 설정 가능', async ()=>{
            mockResumesService.setVisibility.mockResolvedValue({
                id: 'r1',
                visibility: 'private'
            });
            await controller.setVisibility('r1', 'private', {
                user: {
                    id: 'admin1',
                    role: 'admin'
                }
            });
            expect(mockResumesService.setVisibility).toHaveBeenCalledWith('r1', 'private', 'admin1', 'admin');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.setVisibility('r1', 'public', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // DELETE /api/resumes/:id — 이력서 삭제
    // ──────────────────────────────────────────────────
    describe('remove (DELETE /resumes/:id)', ()=>{
        it('소유자 → 이력서 삭제 성공', async ()=>{
            mockResumesService.remove.mockResolvedValue({
                deleted: true
            });
            const result = await controller.remove('r1', {
                user: {
                    id: 'u1',
                    role: 'user'
                }
            });
            expect(result).toEqual({
                deleted: true
            });
            expect(mockResumesService.remove).toHaveBeenCalledWith('r1', 'u1', 'user');
        });
        it('관리자 → 다른 사용자 이력서 삭제 가능', async ()=>{
            mockResumesService.remove.mockResolvedValue({
                deleted: true
            });
            await controller.remove('r1', {
                user: {
                    id: 'admin1',
                    role: 'superadmin'
                }
            });
            expect(mockResumesService.remove).toHaveBeenCalledWith('r1', 'admin1', 'superadmin');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.remove('r1', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // POST /api/resumes/:id/bookmark — 북마크 추가
    // ──────────────────────────────────────────────────
    describe('addBookmark (POST /resumes/:id/bookmark)', ()=>{
        it('로그인 사용자 → 북마크 추가 성공', async ()=>{
            mockResumesService.addBookmark.mockResolvedValue({
                bookmarked: true
            });
            const result = await controller.addBookmark('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual({
                bookmarked: true
            });
            expect(mockResumesService.addBookmark).toHaveBeenCalledWith('r1', 'u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.addBookmark('r1', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // DELETE /api/resumes/:id/bookmark — 북마크 해제
    // ──────────────────────────────────────────────────
    describe('removeBookmark (DELETE /resumes/:id/bookmark)', ()=>{
        it('로그인 사용자 → 북마크 해제 성공', async ()=>{
            mockResumesService.removeBookmark.mockResolvedValue({
                bookmarked: false
            });
            const result = await controller.removeBookmark('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual({
                bookmarked: false
            });
            expect(mockResumesService.removeBookmark).toHaveBeenCalledWith('r1', 'u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.removeBookmark('r1', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/:id/bookmark/status — 북마크 여부
    // ──────────────────────────────────────────────────
    describe('isBookmarked (GET /resumes/:id/bookmark/status)', ()=>{
        it('로그인 + 북마크됨 → { bookmarked: true }', async ()=>{
            mockResumesService.isBookmarked.mockResolvedValue(true);
            const result = await controller.isBookmarked('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual({
                bookmarked: true
            });
        });
        it('로그인 + 북마크 안됨 → { bookmarked: false }', async ()=>{
            mockResumesService.isBookmarked.mockResolvedValue(false);
            const result = await controller.isBookmarked('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual({
                bookmarked: false
            });
        });
        it('비로그인 → { bookmarked: false }', async ()=>{
            const result = await controller.isBookmarked('r1', {
                user: null
            });
            expect(result).toEqual({
                bookmarked: false
            });
        });
    });
    // ──────────────────────────────────────────────────
    // POST /api/resumes/:id/duplicate — 이력서 복제
    // ──────────────────────────────────────────────────
    describe('duplicate (POST /resumes/:id/duplicate)', ()=>{
        it('로그인 사용자 → 이력서 복제 성공', async ()=>{
            const duplicated = {
                id: 'r2',
                title: '이력서 (복사본)'
            };
            mockResumesService.duplicate.mockResolvedValue(duplicated);
            const result = await controller.duplicate('r1', {
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(duplicated);
            expect(mockResumesService.duplicate).toHaveBeenCalledWith('r1', 'u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.duplicate('r1', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/:id/export/text — 텍스트 내보내기
    // ──────────────────────────────────────────────────
    describe('exportText (GET /resumes/:id/export/text)', ()=>{
        it('이력서 텍스트 내보내기 성공 → Content-Type text/plain', async ()=>{
            const textContent = '홍길동\ntest@test.com\n\n=== 경력 ===';
            mockExportService.exportAsText.mockResolvedValue(textContent);
            const res = mockResponse();
            await controller.exportText('r1', res);
            expect(mockExportService.exportAsText).toHaveBeenCalledWith('r1');
            expect(mockResumesService.incrementViewCount).toHaveBeenCalledWith('r1');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/plain; charset=utf-8');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="resume.txt"');
            expect(res.send).toHaveBeenCalledWith(textContent);
        });
        it('존재하지 않는 이력서 → NotFoundException 전달', async ()=>{
            mockExportService.exportAsText.mockRejectedValue(new _common.NotFoundException('이력서를 찾을 수 없습니다'));
            const res = mockResponse();
            await expect(controller.exportText('nonexistent', res)).rejects.toThrow(_common.NotFoundException);
        });
        it('예상치 못한 오류 → InternalServerErrorException', async ()=>{
            mockExportService.exportAsText.mockRejectedValue(new Error('DB error'));
            const res = mockResponse();
            await expect(controller.exportText('r1', res)).rejects.toThrow(_common.InternalServerErrorException);
        });
    });
    // ──────────────────────────────────────────────────
    // PATCH /api/resumes/:id/transfer — 소유권 이전 (관리자)
    // ──────────────────────────────────────────────────
    describe('transferOwnership (PATCH /resumes/:id/transfer)', ()=>{
        it('관리자(admin) → 소유권 이전 성공', async ()=>{
            mockResumesService.transferOwnership.mockResolvedValue({
                id: 'r1',
                userId: 'u2'
            });
            const result = await controller.transferOwnership('r1', 'u2', {
                user: {
                    id: 'admin1',
                    role: 'admin'
                }
            });
            expect(result).toEqual({
                id: 'r1',
                userId: 'u2'
            });
            expect(mockResumesService.transferOwnership).toHaveBeenCalledWith('r1', 'u2');
        });
        it('슈퍼관리자(superadmin) → 소유권 이전 성공', async ()=>{
            mockResumesService.transferOwnership.mockResolvedValue({
                id: 'r1',
                userId: 'u3'
            });
            const result = await controller.transferOwnership('r1', 'u3', {
                user: {
                    id: 'sa1',
                    role: 'superadmin'
                }
            });
            expect(result).toEqual({
                id: 'r1',
                userId: 'u3'
            });
        });
        it('일반 사용자 → UnauthorizedException (관리자 권한 필요)', ()=>{
            expect(()=>controller.transferOwnership('r1', 'u2', {
                    user: {
                        id: 'u1',
                        role: 'user'
                    }
                })).toThrow(_common.UnauthorizedException);
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.transferOwnership('r1', 'u2', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/bookmarks/list — 내 북마크 목록
    // ──────────────────────────────────────────────────
    describe('getBookmarks (GET /resumes/bookmarks/list)', ()=>{
        it('로그인 사용자 → 북마크 목록 반환', async ()=>{
            const bookmarks = [
                {
                    id: 'b1',
                    resumeId: 'r1'
                }
            ];
            mockResumesService.getBookmarks.mockResolvedValue(bookmarks);
            const result = await controller.getBookmarks({
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(bookmarks);
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.getBookmarks({
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/dashboard/analytics — 대시보드 분석
    // ──────────────────────────────────────────────────
    describe('analytics (GET /resumes/dashboard/analytics)', ()=>{
        it('로그인 사용자 → 대시보드 분석 반환', async ()=>{
            const dashboardData = {
                totalResumes: 3,
                totalViews: 100
            };
            mockAnalyticsService.getUserDashboard.mockResolvedValue(dashboardData);
            const result = await controller.analytics({
                user: {
                    id: 'u1'
                }
            });
            expect(result).toEqual(dashboardData);
            expect(mockAnalyticsService.getUserDashboard).toHaveBeenCalledWith('u1');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.analytics({
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // PATCH /api/resumes/:id/slug — 슬러그 변경
    // ──────────────────────────────────────────────────
    describe('updateSlug (PATCH /resumes/:id/slug)', ()=>{
        it('소유자 → 슬러그 변경 성공', async ()=>{
            mockResumesService.updateSlug.mockResolvedValue({
                id: 'r1',
                slug: 'my-resume'
            });
            const result = await controller.updateSlug('r1', 'my-resume', {
                user: {
                    id: 'u1',
                    role: 'user'
                }
            });
            expect(result).toEqual({
                id: 'r1',
                slug: 'my-resume'
            });
            expect(mockResumesService.updateSlug).toHaveBeenCalledWith('r1', 'my-resume', 'u1', 'user');
        });
        it('비로그인 → UnauthorizedException', ()=>{
            expect(()=>controller.updateSlug('r1', 'slug', {
                    user: null
                })).toThrow(_common.UnauthorizedException);
        });
    });
    // ──────────────────────────────────────────────────
    // GET /api/resumes/@:username/:slug — 슬러그로 조회
    // ──────────────────────────────────────────────────
    describe('findBySlug (GET /resumes/@:username/:slug)', ()=>{
        it('공개 이력서 슬러그로 조회', async ()=>{
            const resume = {
                id: 'r1',
                title: '이력서',
                slug: 'my-resume'
            };
            mockResumesService.findBySlug.mockResolvedValue(resume);
            const result = await controller.findBySlug('hong', 'my-resume');
            expect(result).toEqual(resume);
            expect(mockResumesService.findBySlug).toHaveBeenCalledWith('hong', 'my-resume');
        });
    });
});
