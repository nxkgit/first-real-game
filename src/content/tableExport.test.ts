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
      ['## Things', '', '| Name | Text |', '| --- | --- |', '| Strike | Deal 6 damage. |', '| Odd \\| one | Has "quotes", a comma, and a line break |'].join('\n')
    );
  });

  it('escapes pipes in headers, backslashes, and every kind of line break', () => {
    const t: Table = { id: 'x', title: 'T', headers: ['A|B'], rows: [['a\\b'], ['a\\|b'], ['one\r\ntwo'], ['one\rtwo'], ['one\ntwo\n']] };
    expect(toMarkdown(t).split('\n').slice(2)).toEqual(['| A\\|B |', '| --- |', '| a\\\\b |', '| a\\\\\\|b |', '| one two |', '| one two |', '| one two  |']);
  });

  it('writes CSV, quoting cells that need it', () => {
    expect(toCsv(TABLE)).toBe('Name,Text\nStrike,Deal 6 damage.\nOdd | one,"Has ""quotes"", a comma,\nand a line break"');
  });
});
