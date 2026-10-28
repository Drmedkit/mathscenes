// NormalView: the curve card of "The normal distribution" on the shared kit Plane (src/lesson/kit/Plane.ts). It turns
// the serializable picture of an item or a lesson part (common.ts NPic['card']) into Plane params:
//   curves   a normal N(m, s) is a kit `curve` (the density in axis units); skewed, bimodal and uniform shapes too
//   shades   an area under a curve is a kit `shade` between the curve and the axis (the window edge when lo / hi lie
//            beyond the window: a tail)
//   bars     a density histogram: each bar a flat `shade` with ink `seg` edges (bars touching)
//   texts    words at an axis value and a fraction of the card's height (a percent on a region)
// The x axis is in data units with a tick every SD on SD-scaled cards (labels from the model, "?" for a hidden tick).
// The y axis is a density: unlabelled for curves (height is not the point), labelled for density histograms. Step keys
// are the item keys; 'axes' brings the card in (kit convention). Pure: no DOM (the kit block measures words).
import type { PItem, PParams } from '../../kit/Plane';
import { fmtN } from '../../kit/Plane';
import type { NBar, NCurve, NPic, NShade, NText } from './common';
import { dnorm, r9 } from './normMaths';

type Card = NonNullable<NPic['card']>;
const G25 = 1.329340388;   // Gamma(2.5)

/** the density of a curve item (axis units); every shape has mean m and SD s */
export function curveFn(c: NCurve): (x: number) => number {
  const { m, s } = c;
  switch (c.kind) {
    case 'normal': return x => dnorm(x, m, s);
    // a gamma shape (k = 2.5) scaled so that its mean is m and its SD is s (the summaries a question states)
    case 'skewR': { const th = s / Math.sqrt(2.5), x0 = m - 2.5 * th; return x => { const t = (x - x0) / th; return t > 0 ? (t ** 1.5 * Math.exp(-t)) / (th * G25) : 0; }; }
    case 'skewL': { const th = s / Math.sqrt(2.5), x0 = m + 2.5 * th; return x => { const t = (x0 - x) / th; return t > 0 ? (t ** 1.5 * Math.exp(-t)) / (th * G25) : 0; }; }
    // two equal humps at m -+ 0.8 s, each with SD 0.6 s: mean m, SD s
    case 'bimodal': return x => 0.5 * dnorm(x, m - 0.8 * s, 0.6 * s) + 0.5 * dnorm(x, m + 0.8 * s, 0.6 * s);
    // flat on m -+ sqrt(3) s: mean m, SD s
    case 'uniform': { const h = Math.sqrt(3) * s; return x => (Math.abs(x - m) <= h ? 1 / (2 * h) : 0); }
  }
}
/** the tallest point of the card's curves and bars */
export function peakOf(card: Card): number {
  let top = 0;
  for (const c of card.curves ?? []) { const f = curveFn(c); for (let i = 0; i <= 400; i++) top = Math.max(top, f(card.x.min + (card.x.max - card.x.min) * i / 400)); }
  for (const b of card.bars ?? []) top = Math.max(top, b.h);
  return top;
}

/** Plane params for a card; `extra` = shades and texts the solve adds (keys must differ) */
export function planeParams(card: Card, extra: { shades?: NShade[]; texts?: NText[] } = {}): PParams {
  const X = card.x;
  const hide = new Set((X.hide ?? []).map(v => r9(v))), show = X.show ? new Set(X.show.map(v => r9(v))) : null;
  const peak = peakOf(card);
  const y = card.y
    ? { min: 0, max: card.y.max, step: card.y.step, name: card.y.name, fmt: (v: number) => (v === 0 ? '0' : v.toFixed(card.y!.dec)) }
    : { min: 0, max: peak * 1.25, step: (peak * 1.25) / 4, fmt: () => '' };
  const curves = new Map((card.curves ?? []).map(c => [c.key, curveFn(c)]));
  const items: PItem[] = [];
  const bar = (b: NBar, i: number) => {
    items.push({ kind: 'shade', key: `bar${i}`, lo: b.lo, hi: b.hi, top: () => b.h, bottom: 'bottom', col: b.col ?? (i % 2 ? 'second' : 'first'), alpha: 0.45 });
    items.push({ kind: 'seg', key: `barT${i}`, a: [b.lo, b.h], b: [b.hi, b.h], col: 'ink', w: 3 });
    items.push({ kind: 'seg', key: `barL${i}`, a: [b.lo, 0], b: [b.lo, b.h], col: 'ink', w: 3 });
    items.push({ kind: 'seg', key: `barR${i}`, a: [b.hi, 0], b: [b.hi, b.h], col: 'ink', w: 3 });
  };
  (card.bars ?? []).forEach(bar);
  const shade = (s: NShade) => {
    const f = curves.get(s.on);
    if (!f) throw new Error(`shade ${s.key}: no curve ${s.on}`);
    items.push({ kind: 'shade', key: s.key, lo: Math.max(X.min, s.lo), hi: Math.min(X.max, s.hi), top: f, bottom: 'bottom', col: s.col ?? 'link', alpha: 0.42 });
  };
  for (const s of [...(card.shades ?? []), ...(extra.shades ?? [])]) shade(s);
  for (const v of card.vlines ?? []) items.push({ kind: 'vline', key: v.key, x: v.x, col: v.col ?? 'pick' });
  for (const c of card.curves ?? []) items.push({ kind: 'curve', key: c.key, f: curves.get(c.key)!, col: c.col ?? 'link', name: c.name, dash: c.dash, w: 6 });
  for (const t of [...(card.texts ?? []), ...(extra.texts ?? [])]) items.push({ kind: 'text', key: t.key, x: t.x, y: t.at * y.max, text: t.text, col: t.col ?? 'ink', size: 48 });
  return {
    x: { min: X.min, max: X.max, step: X.step, name: X.name, fmt: v => (hide.has(r9(v)) ? '?' : show && !show.has(r9(v)) ? '' : fmtN(X.dec === undefined ? r9(v) : Math.round(v * 10 ** X.dec) / 10 ** X.dec)) },
    y, items,
  };
}
/** every step key of a card (to bring it all in at once) */
export const cardKeys = (p: PParams): string[] => (p.items ?? []).map(i => i.key);
