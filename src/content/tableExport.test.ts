import { describe, expect, it } from 'vitest';
import { toCsv, toMarkdown } from './tableExport';
import type { Table } from './tableExport';

const TABLE: Table = {
  id: 't',
  title: 'Things',
  headers: ['Name', 'Text'],
  rows: [
    ['Strike', 'Deal 6 damage.'],
    ['Odd | one', 'Has "quotes", a comma,\nand a line break'],
  ],
};

describe('table export', () => {
  it('writes a Markdown table with a heading, escaping pipes and line breaks', () => {
    expect(toMarkdown(TABLE)).toBe(
      ['## Things', '', '| Name | Text |', '| --- | --- |', '| Strike | Deal 6 damage. |', '| Odd \| one | Has "quotes", a comma, and a line break |'].join('\n')
    );
  });

  it('writes CSV, quoting cells that need it', () => {
    expect(toCsv(TABLE)).toBe('Name,Text\nStrike,Deal 6 damage.\nOdd | one,"Has ""quotes"", a comma,\nand a line break"');
  });
});
