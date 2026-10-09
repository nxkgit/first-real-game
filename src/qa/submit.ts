import { REPORT_NAME_LIMIT, REPORT_TEXT_LIMIT } from './reportConfig';
import type { ReportSnapshot } from './snapshot';
import type { TesterInfo } from './tester';

// Sends a report to the proxy in worker/ (QA_PLAN.md). Plain TypeScript: the dialog supplies the
// fetch function, address and secret, so tests can stand in for the network.

export interface ReportDraft {
  text: string;
  name: string;
}

export interface SubmitDeps {
  fetch: typeof fetch;
  url: string;
  secret: string;
}

export type SubmitResult =
  | { ok: true; issue: number | null; snapshotId: string }
  | { ok: false; error: string; status?: number };

/** The words shown to the tester for each way a send can fail. */
function friendlyError(status: number): string {
  if (status === 401 || status === 403) return 'This build cannot send reports (it was not given the right key).';
  if (status === 413) return 'The report was too large to send.';
  if (status === 429) return 'Too many reports in the last hour. Please try again later.';
  if (status === 400) return 'The report was not accepted. Check the text and try again.';
  return 'The report could not be filed right now.';
}

/** Checks the draft the same way the proxy will, so most problems are caught before sending. */
export function checkDraft(draft: ReportDraft): string | null {
  if (draft.text.trim() === '') return 'Please describe what happened.';
  if (draft.text.length > REPORT_TEXT_LIMIT) return `Please keep it under ${REPORT_TEXT_LIMIT} characters.`;
  if (draft.name.length > REPORT_NAME_LIMIT) return `The name can be at most ${REPORT_NAME_LIMIT} characters.`;
  return null;
}

export async function submitReport(draft: ReportDraft, tester: TesterInfo, snapshot: ReportSnapshot, deps: SubmitDeps): Promise<SubmitResult> {
  const problem = checkDraft(draft);
  if (problem) return { ok: false, error: problem };
  if (deps.secret === '') return { ok: false, error: 'Reporting is not set up in this build.' };

  let res: Response;
  try {
    res = await deps.fetch(`${deps.url}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Report-Secret': deps.secret },
      body: JSON.stringify({ text: draft.text.trim(), name: draft.name.trim(), testerId: tester.id, build: snapshot.build, snapshot }),
    });
  } catch {
    return { ok: false, error: 'Could not reach the report server. Check your connection.' };
  }
  if (!res.ok) return { ok: false, status: res.status, error: friendlyError(res.status) };
  try {
    const out = (await res.json()) as { issue?: number | null; snapshotId?: string };
    return { ok: true, issue: out.issue ?? null, snapshotId: out.snapshotId ?? '' };
  } catch {
    return { ok: true, issue: null, snapshotId: '' };
  }
}

/** Everything in a form the tester can paste into a message by hand if sending fails, so nothing they wrote is lost. */
export function reportAsText(draft: ReportDraft, tester: TesterInfo, snapshot: ReportSnapshot): string {
  return [
    'Bug report (could not be sent automatically)',
    `Tester: ${tester.id}${draft.name.trim() ? ` (${draft.name.trim()})` : ''}`,
    `Build: ${snapshot.build}`,
    '',
    draft.text.trim(),
    '',
    'Snapshot:',
    JSON.stringify(snapshot),
  ].join('\n');
}
