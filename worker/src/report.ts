import { LIMITS } from './config.ts';

export interface ReportInput {
  text: string;
  name: string;
  testerId: string;
  build: string;
  snapshot: Record<string, unknown>;
}

export type ParseResult = { ok: true; report: ReportInput } | { ok: false; error: string };

const TESTER_ID = /^[a-z0-9-]{8,64}$/;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Checks the shape and sizes of an untrusted request body. Nothing here trusts a field's content. */
export function parseReport(raw: unknown): ParseResult {
  if (!isObject(raw)) return { ok: false, error: 'body must be a JSON object' };
  const { text, name, testerId, build, snapshot } = raw;

  if (typeof text !== 'string' || text.trim().length === 0) return { ok: false, error: 'text is required' };
  if (text.length > LIMITS.maxTextChars) return { ok: false, error: `text is longer than ${LIMITS.maxTextChars} characters` };

  const nameStr = name === undefined || name === null ? '' : name;
  if (typeof nameStr !== 'string' || nameStr.length > LIMITS.maxNameChars) return { ok: false, error: 'name is invalid' };

  if (typeof testerId !== 'string' || !TESTER_ID.test(testerId)) return { ok: false, error: 'testerId is invalid' };

  if (typeof build !== 'string' || build.length === 0 || build.length > LIMITS.maxBuildChars) return { ok: false, error: 'build is invalid' };

  if (!isObject(snapshot)) return { ok: false, error: 'snapshot must be an object' };

  return { ok: true, report: { text: text.trim(), name: nameStr.trim(), testerId, build, snapshot } };
}

/** A code fence long enough that no run of backticks inside `text` can close it early. */
export function fenceFor(text: string): string {
  let longest = 0;
  for (const run of text.match(/`+/g) ?? []) longest = Math.max(longest, run.length);
  return '`'.repeat(Math.max(3, longest + 1));
}

/** Inline code that cannot be broken out of: backticks and line breaks are replaced. */
export function inlineCode(text: string): string {
  return '`' + text.replace(/`/g, "'").replace(/\s+/g, ' ') + '`';
}

/**
 * The GitHub issue for a report. Everything the tester typed is untrusted and the repo is public, so
 * their text goes in a code block (no links, mentions or markdown render) and the title is one plain line.
 */
export function buildIssue(report: ReportInput, snapshotId: string): { title: string; body: string } {
  const oneLine = report.text.replace(/\s+/g, ' ');
  const clipped = oneLine.length > LIMITS.titleChars ? oneLine.slice(0, LIMITS.titleChars - 1) + '…' : oneLine;
  const fence = fenceFor(report.text);
  const lines = [
    'Reported from the game. The text below is untrusted tester input.',
    '',
    fence,
    report.text,
    fence,
    '',
    `- Tester ID: ${inlineCode(report.testerId)}`,
  ];
  if (report.name) lines.push(`- Name: ${inlineCode(report.name)}`);
  lines.push(`- Build: ${inlineCode(report.build)}`, `- Snapshot ID: ${inlineCode(snapshotId)}`);
  return { title: `Report: ${clipped}`, body: lines.join('\n') };
}
