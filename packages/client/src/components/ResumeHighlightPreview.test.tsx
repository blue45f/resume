import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ResumeHighlightPreview from './ResumeHighlightPreview';

const TEXT =
  '제가 결제 시스템을 구축하여 응답 시간을 40% 단축했습니다. 다양한 업무를 열심히 수행하며 팀의 성과에 기여했고, 대규모 트래픽 환경에서 안정적인 서비스를 운영한 경험이 있습니다.';

describe('ResumeHighlightPreview', () => {
  it('renders nothing for short text', () => {
    const { container } = render(<ResumeHighlightPreview text="짧은 글" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders highlight marks for metrics/verbs/filler', () => {
    const { container } = render(<ResumeHighlightPreview text={TEXT} />);
    expect(container.querySelector('.hl--metric')).not.toBeNull();
    expect(container.querySelector('.hl--strongVerb')).not.toBeNull();
    expect(container.querySelector('.hl--filler')).not.toBeNull();
  });

  it('preserves the full text content', () => {
    const { container } = render(<ResumeHighlightPreview text={TEXT} />);
    const body = container.querySelector('.hl-preview__body');
    expect(body?.textContent).toBe(TEXT);
  });
});
