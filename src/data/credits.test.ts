import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CREDITS } from './credits';

// public/assets/CREDITS.md is the copy people read on GitHub and on the site; credits.ts feeds the
// in-game screen. They must list the same packs, or an attribution gets lost.

const rows = readFileSync('public/assets/CREDITS.md', 'utf8')
  .split('\n')
  .filter((line) => line.startsWith('|') && !line.startsWith('| Used for') && !line.startsWith('|---'))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

describe('credits', () => {
  it('has the same rows in credits.ts and CREDITS.md', () => {
    const fromData = CREDITS.map((c) => [c.usedFor, `${c.source}, ${c.url}`, c.author, c.licence]);
    expect(rows).toEqual(fromData);
  });

  it('gives every row a source, author and licence, with a web address', () => {
    for (const c of CREDITS) {
      expect(c.usedFor, c.source).not.toBe('');
      expect(c.author, c.source).not.toBe('');
      expect(c.licence, c.source).not.toBe('');
      expect(c.url, c.source).toMatch(/^https:\/\//);
    }
  });
});
