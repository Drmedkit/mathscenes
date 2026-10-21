// pictures.ts: turn an item's picture (plain data from items.ts) into a model block that fits the model frame, with
// fallbacks that drop detail (areas, squares, units) before giving up. The page draws the block; the test builds
// every generated item's picture through this same function, so a picture that cannot be drawn readably fails there.
import { frame, tryBlock } from '../../../blocks/block';
import { dusk } from '../../dusk';
import { SideSquares, type SideSquaresBlock, type SideSquaresParams } from '../pythagoras-intro/SideSquares';
import { ProofSquare, type ProofSquareBlock } from '../pythagoras-intro/ProofSquare';
import { rightPts, tilted } from '../pythagoras-intro/pythag';
import { PlaneDist, type PlaneDistBlock } from './PlaneDist';
import { Sketch, type SketchBlock } from './Sketch';
import type { Pic, TiltPic, TriPic } from './items';
import { fmt } from './theoremMaths';

/** the model's frame: a little narrower than the stage's MF, so the notation slate beside it is wide (WIDE_SLATE) */
export const PIC_FRAME = frame(50, 70, 860, 940);
/** the notation slate of this lesson: 910 px wide (the runtime board is 620), so a line like AG² = 145 + 12² = 289
 *  stays at 60 px or more */
export const WIDE_SLATE = { x0: 960, y0: 70, x1: 1870, y1: 1010 } as const;
export type Built =
  | { kind: 'tri'; block: SideSquaresBlock; squares: boolean }
  | { kind: 'tilt'; block: SideSquaresBlock }
  | { kind: 'plane'; block: PlaneDistBlock }
  | { kind: 'sketch'; block: SketchBlock }
  | { kind: 'proof'; block: ProofSquareBlock };

function triBlock(p: TriPic): { block: SideSquaresBlock; squares: boolean } | null {
  const base: SideSquaresParams = { pts: p.pts, right: p.right, labels: p.labels, verts: p.verts, maxUnit: 120 };
  const bare = p.labels ? Object.fromEntries(Object.entries(p.labels).map(([k, v]) => [k, (v ?? '').replace(/\\text\{ (in|ft|yd|m|cm|mi)\}/g, '')])) : undefined;
  const tries: [Partial<SideSquaresParams>, boolean][] = p.squares
    ? [[{ squares: p.squares, areas: p.areas }, true], [{ squares: p.squares, areas: p.areas, labels: bare }, true], [{ squares: p.squares, labels: bare }, true], [{}, false], [{ labels: bare }, false]]
    : [[{}, false], [{ labels: bare }, false]];
  for (const [extra, sq] of tries) {
    const r = tryBlock(() => SideSquares({ ...base, ...extra }, PIC_FRAME, dusk));
    // squares that would shrink the triangle to a sliver are dropped (the board carries the areas then)
    if (r.ok && (!sq || r.value.u >= 52)) return { block: r.value, squares: sq };
  }
  return null;
}
function tiltBlock(t: TiltPic): SideSquaresBlock | null {
  const T = tilted(t.p, t.q);
  const base: SideSquaresParams = { pts: rightPts(t.p, t.q), right: false, grid: true, squares: ['c'], surround: true, areas: { c: String(T.area) }, maxUnit: 200 };
  for (const extra of t.corners ? [{ corner: fmt(T.corner) }, {}] : [{}]) {
    const r = tryBlock(() => SideSquares({ ...base, ...extra }, PIC_FRAME, dusk));
    if (r.ok) return r.value;
  }
  return null;
}
/** the block for a picture, or null (the page then shows the big slate) */
export function buildPic(pic: Pic | undefined): Built | null {
  if (!pic) return null;
  if (pic.kind === 'tri') { const r = triBlock(pic); return r ? { kind: 'tri', ...r } : null; }
  if (pic.kind === 'tilt') { const b = tiltBlock(pic); return b ? { kind: 'tilt', block: b } : null; }
  if (pic.kind === 'plane') {
    const r = tryBlock(() => PlaneDist({ A: pic.A, B: pic.B, run: pic.run, rise: pic.rise, hyp: pic.hyp, hyp2: pic.hyp2 }, PIC_FRAME, dusk));
    const r2 = r.ok ? r : tryBlock(() => PlaneDist({ A: pic.A, B: pic.B, run: pic.run, rise: pic.rise }, PIC_FRAME, dusk));
    return r2.ok ? { kind: 'plane', block: r2.value } : null;
  }
  if (pic.kind === 'sketch') { const r = tryBlock(() => Sketch(pic.spec, PIC_FRAME, dusk)); return r.ok ? { kind: 'sketch', block: r.value } : null; }
  // the proof square: the drawn proportions stay readable; the item's numbers are in the prompt
  const ratio = Math.min(0.42, Math.max(0.27, pic.a / (pic.a + pic.b)));
  const r = tryBlock(() => ProofSquare(7 * ratio, 7 * (1 - ratio), PIC_FRAME, dusk));
  return r.ok ? { kind: 'proof', block: r.value } : null;
}
/** why a picture fails (tests) */
export function picError(pic: Pic): string {
  if (pic.kind === 'sketch') { const r = tryBlock(() => Sketch(pic.spec, PIC_FRAME, dusk)); return r.ok ? '' : r.error; }
  if (pic.kind === 'plane') { const r = tryBlock(() => PlaneDist({ A: pic.A, B: pic.B, run: pic.run, rise: pic.rise, hyp: pic.hyp, hyp2: pic.hyp2 }, PIC_FRAME, dusk)); return r.ok ? '' : r.error; }
  return buildPic(pic) ? '' : `${pic.kind} picture does not fit`;
}
