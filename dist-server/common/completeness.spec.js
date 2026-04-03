"use strict";
function calculateCompleteness(resume) {
    const sections = [];
    const tips = [];
    const pi = resume.personalInfo;
    let piScore = 0;
    if (pi.name)
        piScore += 6;
    else
        tips.push('이름을 입력하세요');
    if (pi.email)
        piScore += 5;
    else
        tips.push('이메일을 입력하세요');
    if (pi.phone)
        piScore += 4;
    if (pi.summary && pi.summary.length > 30)
        piScore += 8;
    else if (pi.summary)
        piScore += 4;
    else
        tips.push('자기소개를 30자 이상 작성하세요');
    if (pi.address)
        piScore += 2;
    if (pi.website || pi.github)
        piScore += 3;
    if (pi.photo)
        piScore += 2;
    sections.push({ label: '인적사항', score: piScore, maxScore: 30 });
    const expCount = resume.experiences.length;
    let expScore = 0;
    if (expCount >= 1)
        expScore += 10;
    if (expCount >= 2)
        expScore += 5;
    if (expCount >= 3)
        expScore += 3;
    const hasDescriptions = resume.experiences.some(e => e.description && e.description.length > 30);
    if (hasDescriptions)
        expScore += 5;
    const hasTechStack = resume.experiences.some(e => e.techStack);
    if (hasTechStack)
        expScore += 2;
    if (expCount === 0)
        tips.push('경력 사항을 1개 이상 추가하세요');
    else if (!hasDescriptions)
        tips.push('경력의 업무 내용을 상세히 작성하세요');
    sections.push({ label: '경력', score: Math.min(expScore, 25), maxScore: 25 });
    let eduScore = 0;
    if (resume.educations.length >= 1)
        eduScore += 7;
    if (resume.educations.length >= 1 && resume.educations[0].degree)
        eduScore += 3;
    if (resume.educations.length === 0)
        tips.push('학력을 추가하세요');
    sections.push({ label: '학력', score: eduScore, maxScore: 10 });
    let skillScore = 0;
    if (resume.skills.length >= 1)
        skillScore += 6;
    if (resume.skills.length >= 2)
        skillScore += 4;
    if (resume.skills.length >= 3)
        skillScore += 3;
    if (resume.skills.some(s => s.items && s.items.split(',').length >= 3))
        skillScore += 2;
    if (resume.skills.length === 0)
        tips.push('기술 스택을 추가하세요');
    sections.push({ label: '기술', score: Math.min(skillScore, 15), maxScore: 15 });
    let projScore = 0;
    if (resume.projects.length >= 1)
        projScore += 5;
    if (resume.projects.length >= 2)
        projScore += 3;
    if (resume.projects.some(p => p.description && p.description.length > 30))
        projScore += 2;
    sections.push({ label: '프로젝트', score: Math.min(projScore, 10), maxScore: 10 });
    let etcScore = 0;
    if (resume.certifications.length >= 1)
        etcScore += 3;
    if (resume.languages.length >= 1)
        etcScore += 2;
    if (resume.awards.length >= 1)
        etcScore += 2;
    if (resume.activities.length >= 1)
        etcScore += 3;
    sections.push({ label: '자격/어학/수상/활동', score: Math.min(etcScore, 10), maxScore: 10 });
    const total = sections.reduce((sum, s) => sum + s.score, 0);
    const max = sections.reduce((sum, s) => sum + s.maxScore, 0);
    const percentage = Math.round((total / max) * 100);
    let grade = 'D';
    if (percentage >= 90)
        grade = 'S';
    else if (percentage >= 80)
        grade = 'A';
    else if (percentage >= 70)
        grade = 'B';
    else if (percentage >= 50)
        grade = 'C';
    return { percentage, grade, sections, tips: tips.slice(0, 5) };
}
function createEmptyResume() {
    return {
        id: '1',
        title: 'Test',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        personalInfo: { name: '', email: '', phone: '', address: '', website: '', github: '', summary: '', photo: '' },
        experiences: [],
        educations: [],
        skills: [],
        projects: [],
        certifications: [],
        languages: [],
        awards: [],
        activities: [],
    };
}
function createFullResume() {
    return {
        id: '1',
        title: 'Full Resume',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-01',
        personalInfo: {
            name: '홍길동',
            email: 'hong@example.com',
            phone: '010-1234-5678',
            address: '서울시 강남구',
            website: 'https://example.com',
            github: 'https://github.com/hong',
            summary: '10년 경력의 풀스택 개발자로 다양한 프로젝트를 성공적으로 이끌었습니다.',
            photo: 'https://example.com/photo.jpg',
        },
        experiences: [
            { id: '1', company: 'A사', position: '시니어 개발자', startDate: '2020-01', endDate: '2025-01', current: false, description: '대규모 서비스 아키텍처 설계 및 개발을 담당하였으며 팀을 리딩했습니다.', techStack: 'TypeScript, React, Node.js' },
            { id: '2', company: 'B사', position: '주니어 개발자', startDate: '2018-01', endDate: '2020-01', current: false, description: '웹 애플리케이션 프론트엔드 개발 및 API 연동 업무를 수행했습니다.', techStack: 'JavaScript, Vue.js' },
            { id: '3', company: 'C사', position: '인턴', startDate: '2017-06', endDate: '2017-12', current: false, description: 'QA 자동화 스크립트 작성 및 테스트 업무를 수행했습니다.' },
        ],
        educations: [
            { id: '1', school: '서울대학교', degree: '학사', field: '컴퓨터공학', startDate: '2013-03', endDate: '2017-02', description: '' },
        ],
        skills: [
            { id: '1', category: 'Frontend', items: 'React, Vue.js, TypeScript' },
            { id: '2', category: 'Backend', items: 'Node.js, NestJS, Python' },
            { id: '3', category: 'DevOps', items: 'Docker, AWS, CI/CD' },
        ],
        projects: [
            { id: '1', name: '이력서 플랫폼', role: '풀스택', startDate: '2024-01', endDate: '2025-01', description: 'NestJS와 React를 사용한 이력서 관리 플랫폼을 설계하고 개발했습니다.', link: 'https://example.com' },
            { id: '2', name: '채팅 앱', role: '백엔드', startDate: '2023-01', endDate: '2023-12', description: 'WebSocket 기반 실시간 채팅 서비스를 개발했습니다.', link: '' },
        ],
        certifications: [{ id: '1', name: '정보처리기사' }],
        languages: [{ id: '1', name: 'TOEIC 950' }],
        awards: [{ id: '1', name: '사내 해커톤 1위' }],
        activities: [{ id: '1', name: '오픈소스 컨트리뷰션' }],
    };
}
describe('calculateCompleteness', () => {
    it('empty resume returns 0%', () => {
        const result = calculateCompleteness(createEmptyResume());
        expect(result.percentage).toBe(0);
        expect(result.grade).toBe('D');
    });
    it('full resume returns 100%', () => {
        const result = calculateCompleteness(createFullResume());
        expect(result.percentage).toBe(100);
        expect(result.grade).toBe('S');
    });
    it('total max score is 100 points', () => {
        const result = calculateCompleteness(createEmptyResume());
        const totalMax = result.sections.reduce((sum, s) => sum + s.maxScore, 0);
        expect(totalMax).toBe(100);
    });
    it('section max scores are correct', () => {
        const result = calculateCompleteness(createEmptyResume());
        const sectionMap = new Map(result.sections.map(s => [s.label, s.maxScore]));
        expect(sectionMap.get('인적사항')).toBe(30);
        expect(sectionMap.get('경력')).toBe(25);
        expect(sectionMap.get('학력')).toBe(10);
        expect(sectionMap.get('기술')).toBe(15);
        expect(sectionMap.get('프로젝트')).toBe(10);
        expect(sectionMap.get('자격/어학/수상/활동')).toBe(10);
    });
    it('has exactly 6 sections', () => {
        const result = calculateCompleteness(createEmptyResume());
        expect(result.sections).toHaveLength(6);
    });
    it('empty resume produces tips for missing sections', () => {
        const result = calculateCompleteness(createEmptyResume());
        expect(result.tips).toContain('이름을 입력하세요');
        expect(result.tips).toContain('이메일을 입력하세요');
        expect(result.tips.length).toBeGreaterThanOrEqual(3);
    });
    it('tips are limited to maximum 5 items', () => {
        const result = calculateCompleteness(createEmptyResume());
        expect(result.tips.length).toBeLessThanOrEqual(5);
    });
    it('full resume produces no tips', () => {
        const result = calculateCompleteness(createFullResume());
        expect(result.tips).toHaveLength(0);
    });
    it('grade boundaries are correct', () => {
        const empty = createEmptyResume();
        const nameOnly = { ...empty, personalInfo: { ...empty.personalInfo, name: 'Test' } };
        expect(calculateCompleteness(nameOnly).grade).toBe('D');
    });
    it('personal info name contributes 6 points', () => {
        const resume = createEmptyResume();
        resume.personalInfo.name = '홍길동';
        const result = calculateCompleteness(resume);
        const piSection = result.sections.find(s => s.label === '인적사항');
        expect(piSection.score).toBe(6);
    });
    it('short summary contributes 4 points, long summary contributes 8', () => {
        const resume = createEmptyResume();
        resume.personalInfo.summary = 'short';
        let result = calculateCompleteness(resume);
        let piScore = result.sections.find(s => s.label === '인적사항').score;
        expect(piScore).toBe(4);
        resume.personalInfo.summary = 'This is a summary that is definitely longer than thirty characters in total.';
        result = calculateCompleteness(resume);
        piScore = result.sections.find(s => s.label === '인적사항').score;
        expect(piScore).toBe(8);
    });
    it('one experience gives 10 points (before description bonus)', () => {
        const resume = createEmptyResume();
        resume.experiences = [
            { id: '1', company: 'A', position: 'Dev', startDate: '2020', endDate: '2025', current: false, description: '' },
        ];
        const result = calculateCompleteness(resume);
        const expSection = result.sections.find(s => s.label === '경력');
        expect(expSection.score).toBe(10);
    });
    it('education with degree gives full 10 points', () => {
        const resume = createEmptyResume();
        resume.educations = [
            { id: '1', school: 'MIT', degree: 'BS', field: 'CS', startDate: '2013', endDate: '2017', description: '' },
        ];
        const result = calculateCompleteness(resume);
        const eduSection = result.sections.find(s => s.label === '학력');
        expect(eduSection.score).toBe(10);
    });
    it('three skills with 3+ items each gives full 15 points', () => {
        const resume = createEmptyResume();
        resume.skills = [
            { id: '1', category: 'A', items: 'a,b,c' },
            { id: '2', category: 'B', items: 'd,e' },
            { id: '3', category: 'C', items: 'f' },
        ];
        const result = calculateCompleteness(resume);
        const skillSection = result.sections.find(s => s.label === '기술');
        expect(skillSection.score).toBe(15);
    });
});
