// Nested: the nested-set picture of a study. The population is a large painted region (amber outline, its name at
// the top), the sample a teal region inside it (its name inside). A census rings the whole population; an unstated
// population is a dashed, unnamed region ("population: ?"). An optional lime outline marks how far a claim may
// reach (the whole population for a random sample, only the sample for volunteers).
// Steps: outer, inner, claim. Labels >= 44 px, inside their regions, never on a line.
import { type Box, box, clamp, padBox } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, strokePts } from '../../../core/draw';
import type { Progress } from '../../../core/clock';
import type { Theme } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { inkLine, wash } from '../../wash';
import { drawWords, wordsBox } from '../../words';

export interface NestedParams {
  /** e.g. 'all 600 students at Pine Ridge' (null: the study does not say) */
  outer: string | null;
  /** e.g. 'the 40 names drawn' */
  inner: string;
  kind: 'part' | 'census';
  /** the lime outline: the group a claim may cover */
  claim?: 'outer' | 'inner';
}
export type NestedStep = 'outer' | 'inner' | 'claim';
export interface NestedBlock {
  readonly kind: 'Nested';
  readonly box: Box;
  readonly where: { outer: Box; inner: Box; outerLabel: Box; innerLabel: Box };
  draw(c: Canvas, p: Progress<NestedStep>): void;
}
const NAME = 'Nested';

export function Nested(P: NestedParams, fr: Frame, th: Theme): NestedBlock {
  void th;
  const outer = box(fr.x + 20, fr.y + 120, fr.x + fr.w - 20, fr.y + fr.h - 120);
  let ls = 50;
  const oText = P.outer ?? 'population: ?';
  // the population's name: one line, or two (split at the space nearest the middle) when it is long
  const split = (t: string): string[] => {
    const sp = [...t.matchAll(/ /g)].map(m => m.index!);
    if (!sp.length) return [t];
    const at = sp.reduce((a, b) => (Math.abs(b - t.length / 2) < Math.abs(a - t.length / 2) ? b : a));
    return [t.slice(0, at), t.slice(at + 1)];
  };
  const fits = (ls2: number, lines: string[]) => lines.every(l => wordsBox(l, outer.x0 + 36, 0, { size: ls2 }).x1 <= outer.x1 - 30);
  let oLines = [oText];
  while (ls > 44 && !fits(ls, oLines)) ls -= 2;
  if (!fits(ls, oLines)) { oLines = split(oText); ls = 50; while (ls > 44 && !fits(ls, oLines)) ls -= 2; }
  check(fits(ls, oLines), NAME, `"${oText}" is too long for the picture`);
  const oBoxes = oLines.map((l, i) => wordsBox(l, outer.x0 + 36, outer.y0 + 56 + i * 58, { size: ls }));
  const outerLabel = box(oBoxes[0]!.x0, oBoxes[0]!.y0, Math.max(...oBoxes.map(b => b.x1)), oBoxes[oBoxes.length - 1]!.y1);
  const inner = P.kind === 'census' ? padBox(outer, -26) : box(outer.x0 + outer.w * 0.16, outer.y0 + outer.h * 0.42, outer.x1 - 44, outer.y1 - 44);
  let is = 48;
  const iLab = () => (P.kind === 'census'
    ? wordsBox(P.inner, inner.cx, inner.y1 - 60, { size: is, align: 'center' })
    : wordsBox(P.inner, inner.cx, inner.cy, { size: is, align: 'center' }));
  while (is > 44 && iLab().w > inner.w - 40) is -= 2;
  const innerLabel = iLab();
  check(innerLabel.w <= inner.w - 30, NAME, `"${P.inner}" is too long for the sample region`);
  if (P.kind === 'part') check(innerLabel.y0 > outerLabel.y1 + 20 || innerLabel.x0 > outerLabel.x1 + 20, NAME, 'the two labels overlap');

  function draw(c: Canvas, p: Progress<NestedStep>): void {
    const ko = p.k('outer'), ki = p.k('inner'), kc = p.k('claim');
    const g = c.g;
    if (ko > 0) {
      g.save(); g.globalAlpha *= clamp(ko);
      if (P.outer === null) {
        wash(c, rectPts(outer.x0, outer.y0, outer.w, outer.h, 60), '#22264F', { seed: 71, rough: 2, ink: null, shade: 0.08 });
        strokePts(c, [...rectPts(outer.x0, outer.y0, outer.w, outer.h, 60), rectPts(outer.x0, outer.y0, outer.w, outer.h, 60)[0]!], { col: 'faint', lw: 4, dash: [14, 12] });
        oLines.forEach((l, i) => drawWords(c, l, oBoxes[i]!.x0, oBoxes[i]!.cy, 'dim', ko, { size: ls }));
      } else {
        wash(c, rectPts(outer.x0, outer.y0, outer.w, outer.h, 60), '#262A57', { seed: 71, rough: 2, ink: 'first', inkW: 4, shade: 0.08 });
        oLines.forEach((l, i) => drawWords(c, l, oBoxes[i]!.x0, oBoxes[i]!.cy, 'first', ko, { size: ls }));
      }
      g.restore();
    }
    if (ki > 0) {
      g.save(); g.globalAlpha *= clamp(ki);
      if (P.kind === 'census') inkLine(c, rectPts(inner.x0, inner.y0, inner.w, inner.h, 44), { col: 'second', w: 5, closed: true, seed: 73 });
      else wash(c, rectPts(inner.x0, inner.y0, inner.w, inner.h, inner.h / 2.2), '#1F4E5C', { seed: 75, rough: 2, ink: 'second', inkW: 4, shade: 0.1 });
      drawWords(c, P.inner, innerLabel.cx, innerLabel.cy, 'second', ki, { size: is, align: 'center' });
      g.restore();
    }
    if (P.claim && kc > 0) {
      const b = padBox(P.claim === 'outer' ? outer : inner, 14);
      inkLine(c, rectPts(b.x0, b.y0, b.w, b.h, P.claim === 'outer' ? 70 : b.h / 2.2), { col: 'link', w: 6, closed: true, seed: 79, alpha: clamp(kc) });
    }
  }
  return { kind: 'Nested', box: padBox(outer, 16), where: { outer, inner, outerLabel, innerLabel }, draw };
}
