import { describe, expect, it } from 'vitest';
import { checkSoftSkillEvidence } from './resumeSoftSkillEvidenceChecker';

describe('checkSoftSkillEvidence', () => {
  it('returns none for empty text', () => {
    const r = checkSoftSkillEvidence('');
    expect(r.grade).toBe('none');
    expect(r.score).toBe(0);
    expect(r.claims.length).toBe(0);
  });

  it('returns none for text without softskill keywords', () => {
    const r = checkSoftSkillEvidence('React TypeScript로 SPA를 개발했습니다. AWS S3에 배포.');
    expect(r.grade).toBe('none');
  });

  it('detects bare communication claim', () => {
    const r = checkSoftSkillEvidence('커뮤니케이션 능력 우수한 개발자입니다.');
    const bare = r.bareClaims.find((c) => c.category === 'communication');
    expect(bare).toBeDefined();
    expect(bare?.quality).toBe('bare');
  });

  it('detects bare teamwork claim', () => {
    const r = checkSoftSkillEvidence('팀워크 역량 탁월하며 협업 보유하고 있습니다.');
    const bare = r.bareClaims.find((c) => c.category === 'teamwork');
    expect(bare).toBeDefined();
  });

  it('detects bare leadership soft claim', () => {
    const r = checkSoftSkillEvidence('주도적인 성격으로 업무를 처리합니다.');
    const bare = r.bareClaims.find((c) => c.category === 'leadership_soft');
    expect(bare).toBeDefined();
  });

  it('detects evidenced communication claim (numeric context)', () => {
    const r = checkSoftSkillEvidence('5개 팀과 협업하여 배포 리드타임을 30% 단축했습니다.');
    const ev = r.evidencedClaims.find((c) => c.category === 'communication');
    expect(ev).toBeDefined();
    expect(ev?.quality).toBe('evidenced');
  });

  it('evidenced claim wins over bare for same category', () => {
    const text = '5개 팀과 커뮤니케이션으로 20% 개선. 원활한 커뮤니케이션 보유.';
    const r = checkSoftSkillEvidence(text);
    // evidenced should be detected, bare should NOT for same category
    const comm = r.claims.filter((c) => c.category === 'communication');
    const hasEvidenced = comm.some((c) => c.quality === 'evidenced');
    const hasBare = comm.some((c) => c.quality === 'bare');
    expect(hasEvidenced).toBe(true);
    expect(hasBare).toBe(false);
  });

  it('returns bare grade when all claims are bare', () => {
    const text =
      '커뮤니케이션 능력 우수. 팀워크 역량 보유. 주도적인 성향. 책임감 강함. 문제해결 능력 탁월.';
    const r = checkSoftSkillEvidence(text);
    expect(r.grade).toBe('bare');
    expect(r.score).toBe(0);
    expect(r.bareClaims.length).toBeGreaterThan(0);
  });

  it('returns good grade when evidenced claims dominate', () => {
    const text = `
      5개 팀과 협업으로 배포 리드타임 20% 단축.
      10명 팀원과 함께 분기 목표 달성.
      주도적으로 새 아키텍처 제안하여 성능 50% 향상.
    `;
    const r = checkSoftSkillEvidence(text);
    expect(r.grade).toBe('good');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  it('returns mixed grade for partial evidence', () => {
    const text = '5개 팀과 협업하여 30% 개선. 책임감 강함. 문제해결 능력 탁월.';
    const r = checkSoftSkillEvidence(text);
    expect(r.grade).toBe('mixed');
  });

  it('suggestion mentions example for bare grade', () => {
    const r = checkSoftSkillEvidence('커뮤니케이션 능력 우수. 적극적인 성격.');
    expect(r.suggestion).toContain('근거');
  });
});
