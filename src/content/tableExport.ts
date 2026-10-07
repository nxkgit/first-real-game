/** A table of text, as the content browser shows it and exports it. */
export interface Table {
  id: string;
  title: string;
  note?: string;
  headers: string[];
  rows: string[][];
}

const escapeCell = (text: string): string => text.replace(/\|/g, '\|').replace(/\n/g, ' ');

/** A Markdown table with a heading, ready to paste into a document. */
export function toMarkdown(table: Table): string {
  const line = (cells: string[]): string => `| ${cells.map(escapeCell).join(' | ')} |`;
  return [`## ${table.title}`, '', line(table.headers), line(table.headers.map(() => '---')), ...table.rows.map(line)].join('\n');
}

/** CSV text for a spreadsheet; cells with commas, quotes or line breaks are quoted. */
export function toCsv(table: Table): string {
  const cell = (text: string): string => (/[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text);
  return [table.headers, ...table.rows].map((row) => row.map(cell).join(',')).join('\n');
}
