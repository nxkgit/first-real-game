import type { RunState } from './game/RunState';
import { buildRunReport } from './game/runReport';
import type { RunReport } from './game/runReport';
import { restoreSavedRun } from './data/run';

// Browser storage for the current run and for finished-run reports. Every access is wrapped:
// storage can be missing, full, or blocked (private windows), and the game must still play.

const RUN_KEY = 'deckbuilder.run.v1';
const HISTORY_KEY = 'deckbuilder.history.v1';
const HISTORY_LIMIT = 20;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // nothing to do: the run just won't be remembered
  }
}

export function saveRun(run: RunState): void {
  write(RUN_KEY, JSON.stringify(run.toSaved()));
}

export function clearSavedRun(): void {
  write(RUN_KEY, null);
}

/** The stored run, or null if there is none or it can't be used (it is then discarded). */
export function loadSavedRun(): RunState | null {
  const text = read(RUN_KEY);
  if (text === null) return null;
  let run: RunState | null = null;
  try {
    run = restoreSavedRun(JSON.parse(text));
  } catch {
    run = null;
  }
  if (!run || run.phase === 'won' || run.phase === 'lost') clearSavedRun();
  return run && run.phase !== 'won' && run.phase !== 'lost' ? run : null;
}

/** Keeps the report of a finished run (newest last), so a playtester can send back several. */
export function recordFinishedRun(run: RunState): void {
  const history = loadReportHistory();
  history.push(buildRunReport(run));
  write(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_LIMIT)));
}

export function loadReportHistory(): RunReport[] {
  const text = read(HISTORY_KEY);
  if (text === null) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as RunReport[]) : [];
  } catch {
    return [];
  }
}

/** Copies text to the clipboard. Returns whether it worked. Must be called from a click or key press. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers, or an insecure page: fall back to a hidden text box
    try {
      const box = document.createElement('textarea');
      box.value = text;
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      const ok = document.execCommand('copy');
      box.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
