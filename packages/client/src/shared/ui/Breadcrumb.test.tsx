import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import Breadcrumb from './Breadcrumb';
import { renderWithProviders } from '@/test/render';

describe('<Breadcrumb />', () => {
  it('renders nav with breadcrumb label', () => {
    renderWithProviders(<Breadcrumb items={[{ label: 'Foo' }]} />);
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
  });

  it('always renders the home link', () => {
    renderWithProviders(<Breadcrumb items={[{ label: 'Foo' }]} />);
    const homeLink = screen.getByRole('link', { name: '홈' });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('marks the last crumb with aria-current="page"', () => {
    renderWithProviders(<Breadcrumb items={[{ label: 'A', to: '/a' }, { label: 'B' }]} />);
    const current = screen.getByText('B');
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('renders intermediate crumbs as Links', () => {
    renderWithProviders(<Breadcrumb items={[{ label: 'A', to: '/a' }, { label: 'B' }]} />);
    expect(screen.getByRole('link', { name: 'A' })).toHaveAttribute('href', '/a');
  });

  it('renders single label as text when last (no to)', () => {
    renderWithProviders(<Breadcrumb items={[{ label: 'Only' }]} />);
    expect(screen.queryByRole('link', { name: 'Only' })).toBeNull();
    expect(screen.getByText('Only')).toHaveAttribute('aria-current', 'page');
  });
});
