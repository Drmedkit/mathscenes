// placement.ts: the check-in adapter (docs/lessons/QUALITY_LAYER.md): a percent of a row group read from a two-way
// count table (the table is drawn by figure()), the overall percent from a conditional and a joint percent (stands
// alone; short prompts only), and a circle-graph angle from the table's totals (figure). Exact answers only: no
// "round to the nearest tenth" items, which need a calculator.
import type { Placement } from '../../placement/types';
import { type Item, plain } from '../../runtime/item';
import type { TableSpec } from './TwoWayTable';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** the two-way table as a small SVG: row and column labels, the counts (or percents), the totals row and column */
export function tableSvg(t: TableSpec): string {
  const R = t.rows.length, C = t.cols.length, m = t.margins;
  const rows = [...t.rows, ...(m ? [t.totalLabel ?? 'Total'] : [])], cols = [...t.cols, ...(m ? [t.totalLabel ?? 'Total'] : [])];
  const lw = Math.max(90, ...rows.map(s => s.length * 8.4 + 20)), cw = Math.max(76, ...cols.map(s => s.length * 8.4 + 16)), h = 34;
  const W = Math.round(lw + cw * cols.length + 2), H = h * (rows.length + 1) + 2;
  const hide = new Set(t.hide ?? []);
  const val = (v: number | null) => (v === null ? '' : t.fmt === 'pct' ? `${v.toFixed(t.d ?? 0)}%` : v >= 10000 ? v.toLocaleString('en-US') : String(v));
  const out: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="sans-serif" font-size="15">`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="6" fill="#232850" stroke="#efe6f7" stroke-opacity="0.5"/>`];
  const text = (x: number, y: number, s: string, o = '') => out.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="#efe6f7" text-anchor="middle"${o}>${esc(s)}</text>`);
  cols.forEach((c, j) => text(lw + cw * j + cw / 2, h * 0.68, c, ' font-weight="600"'));
  rows.forEach((r, i) => {
    const y = h * (i + 1);
    out.push(`<line x1="1" y1="${y}" x2="${W - 1}" y2="${y}" stroke="#efe6f7" stroke-opacity="${m && i === R ? 0.6 : 0.25}"/>`);
    text(lw / 2, y + h * 0.68, r, ' font-weight="600"');
    cols.forEach((_, j) => {
      const k = `${i},${j}`, x = lw + cw * j + cw / 2;
      if (hide.has(k)) text(x, y + h * 0.68, '?', ' fill="#ffbe5c" font-weight="700"');
      else text(x, y + h * 0.68, val(t.vals[i]?.[j] ?? null), m && (i === R || j === C) ? ' fill-opacity="0.8"' : '');
    });
  });
  cols.forEach((_, j) => out.push(`<line x1="${(lw + cw * j).toFixed(1)}" y1="1" x2="${(lw + cw * j).toFixed(1)}" y2="${H - 1}" stroke="#efe6f7" stroke-opacity="${m && j === C ? 0.6 : 0.25}"/>`));
  out.push('</svg>');
  return out.join('');
}
const tableOf = (it: Item): TableSpec | null => {
  const p = (it as Item & { picture?: { pic?: { kind?: string; table?: TableSpec } } }).picture?.pic;
  return p?.kind === 'table' && p.table ? p.table : null;
};
export const PLACEMENT: Placement = {
  picks: [
    { subgoal: 'conditional-both-directions', family: 'rowPct' },
    { subgoal: 'complete-rf-table', family: 'fromConditional', standalone: true },
    { subgoal: 'categorical-problems-mixed', family: 'pieAngle' },
  ],
  use: it => !/nearest tenth|nearest hundredth|to the hundredth/i.test(plain(it.prompt)) && plain(it.prompt).length <= 240,
  figure: it => { const t = tableOf(it); return t ? tableSvg(t) : null; },
};
