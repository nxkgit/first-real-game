import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { README_END, README_START, parsePatchNotes, readmeIsCurrent, syncReadme } from './patchNotes';

const NOTES = `# Patch notes

Intro text that is not an entry.

## 2026-10-09 (fix commit abc1234)

### Fixed
- #7 (game breaking): the button no longer covers the \`intent\`.
- #8 (fix soon): another fix.

### Not fixed
- Nothing.

Checked: everything.

## 2026-10-01 (fix commit 0000000)

### Fixed
- #1 (eventually): an older fix.
`;

describe('parsePatchNotes', () => {
  it('finds each entry, newest first, and ignores the intro', () => {
    const entries = parsePatchNotes(NOTES);
    expect(entries.map((e) => e.heading)).toEqual(['2026-10-09 (fix commit abc1234)', '2026-10-01 (fix commit 0000000)']);
  });

  it('splits an entry into titled sections of lists and paragraphs', () => {
    const [latest] = parsePatchNotes(NOTES);
    expect(latest!.sections.map((s) => s.title)).toEqual(['Fixed', 'Not fixed']);
    expect(latest!.sections[0]!.blocks).toEqual([
      { kind: 'list', items: ['#7 (game breaking): the button no longer covers the `intent`.', '#8 (fix soon): another fix.'] },
    ]);
    // text after a list, with no new heading, stays in the section it follows
    expect(latest!.sections[1]!.blocks).toEqual([
      { kind: 'list', items: ['Nothing.'] },
      { kind: 'paragraph', items: ['Checked: everything.'] },
    ]);
  });

  it('keeps each entry as written, heading included, with no trailing blank lines', () => {
    const [latest] = parsePatchNotes(NOTES);
    expect(latest!.markdown.startsWith('## 2026-10-09 (fix commit abc1234)\n\n### Fixed')).toBe(true);
    expect(latest!.markdown.endsWith('Checked: everything.')).toBe(true);
  });

  it('copes with Windows line endings and an empty file', () => {
    expect(parsePatchNotes(NOTES.replace(/\n/g, '\r\n'))).toEqual(parsePatchNotes(NOTES));
    expect(parsePatchNotes('')).toEqual([]);
    expect(parsePatchNotes('# Patch notes\n\nNo entries yet.')).toEqual([]);
  });
});

describe('syncReadme', () => {
  const README = `# Game\n\n## Latest changes\n\n${README_START}\nold text\n${README_END}\n\nMore text.\n`;

  it('puts the newest entry between the markers and leaves the rest alone', () => {
    const out = syncReadme(README, NOTES);
    expect(out).toContain(`${README_START}\n## 2026-10-09 (fix commit abc1234)`);
    expect(out).toContain(`Checked: everything.\n${README_END}\n\nMore text.`);
    expect(out).not.toContain('old text');
    expect(out).not.toContain('2026-10-01');
    expect(out.startsWith('# Game\n\n## Latest changes\n\n')).toBe(true);
  });

  it('is stable: syncing twice changes nothing more', () => {
    const once = syncReadme(README, NOTES);
    expect(syncReadme(once, NOTES)).toBe(once);
    expect(readmeIsCurrent(once, NOTES)).toBe(true);
    expect(readmeIsCurrent(README, NOTES)).toBe(false);
  });

  it('says plainly what is missing instead of guessing', () => {
    expect(() => syncReadme('# no markers', NOTES)).toThrow('needs');
    expect(() => syncReadme(README, '# nothing here')).toThrow('no "## " entry');
    expect(readmeIsCurrent('# no markers', NOTES)).toBe(false);
  });
});

describe('the real files', () => {
  const notes = readFileSync('PATCHNOTES.md', 'utf8');
  const readme = readFileSync('README.md', 'utf8');

  it('PATCHNOTES.md has entries headed by a date, each with a Fixed or Not fixed section', () => {
    const entries = parsePatchNotes(notes);
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.heading, 'heading starts with a date').toMatch(/^\d{4}-\d{2}-\d{2}/);
      const titles = entry.sections.map((s) => s.title);
      expect(titles.includes('Fixed') || titles.includes('Not fixed'), `${entry.heading} has Fixed or Not fixed`).toBe(true);
    }
  });

  it('README.md shows the newest PATCHNOTES.md entry (run npm run patchnotes:sync if this fails)', () => {
    expect(readmeIsCurrent(readme, notes)).toBe(true);
  });
});
