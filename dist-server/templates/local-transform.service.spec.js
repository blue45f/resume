"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _localtransformservice = require("./local-transform.service");
const mockResume = {
    personalInfo: {
        name: '홍길동',
        email: 'hong@test.com',
        phone: '010-1234-5678',
        address: '서울시 강남구',
        website: 'https://hong.dev',
        summary: '풀스택 개발자입니다.'
    },
    experiences: [
        {
            company: '네이버',
            position: '시니어 개발자',
            startDate: '2022-01',
            endDate: '2024-03',
            current: false,
            description: '프론트엔드 개발'
        }
    ],
    educations: [
        {
            school: '서울대학교',
            degree: '학사',
            field: '컴퓨터공학',
            startDate: '2016-03',
            endDate: '2020-02',
            description: ''
        }
    ],
    skills: [
        {
            category: '프로그래밍',
            items: 'TypeScript, React, Node.js'
        }
    ],
    projects: [
        {
            name: '이력서 플랫폼',
            role: '리드 개발자',
            startDate: '2023-06',
            endDate: '2024-01',
            description: 'NestJS 기반 이력서 서비스',
            link: 'https://github.com/example'
        }
    ],
    certifications: [
        {
            name: '정보처리기사',
            issuer: '한국산업인력공단',
            issueDate: '2020-06',
            expiryDate: '',
            credentialId: '20201234',
            description: ''
        }
    ],
    languages: [
        {
            name: '영어',
            testName: 'TOEIC',
            score: '950',
            testDate: '2023-01'
        }
    ],
    awards: [
        {
            name: '우수상',
            issuer: '해커톤',
            awardDate: '2023-11',
            description: '1등'
        }
    ],
    activities: [
        {
            name: '오픈소스 기여',
            organization: 'GitHub',
            role: '컨트리뷰터',
            startDate: '2021-01',
            endDate: '2023-12',
            description: '다양한 프로젝트 기여'
        }
    ]
};
describe('LocalTransformService', ()=>{
    let service;
    beforeEach(()=>{
        service = new _localtransformservice.LocalTransformService();
    });
    describe('transformByPreset', ()=>{
        it('standard 프리셋으로 변환 성공', ()=>{
            const result = service.transformByPreset(mockResume, 'standard');
            expect(result).toContain('# 홍길동');
            expect(result).toContain('## 자기소개');
            expect(result).toContain('풀스택 개발자입니다.');
            expect(result).toContain('## 경력');
            expect(result).toContain('**네이버**');
            expect(result).toContain('2022.01');
            expect(result).toContain('## 학력');
            expect(result).toContain('**서울대학교**');
            expect(result).toContain('## 기술');
            expect(result).toContain('TypeScript, React, Node.js');
        });
        it('developer 프리셋은 기술을 경력보다 먼저 배치', ()=>{
            const result = service.transformByPreset(mockResume, 'developer');
            const skillsIdx = result.indexOf('## 기술');
            const expIdx = result.indexOf('## 경력');
            expect(skillsIdx).toBeLessThan(expIdx);
        });
        it('minimal 프리셋은 dash 날짜 형식 사용', ()=>{
            const result = service.transformByPreset(mockResume, 'minimal');
            expect(result).toContain('2022-01');
        });
        it('academic 프리셋은 텍스트 날짜 형식 사용', ()=>{
            const result = service.transformByPreset(mockResume, 'academic');
            expect(result).toContain('2022년 1월');
        });
        it('존재하지 않는 프리셋 → standard 프리셋으로 폴백', ()=>{
            const result = service.transformByPreset(mockResume, 'nonexistent');
            const standardResult = service.transformByPreset(mockResume, 'standard');
            expect(result).toBe(standardResult);
        });
    });
    describe('transform', ()=>{
        it('커스텀 레이아웃으로 변환', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'personalInfo',
                    'skills'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('# 홍길동');
            expect(result).toContain('## 기술');
            expect(result).not.toContain('## 경력');
        });
        it('빈 섹션 목록은 기본 순서 사용', ()=>{
            const result = service.transform(mockResume, {
                sections: []
            });
            expect(result).toContain('# 홍길동');
            expect(result).toContain('## 경력');
        });
        it('자격증 섹션 렌더링', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'certifications'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('## 자격증');
            expect(result).toContain('**정보처리기사**');
            expect(result).toContain('자격번호: 20201234');
        });
        it('어학 섹션 렌더링', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'languages'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('## 어학');
            expect(result).toContain('**영어**');
            expect(result).toContain('TOEIC');
            expect(result).toContain('950');
        });
        it('수상 경력 섹션 렌더링', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'awards'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('## 수상 경력');
            expect(result).toContain('**우수상**');
        });
        it('활동/봉사 섹션 렌더링', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'activities'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('## 활동/봉사');
            expect(result).toContain('**오픈소스 기여**');
        });
        it('프로젝트 섹션 렌더링', ()=>{
            const result = service.transform(mockResume, {
                sections: [
                    'projects'
                ],
                dateFormat: 'dot'
            });
            expect(result).toContain('## 프로젝트');
            expect(result).toContain('**이력서 플랫폼**');
            expect(result).toContain('https://github.com/example');
        });
    });
    describe('빈 데이터 처리', ()=>{
        it('빈 이력서 데이터 처리', ()=>{
            const result = service.transform({}, {
                sections: [
                    'personalInfo',
                    'experiences',
                    'skills'
                ]
            });
            expect(result).toBe('');
        });
        it('personalInfo만 있는 경우', ()=>{
            const result = service.transform({
                personalInfo: {
                    name: '테스트'
                }
            }, {
                sections: [
                    'personalInfo',
                    'experiences'
                ]
            });
            expect(result).toContain('# 테스트');
            expect(result).not.toContain('## 경력');
        });
    });
});
