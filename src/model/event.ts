// ---- events ----

export type EventOutcome =
  /** Negative loses gold (never below 0). */
  | { kind: 'gold'; value: number }
  /** Negative loses HP (never below 1). */
  | { kind: 'hp'; value: number }
  | { kind: 'maxHp'; value: number }
  | { kind: 'card'; cardId: string }
  /** A random card from the reward pool. */
  | { kind: 'randomCard' }
  /** A random relic you don't have yet. */
  | { kind: 'relic' }
  /** Fight these enemies (by id) now; the usual reward follows a win. */
  | { kind: 'fight'; enemies: string[] };

export interface EventChoice {
  label: string;
  outcomes: EventOutcome[];
}

/** A non-combat stop: some text and a few choices. */
export interface EventDefinition {
  id: string;
  title: string;
  text: string;
  choices: EventChoice[];
}
