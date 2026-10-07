/** The bits of a keyboard event the game keys care about (so this can be tested without a browser). */
export interface KeyEventLike {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/**
 * The game key to act on for a keydown, or null to ignore it. Held keys and chords with Ctrl, Meta
 * or Alt (browser shortcuts such as Ctrl+D, Ctrl+E, Alt+1) are ignored so they never play cards.
 */
export function gameKeyFrom(event: KeyEventLike): string | null {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return null;
  return event.key.toLowerCase();
}
