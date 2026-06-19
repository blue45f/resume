import { afterEach, describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from '@/lib/share'
import { shareResultMessage } from '@/lib/share/shareResultMessage'

describe('shareResultMessage', () => {
  it('maps each result to a tone, omitting the toast on user dismissal', () => {
    expect(shareResultMessage('shared')).toEqual({ text: '공유했습니다', tone: 'success' })
    expect(shareResultMessage('copied')).toEqual({
      text: '링크를 클립보드에 복사했습니다',
      tone: 'success',
    })
    expect(shareResultMessage('dismissed')).toEqual({ text: null, tone: 'info' })
    expect(shareResultMessage('unsupported').tone).toBe('warning')
  })
})

describe('shareOrCopy', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    const result = await shareOrCopy({ title: 'T', url: 'https://example.com/x' })
    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith({
      title: 'T',
      text: undefined,
      url: 'https://example.com/x',
    })
  })

  it('treats an AbortError (user closed the sheet) as dismissed', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('canceled', 'AbortError'))
    vi.stubGlobal('navigator', { share })
    expect(await shareOrCopy({ url: 'https://example.com/x' })).toBe('dismissed')
  })

  it('falls back to clipboard copy when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const result = await shareOrCopy({ title: 'Hi', url: 'https://example.com/y' })
    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('Hi — https://example.com/y')
  })
})
