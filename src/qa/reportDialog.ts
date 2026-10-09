import { copyToClipboard } from '../storage';
import { REPORT_NAME_LIMIT, REPORT_SECRET, REPORT_TEXT_LIMIT, REPORT_URL } from './reportConfig';
import type { ReportSnapshot, SnapshotEnvironment } from './snapshot';
import { checkDraft, reportAsText, submitReport } from './submit';
import type { SubmitDeps } from './submit';
import { browserStore, loadTester, rememberName } from './tester';

// The "Report a problem" window (QA_PLAN.md). It is plain DOM laid over the page, like the dev
// panel, because a canvas cannot take typed text. The scene's Report button calls `openReportDialog`.
// Elements carry `data-report="..."` so the browser tests can find them.

let open: HTMLElement | null = null;

/** Where the tester is and what they are using, for the snapshot. */
export function browserEnvironment(): SnapshotEnvironment {
  return {
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    devicePixelRatio: window.devicePixelRatio,
    url: `${window.location.pathname}${window.location.search}`,
  };
}

const css = (el: HTMLElement, style: string): void => {
  el.style.cssText = style;
};
const FIELD = 'width:100%;box-sizing:border-box;background:#1b1b24;color:#fff;border:1px solid #5a5a72;border-radius:4px;padding:6px;font:14px system-ui,sans-serif;';
const BUTTON = 'font:14px system-ui,sans-serif;cursor:pointer;color:#fff;border:1px solid #5a5a72;border-radius:4px;padding:6px 14px;';

export interface ReportDialogOptions {
  /** Called when the window opens, so the snapshot shows the game as it was then. */
  getSnapshot: () => ReportSnapshot;
  /** Replaceable for tests; the real network, address and secret by default. */
  deps?: SubmitDeps;
}

export function openReportDialog(options: ReportDialogOptions): void {
  if (open) return;
  const snapshot = options.getSnapshot();
  const deps: SubmitDeps = options.deps ?? { fetch: (...args) => fetch(...args), url: REPORT_URL, secret: REPORT_SECRET };
  const store = browserStore();
  let tester = loadTester(store);

  const backdrop = document.createElement('div');
  backdrop.dataset.report = 'dialog';
  css(backdrop, 'position:fixed;inset:0;z-index:900;background:rgba(8,8,12,0.8);display:flex;align-items:center;justify-content:center;');
  // Phaser listens for mouse and touch on the whole page, so a click on this window would also reach
  // the game underneath (it played a card when Send was pressed mid-fight). Keep every pointer
  // event inside the window.
  for (const type of ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'click', 'dblclick', 'wheel']) {
    backdrop.addEventListener(type, (event) => event.stopPropagation());
  }
  const box = document.createElement('div');
  css(box, 'width:min(440px,92vw);background:#1b1b24;color:#d8d8e4;border:2px solid #5a5a72;border-radius:8px;padding:16px;font:14px system-ui,sans-serif;');

  const heading = document.createElement('div');
  heading.textContent = 'Report a problem';
  css(heading, 'font-size:20px;font-weight:bold;color:#fff;margin-bottom:6px;');
  const hint = document.createElement('div');
  hint.textContent = 'Tell us what happened and what you expected. The game state is sent with it so we can see exactly where you were.';
  css(hint, 'color:#9a9aae;margin-bottom:10px;font-size:13px;');

  const text = document.createElement('textarea');
  text.dataset.report = 'text';
  text.rows = 6;
  text.maxLength = REPORT_TEXT_LIMIT;
  text.placeholder = 'What happened?';
  css(text, FIELD + 'resize:vertical;');
  const count = document.createElement('div');
  css(count, 'text-align:right;color:#777788;font-size:12px;margin:2px 0 8px;');
  const name = document.createElement('input');
  name.dataset.report = 'name';
  name.maxLength = REPORT_NAME_LIMIT;
  name.placeholder = 'Your name (optional)';
  name.value = tester.name;
  css(name, FIELD);

  const status = document.createElement('div');
  status.dataset.report = 'status';
  css(status, 'min-height:18px;margin:10px 0;color:#9fd3ff;');

  const buttons = document.createElement('div');
  css(buttons, 'display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;');
  const send = document.createElement('button');
  send.dataset.report = 'send';
  send.textContent = 'Send';
  css(send, BUTTON + 'background:#2b6b3d;border-color:#4fae6f;');
  const copy = document.createElement('button');
  copy.dataset.report = 'copy';
  copy.textContent = 'Copy report text';
  css(copy, BUTTON + 'background:#2a2a3a;display:none;');
  const cancel = document.createElement('button');
  cancel.dataset.report = 'cancel';
  cancel.textContent = 'Cancel';
  css(cancel, BUTTON + 'background:#2a2a3a;');

  const say = (message: string, bad = false): void => {
    status.textContent = message;
    status.style.color = bad ? '#ff9a9a' : '#9fd3ff';
  };
  const updateCount = (): void => {
    count.textContent = `${text.value.length}/${REPORT_TEXT_LIMIT}`;
  };
  updateCount();
  text.addEventListener('input', updateCount);

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') close();
  };
  function close(): void {
    window.removeEventListener('keydown', onKey);
    backdrop.remove();
    open = null;
  }
  window.addEventListener('keydown', onKey);
  cancel.onclick = close;

  copy.onclick = () => {
    const draft = { text: text.value, name: name.value };
    void copyToClipboard(reportAsText(draft, tester, snapshot)).then((ok) =>
      say(ok ? 'Copied. Paste it into a message to the developer.' : 'Could not copy. Select the text box and copy your message by hand.', !ok),
    );
  };

  send.onclick = () => {
    const draft = { text: text.value, name: name.value };
    const problem = checkDraft(draft);
    if (problem) return say(problem, true);
    send.disabled = true;
    say('Sending...');
    tester = rememberName(store, tester, draft.name.trim());
    void submitReport(draft, tester, snapshot, deps).then((result) => {
      if (result.ok) {
        say(result.issue === null ? 'Thank you! Your report was sent.' : `Thank you! Your report was sent (#${result.issue}).`);
        send.style.display = 'none';
        copy.style.display = 'none';
        cancel.textContent = 'Close';
        text.disabled = true;
        name.disabled = true;
      } else {
        say(result.error, true);
        send.disabled = false;
        copy.style.display = ''; // nothing the tester wrote is lost: they can still copy it
      }
    });
  };

  buttons.append(copy, cancel, send);
  box.append(heading, hint, text, count, name, status, buttons);
  backdrop.append(box);
  document.body.appendChild(backdrop);
  open = backdrop;
  text.focus();
}

/** True while the window is up (the scenes' hotkeys already ignore typing in it). */
export function isReportDialogOpen(): boolean {
  return open !== null;
}
