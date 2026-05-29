import { describe, it, expect } from 'vitest';
import { PLANS, RECRUITER_PLANS, getPlan, canAccess } from './plans';

// 서버 billing.service PLANS(free/pro/enterprise)와 vocab 일치 보장 — 드리프트 회귀 가드.
describe('plans — 서버 vocab 정렬', () => {
  it('PLANS 는 free/pro/enterprise vocab 을 쓴다(standard/premium 아님)', () => {
    expect(PLANS.map((p) => p.id)).toEqual(['free', 'pro', 'enterprise']);
    expect(RECRUITER_PLANS.map((p) => p.id)).toEqual(['free', 'pro', 'enterprise']);
  });

  it('getPlan 이 서버 plan ID 를 인식한다(free 로 폴백하지 않음)', () => {
    expect(getPlan('pro').id).toBe('pro');
    expect(getPlan('enterprise').id).toBe('enterprise');
    expect(getPlan('free').id).toBe('free');
  });

  it('알 수 없는 plan ID 는 free 로 폴백', () => {
    expect(getPlan('bogus').id).toBe('free');
    // 과거 vocab 은 더 이상 매칭되지 않아야 함
    expect(getPlan('standard').id).toBe('free');
    expect(getPlan('premium').id).toBe('free');
  });

  it('시커 pro/enterprise 가격이 서버와 일치(9900/99000, 49000/490000)', () => {
    const pro = getPlan('pro');
    expect(pro.price).toBe(9900);
    expect(pro.yearlyPrice).toBe(99000);
    const ent = getPlan('enterprise');
    expect(ent.price).toBe(49000);
    expect(ent.yearlyPrice).toBe(490000);
  });

  it('canAccess: 유료 plan 은 유료 기능 접근, free 는 차단(게이팅 정상화)', () => {
    expect(canAccess('pro', 'coverLetter')).toBe(true);
    expect(canAccess('enterprise', 'translation')).toBe(true);
    expect(canAccess('free', 'coverLetter')).toBe(false);
    expect(canAccess('free', 'translation')).toBe(false);
  });

  it('admin/superadmin 은 모든 기능 접근', () => {
    expect(canAccess('free', 'coverLetter', 'admin')).toBe(true);
    expect(canAccess('free', 'translation', 'superadmin')).toBe(true);
  });
});
