import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import EmptyState from './EmptyState'

import { renderWithProviders } from '@/test/render'

describe('<EmptyState />', () => {
  it('renders default title for resume type', () => {
    renderWithProviders(<EmptyState type="resume" />)
    expect(screen.getByText('공개된 이력서가 없습니다')).toBeInTheDocument()
  })

  it('renders query-aware title when query is provided', () => {
    renderWithProviders(<EmptyState type="search" query="foo" />)
    expect(screen.getByText(/foo/)).toBeInTheDocument()
    expect(screen.getByText(/결과가 없습니다/)).toBeInTheDocument()
  })

  it('renders primary action link for resume type', () => {
    renderWithProviders(<EmptyState type="resume" />)
    const link = screen.getByRole('link', { name: /이력서 만들기/ })
    expect(link).toHaveAttribute('href', '/resumes/new')
  })

  it('does not render actions for type without any (message)', () => {
    renderWithProviders(<EmptyState type="message" />)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  it('renders bookmark type with explore action', () => {
    renderWithProviders(<EmptyState type="bookmark" />)
    expect(screen.getByText('북마크한 이력서가 없습니다')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /이력서 탐색하기/ })
    expect(link).toHaveAttribute('href', '/explore')
  })

  it('exposes a status role so screen readers announce the empty state', () => {
    renderWithProviders(<EmptyState type="notification" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
