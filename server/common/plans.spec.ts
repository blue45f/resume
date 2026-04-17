/**
 * plans.ts 유틸리티 테스트
 *
 * src/lib/plans.ts는 프론트엔드 코드이지만 순수 함수로만 구성되어 있으므로
 * 동일한 로직을 직접 임포트하여 테스트합니다.
 */

// ts-jest의 tsconfig가 server/**만 포함하므로 직접 require로 로드

const plans = require('../../src/lib/plans');

const { PLANS, RECRUITER_PLANS, getPlansForUserType, getPlan, canAccess, formatPrice } = plans;

describe('plans utility', () => {
  describe('PLANS 상수', () => {
    it('3개 플랜 존재', () => {
      expect(PLANS).toHaveLength(3);
    });

    it('플랜 ID가 free, standard, premium', () => {
      const ids = PLANS.map((p: any) => p.id);
      expect(ids).toEqual(['free', 'standard', 'premium']);
    });

    it('free 플랜 가격은 0', () => {
      const free = PLANS.find((p: any) => p.id === 'free');
      expect(free.price).toBe(0);
      expect(free.yearlyPrice).toBe(0);
    });

    it('standard 플랜이 popular로 표시됨', () => {
      const standard = PLANS.find((p: any) => p.id === 'standard');
      expect(standard.popular).toBe(true);
    });
  });

  describe('getPlansForUserType', () => {
    it('recruiter → RECRUITER_PLANS 반환', () => {
      expect(getPlansForUserType('recruiter')).toBe(RECRUITER_PLANS);
    });

    it('company → RECRUITER_PLANS 반환', () => {
      expect(getPlansForUserType('company')).toBe(RECRUITER_PLANS);
    });

    it('일반 사용자 → PLANS 반환', () => {
      expect(getPlansForUserType('user')).toBe(PLANS);
    });

    it('undefined → PLANS 반환', () => {
      expect(getPlansForUserType(undefined)).toBe(PLANS);
    });

    it('빈 문자열 → PLANS 반환', () => {
      expect(getPlansForUserType('')).toBe(PLANS);
    });
  });

  describe('getPlan', () => {
    it('유효한 planId → 해당 플랜 반환', () => {
      expect(getPlan('free').id).toBe('free');
      expect(getPlan('standard').id).toBe('standard');
      expect(getPlan('premium').id).toBe('premium');
    });

    it('잘못된 planId → free 플랜 반환 (기본값)', () => {
      expect(getPlan('nonexistent').id).toBe('free');
      expect(getPlan('').id).toBe('free');
    });
  });

  describe('canAccess', () => {
    describe('admin/superadmin 역할', () => {
      it('admin은 모든 기능 접근 가능 (free 플랜이어도)', () => {
        expect(canAccess('free', 'aiCoaching', 'admin')).toBe(true);
        expect(canAccess('free', 'coverLetter', 'admin')).toBe(true);
        expect(canAccess('free', 'translation', 'admin')).toBe(true);
      });

      it('superadmin은 모든 기능 접근 가능', () => {
        expect(canAccess('free', 'aiCoaching', 'superadmin')).toBe(true);
        expect(canAccess('free', 'translation', 'superadmin')).toBe(true);
        expect(canAccess('free', 'prioritySupport', 'superadmin')).toBe(true);
      });
    });

    describe('플랜별 기능 제한', () => {
      it('free 플랜 → atsCheck 가능', () => {
        expect(canAccess('free', 'atsCheck')).toBe(true);
      });

      it('free 플랜 → aiCoaching 불가', () => {
        expect(canAccess('free', 'aiCoaching')).toBe(false);
      });

      it('free 플랜 → coverLetter 불가', () => {
        expect(canAccess('free', 'coverLetter')).toBe(false);
      });

      it('free 플랜 → translation 불가', () => {
        expect(canAccess('free', 'translation')).toBe(false);
      });

      it('standard 플랜 → aiCoaching 가능', () => {
        expect(canAccess('standard', 'aiCoaching')).toBe(true);
      });

      it('standard 플랜 → coverLetter 가능', () => {
        expect(canAccess('standard', 'coverLetter')).toBe(true);
      });

      it('standard 플랜 → translation 불가', () => {
        expect(canAccess('standard', 'translation')).toBe(false);
      });

      it('premium 플랜 → 모든 기능 가능', () => {
        expect(canAccess('premium', 'aiCoaching')).toBe(true);
        expect(canAccess('premium', 'coverLetter')).toBe(true);
        expect(canAccess('premium', 'translation')).toBe(true);
        expect(canAccess('premium', 'prioritySupport')).toBe(true);
      });
    });

    describe('숫자형 features', () => {
      it('free 플랜 → maxResumes > 0 이므로 접근 가능', () => {
        expect(canAccess('free', 'maxResumes')).toBe(true);
      });

      it('free 플랜 → scoutMessages = 0 이므로 접근 불가', () => {
        expect(canAccess('free', 'scoutMessages')).toBe(false);
      });

      it('standard 플랜 → scoutMessages > 0 이므로 접근 가능', () => {
        expect(canAccess('standard', 'scoutMessages')).toBe(true);
      });
    });

    describe('역할 없는 일반 사용자', () => {
      it('userRole가 undefined일 때 플랜에 따라 결정', () => {
        expect(canAccess('free', 'aiCoaching', undefined)).toBe(false);
        expect(canAccess('premium', 'aiCoaching', undefined)).toBe(true);
      });

      it('userRole가 user일 때 플랜에 따라 결정', () => {
        expect(canAccess('free', 'aiCoaching', 'user')).toBe(false);
        expect(canAccess('premium', 'aiCoaching', 'user')).toBe(true);
      });
    });
  });

  describe('formatPrice', () => {
    it('0원 → "무료"', () => {
      expect(formatPrice(0)).toBe('무료');
    });

    it('2900 → 원화 형식', () => {
      const result = formatPrice(2900);
      expect(result).toContain('2,900');
      expect(result).toContain('₩');
    });

    it('49900 → 원화 형식', () => {
      const result = formatPrice(49900);
      expect(result).toContain('49,900');
    });
  });
});
