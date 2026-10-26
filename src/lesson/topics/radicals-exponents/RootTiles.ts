// RootTiles: simplest radical form as prime-factor tiles under a radical sign. An nth root takes a GROUP of n equal
// factors out as ONE factor (√(2·2) = 2), because (√a)^n = a; what is left without a full group stays inside.
//   row A   the radical with every prime factor of the radicand (72 = 2·2·2·3·3 under √)
//   groups  each group of n equal tiles is ringed (g<j>)
//   out     one tile of each group drops to row B, in front of a new radical; the rest of the group fades (it is used up)
//   rest    the tiles without a group drop under the new radical in row B; the result reads 6√2
// Steps: 'rad' (radical + tiles), g<j> (ring group j), 'out', 'rest'.
// Layout in a Frame (tile digits 60 px); throws BlockError when the tiles do not fit.
// Could move to the kit: factor tiles under a root, for simplifying radicals (numbers and variables).
import { type Box, box, clamp, lerp } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, drawOn } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Theme, paint } from '../../../core/theme';
import { type Formula, tex, texDraw, texWidth } from '../../../core/tex';
import { type Frame, check } from '../../../blocks/block';
import { drawWords } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

export interface TilesParams { n: number; tiles: string[]; groups: number[][]; /** TeX of the result, written under the result row at 'rest' */ result?: string }
export type TilesStep = 'rad' | 'out' | 'rest' | `g${number}`;
export interface TilesBlock {
  readonly kind: 'RootTiles';
  readonly where: { tile(i: number): Box; outRow: Box; inRow: Box };
  draw(c: Canvas, P: Progress<TilesStep>): void;
}
const NAME = 'RootTiles';
const TW = 78, TH = 96, GAP = 12, HOOK = 96, SIZE = 60;

export function RootTiles(p: TilesParams, fr: Frame, th: Theme): TilesBlock {
  const N = p.tiles.length;
  check(N >= 2 && N <= 9, NAME, '2 to 9 tiles');
  const used = p.groups.flat();
  check(new Set(used).size === used.length && used.every(i => i >= 0 && i < N), NAME, 'groups use each tile once');
  for (const gp of p.groups) check(gp.length === p.n && gp.every(i => p.tiles[i] === p.tiles[gp[0]!]), NAME, `a group is ${p.n} equal tiles`);
  const F = p.tiles.map(t => tex(t) as Formula);
  F.forEach(f => check(texWidth(f, SIZE) <= TW - 14, NAME, 'a factor does not fit its tile'));
  const rowW = (k: number) => k * TW + (k - 1) * GAP;
  const ayRow = fr.y + 230, byRow = fr.y + 540;
  const aW = HOOK + rowW(N) + 30;
  check(aW <= fr.w - 20, NAME, 'the tiles do not fit');
  const ax0 = fr.x + (fr.w - aW) / 2 + HOOK;
  const aTile = (i: number) => box(ax0 + i * (TW + GAP), ayRow - TH / 2, ax0 + i * (TW + GAP) + TW, ayRow + TH / 2);
  const rest = Array.from({ length: N }, (_, i) => i).filter(i => !used.includes(i));
  const G = p.groups.length;
  const bW = rowW(Math.max(G, 1)) + (rest.length ? 40 + HOOK + rowW(rest.length) + 30 : 0);
  check(bW <= fr.w - 20, NAME, 'the result row does not fit');
  const bx0 = fr.x + (fr.w - bW) / 2;
  const outTile = (j: number) => box(bx0 + j * (TW + GAP), byRow - TH / 2, bx0 + j * (TW + GAP) + TW, byRow + TH / 2);
  const rx0 = bx0 + rowW(Math.max(G, 1)) + 40 + HOOK;
  const inTile = (j: number) => box(rx0 + j * (TW + GAP), byRow - TH / 2, rx0 + j * (TW + GAP) + TW, byRow + TH / 2);
  const IDX = p.n > 2 ? tex(String(p.n)) as Formula : null;
  const dots = tex('\\cdot') as Formula;
  const RES = p.result ? tex(`= ${p.result}`) as Formula : null;
  if (RES) check(texWidth(RES, 72) <= fr.w - 40, NAME, 'the result does not fit');

  function radical(c: Canvas, xHook: number, xEnd: number, yRow: number, k: number, alpha = 1): void {
    if (k <= 0 || alpha <= 0) return;
    c.g.save(); c.g.globalAlpha *= alpha;
    const top = yRow - TH / 2 - 26, bot = yRow + TH / 2 + 10, mid = yRow + 8;
    const pts: [number, number][] = [[xHook - HOOK + 8, mid], [xHook - HOOK + 30, mid - 14], [xHook - HOOK + 56, bot], [xHook - 20, top], [xEnd, top]];
    drawOn(c, pts, E.inOut(clamp(k)), { col: 'ink', lw: 5 });
    if (IDX) texDraw(c, IDX, xHook - HOOK + 22, top + 26, { size: 48, align: 'center', col: 'dim', k });
    c.g.restore();
  }
  function tile(c: Canvas, B: Box, i: number, a: number, col: 'first' | 'second' | 'link', ghost = 0): void {
    if (a <= 0) return;
    const P = rectPts(B.x0, B.y0, B.w, B.h, 16);
    wash(c, P, col, { seed: 700 + i, rough: 1.4, alpha: a * (1 - 0.8 * ghost), inkW: 2.5 });
    texDraw(c, F[i]!, B.cx, B.cy, { size: SIZE, align: 'center', col: DUSK.ink as never, alpha: a * (1 - 0.6 * ghost) });
  }
  const lerpBox = (A: Box, B: Box, t: number) => { const u = E.inOut(clamp(t)), lift = Math.sin(Math.PI * clamp(t)) * 60; return box(lerp(A.x0, B.x0, u), lerp(A.y0, B.y0, u) - lift, lerp(A.x1, B.x1, u), lerp(A.y1, B.y1, u) - lift); };

  function draw(c: Canvas, P: Progress<TilesStep>): void {
    const kR = P.k('rad'), kO = P.k('out'), kS = P.k('rest');
    if (kR <= 0) return;
    const { g } = c;
    radical(c, ax0, ax0 + rowW(N) + 24, ayRow, kR, 1 - 0.6 * clamp(kS));
    if (RES && kS > 0) texDraw(c, RES, fr.x + fr.w / 2, byRow + 170, { size: 72, align: 'center', col: 'link', k: clamp((kS - 0.5) * 2) });
    // the result row: dots between the factors that came out, a new radical for the rest
    if (kO > 0) for (let j = 0; j + 1 < G; j++) texDraw(c, dots, outTile(j).x1 + GAP / 2, byRow, { size: 50, align: 'center', col: 'dim', alpha: clamp(kO) });
    if (rest.length) radical(c, rx0, rx0 + rowW(rest.length) + 24, byRow, kS);
    if (kO > 0 && !G) drawWords(c, 'nothing comes out', bx0, byRow, 'dim', kO, { size: 44 });
    for (let i = 0; i < N; i++) {
      const gj = p.groups.findIndex(gp => gp.includes(i));
      const isLead = gj >= 0 && p.groups[gj]![0] === i;
      const kIn = clamp(kR * 1.4 - i * 0.05);
      if (gj >= 0) {
        const kg = P.k(`g${gj}`);
        if (isLead) {
          const B = kO > 0 ? lerpBox(aTile(i), outTile(gj), kO) : aTile(i);
          tile(c, B, i, kIn, kO > 0.5 ? 'link' : kg > 0 ? 'second' : 'first');
        } else tile(c, aTile(i), i, kIn, kg > 0 ? 'second' : 'first', clamp(kO));
      } else {
        const j = rest.indexOf(i);
        const B = kS > 0 ? lerpBox(aTile(i), inTile(j), kS) : aTile(i);
        tile(c, B, i, kIn, 'first');
      }
    }
    p.groups.forEach((gp, j) => {
      const k = P.k(`g${j}`) * (1 - clamp(kO));
      if (k <= 0) return;
      const a = aTile(gp[0]!), b = aTile(gp[gp.length - 1]!);
      g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = paint(th, 'pick', 'fill'); g.lineWidth = 5;
      g.beginPath(); g.roundRect(a.x0 - 8, a.y0 - 8, b.x1 - a.x0 + 16, a.h + 16, 20); g.stroke(); g.restore();
    });
  }
  return {
    kind: 'RootTiles',
    where: { tile: aTile, outRow: box(bx0, byRow - TH / 2, bx0 + rowW(Math.max(G, 1)), byRow + TH / 2), inRow: box(rx0, byRow - TH / 2, rx0 + rowW(Math.max(rest.length, 1)), byRow + TH / 2) },
    draw,
  };
}
