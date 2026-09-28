// EquationMorph: TeX A -> TeX B with matched parts (\cssId names). Parts that exist in both and look the same glide
// to their new place; parts that changed morph outline-to-outline (a + turns 45° into a ×, a 5 grows a hole into a 6);
// parts only in A fade, parts only in B write on. Parts of A can be struck first (wrong), turning coral.
//
//   EquationMorph(ratioFix({ a: 2, b: 3, add: 2, factor: 2 }), frame, ink)
//     A: 2+2 : 3+2 = 4 : 5     (the +2's and the 5 struck)
//     B: 2×2 : 3×2 = 4 : 6
//   steps: write, strike, morph, mark
import { type Pt, clamp, qDiv, qEq, rat, unionBox } from '../core/math';
import { E } from '../core/easing';
import { rectPts } from '../core/pts';
import { type Canvas, drawOn, halo, strike } from '../core/draw';
import type { Progress } from '../core/clock';
import { morph } from '../core/morph';
import { type Paint, type Role, type Theme, mix, paint } from '../core/theme';
import { type Formula, type Glyph, type PartStyle, tex, texBox, texDraw, texShape } from '../core/tex';
import { type Block, type Frame, type ParamSpec, BlockError, check, friendly } from './block';

const NAME = 'EquationMorph';

export interface EquationMorphParams {
  /** TeX before / after; parts named with \cssId{name}{...} */
  readonly from: string;
  readonly to: string;
  /** parts of `from` that get struck (step 'strike') */
  readonly strike?: readonly string[];
  /** extra turn (radians) while a part morphs, e.g. { op: Math.PI / 4 } turns + into × */
  readonly rot?: Readonly<Record<string, number>>;
  /** colours per part, before and after (default ink) */
  readonly colFrom?: Readonly<Record<string, Paint>>;
  readonly colTo?: Readonly<Record<string, Paint>>;
  /** part of `to` to frame in the 'mark' step (default: all of it) */
  readonly mark?: string | null;
  /** em size in px (default theme eq size) */
  readonly size?: number;
  /** colour role of the mark frame (default ratio) */
  readonly accent?: Role;
}
export type EquationMorphStep = 'write' | 'strike' | 'morph' | 'mark';
export const EQM_STEPS: readonly EquationMorphStep[] = ['write', 'strike', 'morph', 'mark'];

interface PartPlan { tag: string; kind: 'same' | 'change' | 'out' | 'in' }
export interface EquationMorphPlan { readonly parts: readonly PartPlan[]; readonly untagged: 'glide' | 'fade' }

const chs = (F: Formula, tag: string | null) => F.glyphs.filter(g => g.tag === tag).map(g => g.ch).join(',');

/** which parts glide, morph, fade or appear (validated) */
export function planEquationMorph(P: EquationMorphParams): EquationMorphPlan {
  let A: Formula, B: Formula;
  try { A = tex(P.from); } catch (e) { throw new BlockError(NAME, `"from": ${(e as Error).message}`); }
  try { B = tex(P.to); } catch (e) { throw new BlockError(NAME, `"to": ${(e as Error).message}`); }
  check(!A.pending && !B.pending, NAME, 'a font file is still loading (await texReady first)');
  check(A.missing.length === 0 && B.missing.length === 0, NAME, `characters without outlines: ${[...A.missing, ...B.missing].join(' ')}`);
  for (const s of P.strike ?? []) check(A.tags.includes(s), NAME, `strike part '${s}' is not in "from"`);
  for (const r of Object.keys(P.rot ?? {})) check(A.tags.includes(r) && B.tags.includes(r), NAME, `rot part '${r}' must be in both`);
  if (P.mark) check(B.tags.includes(P.mark), NAME, `mark part '${P.mark}' is not in "to"`);
  const tags = [...new Set([...A.tags, ...B.tags])];
  const parts: PartPlan[] = tags.map(tag => {
    const inA = A.tags.includes(tag), inB = B.tags.includes(tag);
    if (inA && !inB) return { tag, kind: 'out' };
    if (!inA && inB) return { tag, kind: 'in' };
    return { tag, kind: chs(A, tag) === chs(B, tag) && !(P.strike ?? []).includes(tag) ? 'same' : 'change' };
  });
  return { parts, untagged: chs(A, null) === chs(B, null) ? 'glide' : 'fade' };
}

export interface EquationMorphBlock extends Block<EquationMorphStep> {
  readonly plan: EquationMorphPlan;
  readonly A: Formula; readonly B: Formula;
  readonly at: Pt; readonly size: number;
}

export function EquationMorph(P: EquationMorphParams, f: Frame, th: Theme): EquationMorphBlock {
  const plan = planEquationMorph(P);
  const A = tex(P.from), B = tex(P.to);
  let size = P.size ?? th.font.eq;
  const wMax = Math.max(A.w, B.w) / 1000;
  if (wMax * size > f.w - 40) size = (f.w - 40) / wMax;
  check(size >= th.font.minNum, NAME, `the equation is too wide for ${Math.round(f.w)} px (numbers would be ${Math.round(size)} px)`);
  const x = f.x + f.w / 2, y = f.y + f.h / 2, o = { size, align: 'center' as const };
  const kind = new Map(plan.parts.map(p => [p.tag, p.kind]));
  const partOf = (g: Glyph) => g.tag;
  const colA = (t: string | null): Paint => (t && P.colFrom?.[t]) || 'ink';
  const colB = (t: string | null): Paint => (t && P.colTo?.[t]) || 'ink';
  const struck = new Set(P.strike ?? []);
  // glide offsets: part box centre A -> B
  const offs = new Map<string, Pt>();
  for (const p of plan.parts) if (p.kind === 'same') {
    const a = texBox(A, x, y, o, p.tag), b = texBox(B, x, y, o, p.tag);
    offs.set(p.tag, [b.cx - a.cx, b.cy - a.cy]);
  }
  const ua = A.glyphs.filter(g => !g.tag), ub = B.glyphs.filter(g => !g.tag);
  const uOff = new Map<Glyph, Pt>();
  if (plan.untagged === 'glide') ua.forEach((g, i) => {
    const h = ub[i]!, s = size / 1000;
    // same placement maths as texPlace: centre-aligned, so shift by the difference of the two origins
    const oxA = x - (A.w / 2) * s - A.x0 * s, oxB = x - (B.w / 2) * s - B.x0 * s;
    uOff.set(g, [(oxB + h.box.cx * s) - (oxA + g.box.cx * s), (h.box.cy - g.box.cy) * s]);
  });
  const shapes = new Map<string, [Pt[][], Pt[][]]>();
  for (const p of plan.parts) if (p.kind === 'change') shapes.set(p.tag, [texShape(A, x, y, o, p.tag), texShape(B, x, y, o, p.tag)]);
  // one strike per run of neighbouring struck parts ("+2" is struck as a whole, not "+" and "2" apart)
  const runs: string[][] = [];
  A.tags.forEach((t, i) => {
    if (!struck.has(t)) return;
    const prev = A.tags[i - 1];
    if (prev !== undefined && struck.has(prev) && runs.length) runs[runs.length - 1]!.push(t); else runs.push([t]);
  });
  const strikeBoxes = runs.map(r => unionBox(r.map(t => texBox(A, x, y, o, t))));
  const markBox = P.mark ? texBox(B, x, y, o, P.mark) : texBox(B, x, y, o);
  const all = unionBox([texBox(A, x, y, o), texBox(B, x, y, o), markBox].map(b => ({ ...b, x0: b.x0 - 40, x1: b.x1 + 40, y0: b.y0 - 40, y1: b.y1 + 40 })));
  const key = `${P.from}=>${P.to}@${x},${y},${size}`;

  return {
    kind: NAME, steps: EQM_STEPS, box: all, plan, A, B, at: [x, y], size,
    draw(c: Canvas, p: Progress<EquationMorphStep>) {
      const kw = p.k('write'), ks = p.k('strike'), km = p.k('morph'), kmk = p.k('mark');
      const wrongMix = (t: string | null, base: Paint) => (t && struck.has(t) ? mix(paint(th, base), paint(th, 'wrong'), ks) : paint(th, base));
      if (km <= 0) {
        // A, written on, struck parts turning coral
        texDraw(c, A, x, y, { ...o, k: kw, lag: 0.4, glyph: g => ({ col: wrongMix(partOf(g), colA(partOf(g))) }) });
        strikeBoxes.forEach((b, i) => strike(c, b.x0 - 8, b.y1 + 2, b.x1 + 8, b.y0 - 2, clamp(ks * 1.6 - i * 0.12), { lw: th.lw.bold }));
        return;
      }
      if (km >= 1) {
        texDraw(c, B, x, y, { ...o, glyph: g => ({ col: colB(partOf(g)) }) });
      } else {
        const e = E.smooth(km);
        // A glyphs that glide (unchanged parts + matching untagged glyphs), those that fade out
        texDraw(c, A, x, y, { ...o, glyph: (g): PartStyle => {
          const t = partOf(g);
          if (t === null) {
            const d = uOff.get(g);
            return d ? { dx: d[0] * e, dy: d[1] * e, col: colA(null) } : { alpha: 1 - e, col: colA(null) };
          }
          const kd = kind.get(t);
          if (kd === 'same') { const d = offs.get(t)!; return { dx: d[0] * e, dy: d[1] * e, col: mix(paint(th, colA(t)), paint(th, colB(t)), e) }; }
          if (kd === 'out') return { alpha: 1 - e, col: wrongMix(t, colA(t)) };
          return { hide: true };
        } });
        // changed parts morph outline to outline
        for (const [t, [SA, SB]] of shapes) {
          const from = wrongMix(t, colA(t)), to = paint(th, colB(t));
          morph(c, SA, SB, km, { fill: mix(from, to, e), rot: P.rot?.[t] ?? 0, key: `${key}#${t}`, glow: 18 * E.bump(km), glowCol: colB(t) });
        }
        // parts only in B write on; untagged B glyphs appear when A's fade
        texDraw(c, B, x, y, { ...o, glyph: (g): PartStyle => {
          const t = partOf(g);
          if (t === null) return plan.untagged === 'glide' ? { hide: true } : { k: clamp((km - 0.3) / 0.7), col: colB(null) };
          return kind.get(t) === 'in' ? { k: clamp((km - 0.3) / 0.7), col: colB(t) } : { hide: true };
        } });
        // strike lines lift away
        strikeBoxes.forEach(b => strike(c, b.x0 - 8, b.y1 + 2, b.x1 + 8, b.y0 - 2, 1, { lw: th.lw.bold, alpha: 1 - clamp(km * 2.5) }));
      }
      if (kmk > 0) {
        const b = markBox;
        const acc = P.accent ?? 'ratio';
        halo(c, b.cx, b.cy, b.w * 0.7, acc, 0.12 * kmk);
        drawOn(c, rectPts(b.x0 - 30, b.y0 - 24, b.w + 60, b.h + 48, 24), kmk, { col: acc, lw: th.lw.base, closed: true, glow: 12, glowCol: acc });
      }
    },
  };
}

// ---------- a preset that computes its maths: "adding the same" vs "multiplying by the same" ----------
export interface RatioFixParams {
  readonly a: number; readonly b: number; readonly add: number; readonly factor: number;
  /** colour roles of the two amounts (default lemon, water) and of the right operation (default ratio) */
  readonly roles?: readonly [Role, Role]; readonly accent?: Role;
}
export interface RatioFixMaths { readonly wrong: readonly [number, number]; readonly right: readonly [number, number] }
export function computeRatioFix(P: RatioFixParams): RatioFixMaths {
  const a = friendly(P.a, NAME, 'a', { whole: true }), b = friendly(P.b, NAME, 'b', { whole: true });
  const add = friendly(P.add, NAME, 'add', { whole: true }), k = friendly(P.factor, NAME, 'factor', { whole: true });
  check(k.p >= 2, NAME, 'factor must be 2 or more');
  check(a.p !== b.p, NAME, `with a = b (${a.p} : ${b.p}) adding the same keeps the ratio, so there is nothing wrong to strike`);
  const wrong = [a.p + add.p, b.p + add.p] as const, right = [a.p * k.p, b.p * k.p] as const;
  check(!qEq(qDiv(rat(wrong[0]), rat(wrong[1])), qDiv(a, b)), NAME, 'adding keeps the ratio here: nothing to strike');
  check(qEq(qDiv(rat(right[0]), rat(right[1])), qDiv(a, b)), NAME, 'multiplying must keep the ratio');
  return { wrong, right };
}
/** "a+n : b+n = …" struck -> "a×k : b×k = …" */
export function ratioFix(P: RatioFixParams): EquationMorphParams {
  const { wrong, right } = computeRatioFix(P);
  const side = (x: number, op: string, n: number, t: string) => `\\cssId{${t}}{${x}}\\cssId{op${t}}{${op}}\\cssId{n${t}}{${n}}`;
  const from = `${side(P.a, '+', P.add, 'a')} : ${side(P.b, '+', P.add, 'b')} = \\cssId{ra}{${wrong[0]}} : \\cssId{rb}{${wrong[1]}}`;
  const to = `${side(P.a, '\\times', P.factor, 'a')} : ${side(P.b, '\\times', P.factor, 'b')} = \\cssId{ra}{${right[0]}} : \\cssId{rb}{${right[1]}}`;
  const strike = ['opa', 'na', 'opb', 'nb', ...(wrong[0] !== right[0] ? ['ra'] : []), ...(wrong[1] !== right[1] ? ['rb'] : [])];
  const [ca, cb] = P.roles ?? (['lemon', 'water'] as const), acc = P.accent ?? 'ratio';
  return {
    from, to, strike, rot: { opa: Math.PI / 4, opb: Math.PI / 4 },
    colFrom: { a: ca, b: cb, opa: 'dim', na: 'dim', opb: 'dim', nb: 'dim', ra: ca, rb: cb },
    colTo: { a: ca, b: cb, opa: acc, na: acc, opb: acc, nb: acc, ra: ca, rb: cb },
    mark: null, accent: acc,
  };
}

export const EQM_DEMO = {
  params: { a: 2, b: 3, add: 2, factor: 2 } satisfies RatioFixParams,
  specs: [
    { key: 'a', label: 'a', min: 1, max: 12, step: 1 },
    { key: 'b', label: 'b', min: 1, max: 12, step: 1 },
    { key: 'add', label: 'wrong: add', min: 1, max: 9, step: 1 },
    { key: 'factor', label: 'right: times', min: 1, max: 9, step: 1 },
  ] as const satisfies readonly ParamSpec<RatioFixParams>[],
};
