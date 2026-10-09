// Reads PATCHNOTES.md (one `## ` entry per batch of fixes, newest first, see docs/QA_FIX_WORKFLOW.md)
// for the content site, and keeps the "Latest changes" block of README.md in step with the newest
// entry. Plain TypeScript, no browser: the content page draws what this returns.

export interface PatchBlock {
  kind: 'paragraph' | 'list';
  /** One line of text each (a paragraph has exactly one). May contain `code` spans. */
  items: string[];
}

export interface PatchSection {
  /** The `### ` heading ("Fixed", "Not fixed", "Checked"), or null for text before the first one. */
  title: string | null;
  blocks: PatchBlock[];
}

export interface PatchEntry {
  /** The `## ` heading text, e.g. "2026-10-09 (fix commit 55f2f04)". */
  heading: string;
  /** The entry exactly as written, heading line included, for copying into the README. */
  markdown: string;
  sections: PatchSection[];
}

const normalize = (text: string): string => text.replace(/\r\n/g, '\n');

/** Every entry in the file, in file order (newest first). Anything before the first `## ` heading is ignored. */
export function parsePatchNotes(markdown: string): PatchEntry[] {
  const lines = normalize(markdown).split('\n');
  const entries: PatchEntry[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (const line of lines) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) {
      if (current) entries.push(toEntry(current));
      current = { heading: heading[1]!.trim(), lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) entries.push(toEntry(current));
  return entries;
}

function toEntry(raw: { heading: string; lines: string[] }): PatchEntry {
  const sections: PatchSection[] = [{ title: null, blocks: [] }];
  let list: PatchBlock | null = null;
  for (const line of raw.lines.slice(1)) {
    const sub = /^### (.+)$/.exec(line);
    if (sub) {
      sections.push({ title: sub[1]!.trim(), blocks: [] });
      list = null;
      continue;
    }
    const section = sections[sections.length - 1]!;
    const bullet = /^\s*[-*] (.+)$/.exec(line);
    if (bullet) {
      if (!list) {
        list = { kind: 'list', items: [] };
        section.blocks.push(list);
      }
      list.items.push(bullet[1]!.trim());
    } else if (line.trim() === '') {
      list = null;
    } else {
      list = null;
      section.blocks.push({ kind: 'paragraph', items: [line.trim()] });
    }
  }
  return {
    heading: raw.heading,
    markdown: raw.lines.join('\n').replace(/\s+$/, ''),
    sections: sections.filter((s) => s.title !== null || s.blocks.length > 0),
  };
}

// ---- README sync ----

export const README_START = '<!-- patchnotes:start -->';
export const README_END = '<!-- patchnotes:end -->';

/** The README with the text between its two markers replaced by the newest entry. Throws a plain message if the README has no markers or the notes have no entry. */
export function syncReadme(readme: string, patchNotes: string): string {
  const latest = parsePatchNotes(patchNotes)[0];
  if (!latest) throw new Error('PATCHNOTES.md has no "## " entry to show.');
  const text = normalize(readme);
  const start = text.indexOf(README_START);
  const end = text.indexOf(README_END);
  if (start < 0 || end < start) throw new Error(`README.md needs ${README_START} and ${README_END} around the latest changes.`);
  return `${text.slice(0, start + README_START.length)}\n${latest.markdown}\n${text.slice(end)}`;
}

/** True when the README already shows the newest entry (what `npm run patchnotes:sync` would write). */
export function readmeIsCurrent(readme: string, patchNotes: string): boolean {
  try {
    return normalize(readme) === syncReadme(readme, patchNotes);
  } catch {
    return false;
  }
}
