import { describe, expect, it } from 'vitest';
import { gameKeyFrom } from './keyFilter';

const ev = (key: string, extra: Partial<Parameters<typeof gameKeyFrom>[0]> = {}) => ({
  key,
  repeat: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...extra,
});

describe('gameKeyFrom', () => {
  it('passes plain keys through, lower-cased', () => {
    expect(gameKeyFrom(ev('1'))).toBe('1');
    expect(gameKeyFrom(ev('D'))).toBe('d');
    expect(gameKeyFrom(ev('Enter'))).toBe('enter');
  });

  it('ignores held keys', () => {
    expect(gameKeyFrom(ev('e', { repeat: true }))).toBeNull();
  });

  it('ignores Ctrl, Meta and Alt chords', () => {
    for (const key of ['1', '5', 'd', 'e', 'D', 'E']) {
      expect(gameKeyFrom(ev(key, { ctrlKey: true }))).toBeNull();
      expect(gameKeyFrom(ev(key, { metaKey: true }))).toBeNull();
      expect(gameKeyFrom(ev(key, { altKey: true }))).toBeNull();
    }
  });
});
