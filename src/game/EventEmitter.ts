type Listener<T> = (payload: T) => void;

/**
 * Minimal typed event emitter with no dependencies, so the game-logic layer
 * stays independent of Phaser (see CLAUDE.md's logic/rendering separation).
 */
export class EventEmitter<EventMap extends object> {
  private listeners: { [K in keyof EventMap]?: Listener<EventMap[K]>[] } = {};

  on<K extends keyof EventMap>(event: K, listener: Listener<EventMap[K]>): void {
    const list = this.listeners[event] ?? (this.listeners[event] = []);
    list.push(listener);
  }

  protected emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }
}
