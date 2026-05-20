import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn (className util)', () => {
  it('joins string classes with single spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('skips falsy values', () => {
    expect(cn('a', false, null, undefined, 0, '', 'b')).toBe('a b');
  });

  it('returns empty string when all inputs are falsy', () => {
    expect(cn(false, null, undefined, 0, '')).toBe('');
  });

  it('handles single class', () => {
    expect(cn('btn')).toBe('btn');
  });

  it('supports conditional ternary expressions', () => {
    const active = true;
    const disabled = false;
    expect(cn('btn', active && 'btn--active', disabled ? 'opacity-50' : null)).toBe(
      'btn btn--active',
    );
  });

  it('preserves order of inputs', () => {
    expect(cn('c', 'a', 'b')).toBe('c a b');
  });

  it('treats number 0 as falsy but other numbers as truthy', () => {
    // 0 은 falsy → skip, 다른 number 는 toString
    expect(cn(0, 1)).toBe('1');
  });
});
