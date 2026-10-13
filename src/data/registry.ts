// A content table: rows with a unique `id`, looked up by it. Every content kind (cards, enemies, relics,
// events, heroes) is one of these, the way a database table has a primary key; rows refer to each other
// by id (a card's `owner` is a hero id, a save stores ids). Building one here checks that no id is used
// twice and gives every table the same `get` that fails loudly on an unknown id.

export interface Registry<T extends { id: string }> {
  /** Every row, in the order given. */
  readonly all: readonly T[];
  /** Rows by id. */
  readonly byId: Readonly<Record<string, T>>;
  /** The row with this id; throws `unknown <label> id: <id>` if there is none. */
  get(id: string): T;
  /** The row with this id, or undefined. Accepts anything so untrusted input (a save, a URL) can be checked directly. */
  find(id: unknown): T | undefined;
}

/** Builds a registry from `rows`. `label` ("card", "enemy", ...) names the table in error messages. */
export function createRegistry<T extends { id: string }>(label: string, rows: readonly T[]): Registry<T> {
  const byId: Record<string, T> = Object.fromEntries(rows.map((row): [string, T] => [row.id, row]));
  if (Object.keys(byId).length !== rows.length) throw new Error(`duplicate ${label} id`);
  return {
    all: rows,
    byId,
    get(id) {
      const row = byId[id];
      if (!row) throw new Error(`unknown ${label} id: ${id}`);
      return row;
    },
    find: (id) => (typeof id === 'string' ? byId[id] : undefined),
  };
}
