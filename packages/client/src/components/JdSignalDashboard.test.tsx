import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import JdSignalDashboard from './JdSignalDashboard';

const JD = [
  '담당업무: 결제 시스템 개발',
  '자격요건: Java 3년 이상',
  '근무조건: 서울 강남, 정규직, 잦은 야근',
  '복리후생: 4대보험',
  '급여: 내부 규정에 따름',
].join('\n');

describe('JdSignalDashboard', () => {
  it('renders nothing for short text', () => {
    const { container } = render(<JdSignalDashboard text="짧음" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders 7 signal cells for a substantial JD', () => {
    const { container } = render(<JdSignalDashboard text={JD} />);
    expect(container.querySelector('.jd-board')).not.toBeNull();
    expect(container.querySelectorAll('.jd-board__cell').length).toBe(7);
    expect(screen.getByLabelText('채용공고 신호등 대시보드')).toBeTruthy();
  });

  it('shows summary counts', () => {
    const { container } = render(<JdSignalDashboard text={JD} />);
    expect(container.querySelector('.jd-board__count--good')).not.toBeNull();
    expect(container.querySelector('.jd-board__count--concern')).not.toBeNull();
  });
});
