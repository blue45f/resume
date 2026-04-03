"use strict";
const { timeAgo } = require('../../src/lib/time');
describe('timeAgo', () => {
    const NOW = 1712150400000;
    beforeEach(() => {
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('방금 전 (1분 미만)', () => {
        const date = new Date(NOW - 30 * 1000).toISOString();
        expect(timeAgo(date)).toBe('방금 전');
    });
    it('N분 전 (1분 이상 60분 미만)', () => {
        const date5m = new Date(NOW - 5 * 60 * 1000).toISOString();
        expect(timeAgo(date5m)).toBe('5분 전');
        const date30m = new Date(NOW - 30 * 60 * 1000).toISOString();
        expect(timeAgo(date30m)).toBe('30분 전');
        const date59m = new Date(NOW - 59 * 60 * 1000).toISOString();
        expect(timeAgo(date59m)).toBe('59분 전');
    });
    it('N시간 전 (1시간 이상 24시간 미만)', () => {
        const date1h = new Date(NOW - 1 * 3600 * 1000).toISOString();
        expect(timeAgo(date1h)).toBe('1시간 전');
        const date12h = new Date(NOW - 12 * 3600 * 1000).toISOString();
        expect(timeAgo(date12h)).toBe('12시간 전');
        const date23h = new Date(NOW - 23 * 3600 * 1000).toISOString();
        expect(timeAgo(date23h)).toBe('23시간 전');
    });
    it('N일 전 (1일 이상 7일 미만)', () => {
        const date1d = new Date(NOW - 1 * 86400 * 1000).toISOString();
        expect(timeAgo(date1d)).toBe('1일 전');
        const date6d = new Date(NOW - 6 * 86400 * 1000).toISOString();
        expect(timeAgo(date6d)).toBe('6일 전');
    });
    it('N주 전 (7일 이상 30일 미만)', () => {
        const date7d = new Date(NOW - 7 * 86400 * 1000).toISOString();
        expect(timeAgo(date7d)).toBe('1주 전');
        const date14d = new Date(NOW - 14 * 86400 * 1000).toISOString();
        expect(timeAgo(date14d)).toBe('2주 전');
        const date28d = new Date(NOW - 28 * 86400 * 1000).toISOString();
        expect(timeAgo(date28d)).toBe('4주 전');
    });
    it('N개월 전 (30일 이상 365일 미만)', () => {
        const date60d = new Date(NOW - 60 * 86400 * 1000).toISOString();
        expect(timeAgo(date60d)).toBe('2개월 전');
        const date180d = new Date(NOW - 180 * 86400 * 1000).toISOString();
        expect(timeAgo(date180d)).toBe('6개월 전');
    });
    it('N년 전 (365일 이상)', () => {
        const date1y = new Date(NOW - 365 * 86400 * 1000).toISOString();
        expect(timeAgo(date1y)).toBe('1년 전');
        const date2y = new Date(NOW - 730 * 86400 * 1000).toISOString();
        expect(timeAgo(date2y)).toBe('2년 전');
    });
    it('정확히 0초 차이 → 방금 전', () => {
        const date = new Date(NOW).toISOString();
        expect(timeAgo(date)).toBe('방금 전');
    });
    it('미래 날짜 → 방금 전 (음수 diff)', () => {
        const future = new Date(NOW + 60 * 60 * 1000).toISOString();
        expect(timeAgo(future)).toBe('방금 전');
    });
    it('경계값: 정확히 1분', () => {
        const date = new Date(NOW - 60 * 1000).toISOString();
        expect(timeAgo(date)).toBe('1분 전');
    });
    it('경계값: 정확히 1시간', () => {
        const date = new Date(NOW - 3600 * 1000).toISOString();
        expect(timeAgo(date)).toBe('1시간 전');
    });
    it('경계값: 정확히 24시간 (1일)', () => {
        const date = new Date(NOW - 24 * 3600 * 1000).toISOString();
        expect(timeAgo(date)).toBe('1일 전');
    });
});
