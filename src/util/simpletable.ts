// src/util/simpletable.ts
/**
 * Minimal replacement for cli-ux's cli.table. cli-ux has been deprecated for some time. 
 * A temporary solution was added to oclif core, but that will be removed in version 4.
 * 
 * This function has an interface such that it can replace cli.table with minimal changes.
 * 
 * It prints the tables in a style slightly different from cli-ux, using dashes instead of
 * borderdrawing glyphs, and using two spaces as column separators.
 * 
 *
 *  Id  Name      Age
 *  --  --------  ---
 *  1   Johh      27
 *  2   Randolph  45
 *  3   Alice     30
 */

import { table } from 'table';

type Align = 'left' | 'right';

export type SimpleColumn<T> = {
  /** Override header label (defaults to the column key) */
  header?: string;
  /** Pull value from row (defaults to row[key]) */
  get?: (row: T) => unknown;
  /** 'left' (default) or 'right' */
  align?: Align;
  /** Minimum width to enforce for this column */
  minWidth?: number;
};

export type SimpleColumnsSpec<T> = Record<string, SimpleColumn<T>>;

export type SimpleTableOptions = {
  /** Called for each line (defaults to console.log) */
  printLine?: (line: string) => void;
  /** Limit to these columns (order respected). If omitted, uses spec order. */
  columns?: string[];
};

function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  // keep it plain; escape newlines so each record stays on one row
  return String(v).replace(/\r?\n/g, '\\n');
}

/**
 * Print a simple ASCII table (header + dashed underline, no borders).
 */
export function simpletable<T>(
  rows: T[],
  spec: SimpleColumnsSpec<T>,
  opts: SimpleTableOptions = {},
): void {
  const printLine = opts.printLine ?? ((s: string) => console.log(s));

  // Column order: opts.columns, else spec order as given
  const specKeys = opts.columns && opts.columns.length > 0
    ? opts.columns
    : Object.keys(spec);

  // Build headers and cell matrix (as strings)
  const headers = specKeys.map((key) => spec[key]?.header ?? key);

  const getCell = (key: string, row: T) => {
    const c = spec[key] ?? {};
    const val = c.get ? c.get(row) : (row as any)[key];
    return str(val);
  };

  const body = rows.map((r) => specKeys.map((k) => getCell(k, r)));

  // Compute widths (header and all rows), apply minWidth if given
  const widths = specKeys.map((key, i) => {
    const min = spec[key]?.minWidth ?? 0;
    const maxBody = body.reduce((m, row) => Math.max(m, row[i].length), 0);
    return Math.max(headers[i].length, maxBody, min);
  });

  // Alignment per column (left default, right for numbers if align not set)
  const aligns: Align[] = specKeys.map((key, i) => {
    const a = spec[key]?.align;
    if (a) return a;
    // heuristic: if all cells (ignoring blanks) are numeric, right-align
    const numeric = body
      .map((r) => r[i])
      .filter((s) => s !== '')
      .every((s) => /^-?\d+(\.\d+)?$/.test(s));
    return numeric ? 'right' : 'left';
  });

  // Helper to render a single row with fixed widths and 2-space separators
  const renderRow = (cells: string[]) => {
    // use gajus/table for proper padding without borders
    const out = table([cells], {
      // borderless; horizontal/vertical lines disabled
      border: undefined,
      drawVerticalLine: () => false,
      drawHorizontalLine: () => false,
      columnDefault: { paddingLeft: 0, paddingRight: 2 },
      columns: Object.fromEntries(
        widths.map((w, idx) => [
          idx,
          {
            width: w,
            alignment: aligns[idx] === 'right' ? 'right' : 'left',
          },
        ]),
      ),
    }).replace(/\n$/, ''); // single row -> strip trailing newline
    return out;
  };

  const headerLine = renderRow(headers);

  // Underline: ASCII dashes matching visual column widths, with 2-space gaps
  const underline =
    widths.map((w) => '-'.repeat(w)).join('  ');

  // Body lines
  const bodyLines = body.map(renderRow);

  // Print
  printLine(headerLine);
  printLine(underline);
  for (const ln of bodyLines) printLine(ln);
}

export default simpletable;
