/** Tiny Markdown helpers shared by the experiments. */

export function table(headers: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]): string => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
}

export const heading = (level: number, text: string): string => `${'#'.repeat(level)} ${text}`;

/** A horizontal text bar for histograms. */
export const bar = (count: number, max: number, width = 24): string => '#'.repeat(max === 0 ? 0 : Math.round((count / max) * width));

export interface ExperimentResult {
  name: string;
  /** Machine-readable form (same numbers as the Markdown). */
  json: unknown;
  markdown: string;
}

/** Round for JSON so reports diff cleanly. */
export const r6 = (x: number): number => (Number.isFinite(x) ? Math.round(x * 1e6) / 1e6 : x);

export const VERDICT_TEXT: Record<string, string> = {
  better: 'better',
  worse: 'worse',
  negligible: 'negligible',
  inconclusive: 'INCONCLUSIVE',
};
