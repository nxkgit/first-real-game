// The anonymous tester ID: made once, kept in the tester's browser, sent with every report so the
// maintainer can group a person's reports and follow up (QA_PLAN.md). The optional name they type
// is remembered here too, only so they don't have to retype it.

export interface TesterInfo {
  id: string;
  name: string;
}

/** The two storage calls this needs, so tests can pass a plain object. A missing or blocked store is handled. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const TESTER_KEY = 'deckbuilder.tester.v1';

/** `tester-` plus 12 random hex digits (matches the proxy's accepted ID shape). */
export function newTesterId(randomBytes: (length: number) => Uint8Array = (n) => crypto.getRandomValues(new Uint8Array(n))): string {
  const hex = [...randomBytes(6)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `tester-${hex}`;
}

function read(store: KeyValueStore | null): Partial<TesterInfo> {
  try {
    const text = store?.getItem(TESTER_KEY);
    const parsed: unknown = text ? JSON.parse(text) : null;
    if (typeof parsed === 'object' && parsed !== null) return parsed as Partial<TesterInfo>;
  } catch {
    // unreadable: treated as first visit
  }
  return {};
}

function write(store: KeyValueStore | null, tester: TesterInfo): void {
  try {
    store?.setItem(TESTER_KEY, JSON.stringify(tester));
  } catch {
    // storage blocked or full: the ID just won't survive a reload
  }
}

/** The stored tester, creating and storing an ID the first time. */
export function loadTester(store: KeyValueStore | null, makeId: () => string = newTesterId): TesterInfo {
  const saved = read(store);
  const id = typeof saved.id === 'string' && /^[a-z0-9-]{8,64}$/.test(saved.id) ? saved.id : makeId();
  const tester: TesterInfo = { id, name: typeof saved.name === 'string' ? saved.name : '' };
  if (saved.id !== id) write(store, tester);
  return tester;
}

/** Remembers the name the tester typed (an empty string forgets it). */
export function rememberName(store: KeyValueStore | null, tester: TesterInfo, name: string): TesterInfo {
  const updated = { ...tester, name };
  write(store, updated);
  return updated;
}

/** The browser's localStorage, or null where it is unavailable. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
