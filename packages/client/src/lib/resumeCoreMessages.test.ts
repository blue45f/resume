import { describe, it, expect } from 'vitest';
import { extractResumeCoreMessages, CORE_MESSAGE_CATEGORY_LABELS } from './resumeCoreMessages';

describe('extractResumeCoreMessages', () => {
  it('빈 텍스트는 none 레벨과 빈 목록을 반환한다', () => {
    const r = extractResumeCoreMessages('');
    expect(r.level).toBe('none');
    expect(r.messages).toHaveLength(0);
    expect(r.top).toHaveLength(0);
    expect(r.averageStrength).toBe(0);
    expect(r.suggestion).toContain('감지되지 않');
  });

  it('수치+강한 동사 문장은 높은 강도와 신호를 가진다', () => {
    const r = extractResumeCoreMessages(
      '레거시 결제 시스템을 재설계하여 응답 속도를 40% 개선하고 운영 비용을 30% 절감했습니다',
    );
    expect(r.messages.length).toBeGreaterThan(0);
    const top = r.top[0];
    expect(top.signals.quantified).toBe(true);
    expect(top.signals.strongVerb).toBe(true);
    expect(top.strength).toBeGreaterThanOrEqual(60);
  });

  it('신호가 전혀 없는 평이한 문장은 제외한다', () => {
    const r = extractResumeCoreMessages('저는 성실하고 책임감이 강한 사람입니다');
    // 강한 동사/수치/성취/고유명사 없음 → 후보에서 제외 (단, 길이 보너스만으로는 0점)
    expect(r.messages).toHaveLength(0);
    expect(r.level).toBe('none');
  });

  it('성취 키워드 문장은 achievement 로 분류한다', () => {
    const r = extractResumeCoreMessages(
      '전국 해커톤에서 대상을 수상하고 최우수상에 선정되었습니다',
    );
    expect(r.top[0].category).toBe('achievement');
    expect(r.top[0].signals.achievement).toBe(true);
  });

  it('리더십 키워드 문장은 leadership 으로 분류한다', () => {
    const r = extractResumeCoreMessages(
      '5명 규모의 프론트엔드 팀을 주도하여 신규 서비스를 출시했습니다',
    );
    expect(r.top[0].category).toBe('leadership');
  });

  it('비즈니스 임팩트 키워드 문장은 impact 로 분류한다', () => {
    const r = extractResumeCoreMessages(
      '마케팅 자동화를 도입해 고객 이탈을 25% 줄이고 매출을 끌어올렸습니다',
    );
    expect(r.top[0].category).toBe('impact');
  });

  it('기술 구현 문장은 expertise(기본값)로 분류한다', () => {
    const r = extractResumeCoreMessages(
      'React와 TypeScript로 디자인 시스템을 구현하고 배포했습니다',
    );
    expect(r.top[0].category).toBe('expertise');
    expect(r.top[0].signals.proper).toBe(true); // React/TypeScript
  });

  it('동일 문장 중복은 한 번만 집계한다', () => {
    const dup = '서비스 성능을 50% 개선했습니다';
    const r = extractResumeCoreMessages(`${dup}\n${dup}\n${dup}`);
    expect(r.messages).toHaveLength(1);
  });

  it('topN 으로 상위 추천 개수를 제한한다', () => {
    const text = [
      '응답 속도를 40% 개선했습니다',
      '운영 비용을 30% 절감했습니다',
      '신규 기능 5개를 출시했습니다',
      '테스트 커버리지를 80%까지 끌어올렸습니다',
      '배포 시간을 60% 단축했습니다',
      '장애 발생률을 20% 낮췄습니다',
    ].join('\n');
    const r = extractResumeCoreMessages(text, 3);
    expect(r.top).toHaveLength(3);
    expect(r.messages.length).toBeGreaterThan(3);
    // 강도 내림차순 정렬 보장
    for (let i = 1; i < r.top.length; i++) {
      expect(r.top[i - 1].strength).toBeGreaterThanOrEqual(r.top[i].strength);
    }
  });

  it('강한 메시지가 풍부하면 high 레벨과 배치 제안을 준다', () => {
    const text = [
      '레거시 시스템을 재설계해 응답 속도를 40% 개선했습니다',
      '운영 비용을 30% 절감하고 매출을 15% 증대했습니다',
      '배포 파이프라인을 구축해 출시 주기를 50% 단축했습니다',
    ].join('\n');
    const r = extractResumeCoreMessages(text);
    expect(r.level).toBe('high');
    expect(r.suggestion).toMatch(/첫 줄|배치|앞세/);
  });

  it('카테고리 라벨 맵이 모든 카테고리를 한글로 제공한다', () => {
    expect(CORE_MESSAGE_CATEGORY_LABELS.achievement).toBe('성취');
    expect(CORE_MESSAGE_CATEGORY_LABELS.leadership).toBe('리더십');
    expect(CORE_MESSAGE_CATEGORY_LABELS.impact).toBe('임팩트');
    expect(CORE_MESSAGE_CATEGORY_LABELS.growth).toBe('성장');
    expect(CORE_MESSAGE_CATEGORY_LABELS.expertise).toBe('전문성');
  });
});
