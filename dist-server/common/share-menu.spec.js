"use strict";
/**
 * ShareMenu SNS 공유 URL 생성 테스트
 *
 * src/components/ShareMenu.tsx의 공유 URL 생성 로직을 순수 함수로 추출하여 테스트합니다.
 * 각 SNS 플랫폼별 URL 형식과 인코딩을 검증합니다.
 */ // ShareMenu 컴포넌트의 URL 생성 로직을 순수 함수로 재현
function buildKakaoUrl(url) {
    return `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
}
function buildFacebookUrl(url) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
function buildLineUrl(url) {
    return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
}
function buildTwitterUrl(title, url) {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
}
function buildLinkedInUrl(url) {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
function buildEmailUrl(title, description, url) {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${description || title}\n\n${url}`);
    return `mailto:?subject=${subject}&body=${body}`;
}
describe('ShareMenu SNS 공유 URL 생성', ()=>{
    const sampleUrl = 'https://resume.example.com/share/abc123';
    const sampleTitle = '홍길동의 이력서';
    const sampleDesc = '풀스택 개발자 이력서입니다';
    // ──────────────────────────────────────────────────
    // 카카오톡
    // ──────────────────────────────────────────────────
    describe('KakaoTalk', ()=>{
        it('카카오 스토리 공유 URL 형식', ()=>{
            const result = buildKakaoUrl(sampleUrl);
            expect(result).toBe(`https://story.kakao.com/share?url=${encodeURIComponent(sampleUrl)}`);
        });
        it('URL이 올바르게 인코딩됨', ()=>{
            const result = buildKakaoUrl(sampleUrl);
            expect(result).toContain('https%3A%2F%2Fresume.example.com');
            expect(result).not.toContain('://resume.example.com');
        });
        it('story.kakao.com 도메인 사용', ()=>{
            const result = buildKakaoUrl(sampleUrl);
            expect(result).toMatch(/^https:\/\/story\.kakao\.com\/share\?url=/);
        });
    });
    // ──────────────────────────────────────────────────
    // Facebook
    // ──────────────────────────────────────────────────
    describe('Facebook', ()=>{
        it('Facebook sharer URL 형식', ()=>{
            const result = buildFacebookUrl(sampleUrl);
            expect(result).toBe(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sampleUrl)}`);
        });
        it('sharer/sharer.php 경로 사용', ()=>{
            const result = buildFacebookUrl(sampleUrl);
            expect(result).toContain('/sharer/sharer.php?u=');
        });
    });
    // ──────────────────────────────────────────────────
    // LINE
    // ──────────────────────────────────────────────────
    describe('LINE', ()=>{
        it('LINE 소셜 플러그인 URL 형식', ()=>{
            const result = buildLineUrl(sampleUrl);
            expect(result).toBe(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(sampleUrl)}`);
        });
        it('social-plugins.line.me 도메인 사용', ()=>{
            const result = buildLineUrl(sampleUrl);
            expect(result).toMatch(/^https:\/\/social-plugins\.line\.me\/lineit\/share\?url=/);
        });
    });
    // ──────────────────────────────────────────────────
    // Twitter (X)
    // ──────────────────────────────────────────────────
    describe('Twitter', ()=>{
        it('Twitter intent URL 형식', ()=>{
            const result = buildTwitterUrl(sampleTitle, sampleUrl);
            expect(result).toBe(`https://twitter.com/intent/tweet?text=${encodeURIComponent(sampleTitle)}&url=${encodeURIComponent(sampleUrl)}`);
        });
        it('text와 url 파라미터 모두 포함', ()=>{
            const result = buildTwitterUrl(sampleTitle, sampleUrl);
            expect(result).toContain('?text=');
            expect(result).toContain('&url=');
        });
        it('제목의 한글이 올바르게 인코딩됨', ()=>{
            const result = buildTwitterUrl('한글 제목', sampleUrl);
            expect(result).toContain(encodeURIComponent('한글 제목'));
            expect(result).not.toContain('한글 제목');
        });
    });
    // ──────────────────────────────────────────────────
    // LinkedIn
    // ──────────────────────────────────────────────────
    describe('LinkedIn', ()=>{
        it('LinkedIn sharing URL 형식', ()=>{
            const result = buildLinkedInUrl(sampleUrl);
            expect(result).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(sampleUrl)}`);
        });
        it('share-offsite 경로 사용', ()=>{
            const result = buildLinkedInUrl(sampleUrl);
            expect(result).toContain('/sharing/share-offsite/?url=');
        });
    });
    // ──────────────────────────────────────────────────
    // 이메일
    // ──────────────────────────────────────────────────
    describe('Email', ()=>{
        it('mailto URL 형식', ()=>{
            const result = buildEmailUrl(sampleTitle, sampleDesc, sampleUrl);
            expect(result).toMatch(/^mailto:\?subject=.*&body=.*/);
        });
        it('subject에 제목 포함', ()=>{
            const result = buildEmailUrl(sampleTitle, sampleDesc, sampleUrl);
            expect(result).toContain(`subject=${encodeURIComponent(sampleTitle)}`);
        });
        it('body에 설명과 URL 포함', ()=>{
            const result = buildEmailUrl(sampleTitle, sampleDesc, sampleUrl);
            const expectedBody = encodeURIComponent(`${sampleDesc}\n\n${sampleUrl}`);
            expect(result).toContain(`body=${expectedBody}`);
        });
        it('description이 없으면 title을 body에 사용', ()=>{
            const result = buildEmailUrl(sampleTitle, '', sampleUrl);
            const expectedBody = encodeURIComponent(`${sampleTitle}\n\n${sampleUrl}`);
            expect(result).toContain(`body=${expectedBody}`);
        });
    });
    // ──────────────────────────────────────────────────
    // 특수 문자 인코딩 검증
    // ──────────────────────────────────────────────────
    describe('특수 문자 URL 인코딩', ()=>{
        const specialUrl = 'https://example.com/share?id=123&name=홍길동&tag=개발자#section';
        it('쿼리 파라미터의 & 문자가 인코딩됨', ()=>{
            const result = buildFacebookUrl(specialUrl);
            // 원본 URL의 &는 인코딩되어야 함
            expect(result).toContain(encodeURIComponent(specialUrl));
        });
        it('# 해시 문자가 인코딩됨', ()=>{
            const result = buildKakaoUrl(specialUrl);
            expect(result).toContain('%23section');
        });
        it('한글이 올바르게 인코딩됨', ()=>{
            const result = buildLineUrl(specialUrl);
            expect(result).toContain(encodeURIComponent('홍길동'));
        });
        it('공백이 포함된 제목 인코딩', ()=>{
            const title = 'My Resume Title & Cover Letter';
            const result = buildTwitterUrl(title, sampleUrl);
            expect(result).toContain(encodeURIComponent(title));
            expect(result).not.toContain('My Resume Title & Cover');
        });
        it('이모지가 포함된 URL 인코딩', ()=>{
            const urlWithEmoji = 'https://example.com/😊';
            const result = buildFacebookUrl(urlWithEmoji);
            expect(result).toContain(encodeURIComponent('😊'));
        });
        it('슬래시와 콜론은 인코딩됨 (URL 내부)', ()=>{
            const result = buildLinkedInUrl(sampleUrl);
            // encodeURIComponent는 :와 /를 인코딩함
            expect(result).toContain('%3A%2F%2F');
        });
    });
});
