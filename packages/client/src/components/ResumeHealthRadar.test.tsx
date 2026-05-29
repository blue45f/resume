import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ResumeHealthRadar from './ResumeHealthRadar';

const RICH_TEXT = [
  '경력 사항',
  '제가 결제 시스템을 단독으로 설계하고 구축하여 응답 시간을 40% 단축했습니다.',
  '학력: 서울대학교 컴퓨터공학과',
  '보유 기술: Java, Spring, AWS',
].join('\n');

describe('ResumeHealthRadar', () => {
  it('renders nothing for short text', () => {
    const { container } = render(<ResumeHealthRadar text="짧은 글" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an SVG chart and overall score for substantial text', () => {
    const { container } = render(<ResumeHealthRadar text={RICH_TEXT} />);
    const svg = container.querySelector('svg.radar__chart');
    expect(svg).not.toBeNull();
    // 6 axis labels rendered
    expect(container.querySelectorAll('.radar__axis-label').length).toBe(6);
    // data polygon present
    expect(container.querySelector('.radar__area')).not.toBeNull();
    // overall number shown
    expect(screen.getByLabelText('이력서 건강 레이더')).toBeTruthy();
  });

  it('produces no NaN in generated SVG paths', () => {
    const { container } = render(<ResumeHealthRadar text={RICH_TEXT} />);
    const paths = container.querySelectorAll('path');
    paths.forEach((p) => {
      expect(p.getAttribute('d') ?? '').not.toContain('NaN');
    });
    const dots = container.querySelectorAll('circle.radar__dot');
    dots.forEach((c) => {
      expect(Number.isNaN(Number(c.getAttribute('cx')))).toBe(false);
      expect(Number.isNaN(Number(c.getAttribute('cy')))).toBe(false);
    });
  });
});
