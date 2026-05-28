import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import ApplicationTimeline from './ApplicationTimeline';

describe('<ApplicationTimeline />', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('calculates elapsed days from an injected reference time', () => {
    render(
      <ApplicationTimeline
        applicationId="app-1"
        status="screening"
        appliedDate="2024-01-01T00:00:00.000Z"
        createdAt="2024-01-01T00:00:00.000Z"
        updatedAt="2024-01-04T00:00:00.000Z"
        now="2024-01-11T00:00:00.000Z"
      />,
    );

    expect(screen.getByRole('button', { name: /10일 경과/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /10일 경과/ }));

    expect(screen.getByText(/7일/)).toBeInTheDocument();
  });
});
