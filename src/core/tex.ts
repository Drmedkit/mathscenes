// tex.ts: TeX -> a typed Formula of glyph outlines, drawn on a canvas.
//
//   const F = tex('\\cssId{a}{2} : \\cssId{b}{3}');          // Formula<'a' | 'b'>  (tags parsed from the literal)
//   texDraw(c, F, 960, 540, { size: 140, align: 'center', k, tags: { a: { col: 'lemon' }, b: { col: 'water', k: kb } } });
//
// A Formula holds every drawable element MathJax emits, in formula units (1000 = 1 em, baseline y = 0, y down):
//   <path>     glyphs (filled) and some rules / brackets (stroked, e.g. the long-division bracket, with arcs)
//   <rect>     fraction bars and rules (filled) or boxes (\boxed, \fbox: stroked)
//   <line>     strikes / cancel (stroked)            <ellipse>  \enclose{circle} (stroked)
//   <polygon>  bbox borders, arrow heads (filled)    nested <svg> (clip + viewBox, e.g. \overline)
// `<text>` fallbacks (a character with no outline in the font) are listed in `missing` and not drawn.
// Parts are named with \cssId{name}{...}; every glyph knows its innermost part (`tag`) and its index inside it (`pi`).
import { type Box, type Pt, box, clamp, lag, unionBox } from './math';
import { E } from './easing';
import { clipToBox, partial, polyLen, strokeOutline } from './pts';
import { type Canvas, glowOn, pathOf } from './draw';
import { type Paint, paint } from './theme';
import { getEngine, type MjNode } from './mathjax';

// ---------- types ----------
/** the \cssId names inside a TeX literal (string when the source is not a literal) */
export type TagsOf<S extends string> = string extends S ? string
  : S extends `${string}\\cssId{${infer T}}${infer R}` ? T | TagsOf<R> : never;

/** affine matrix [a b c d e f] (SVG / DOMMatrix order) */
export type Mat = readonly [number, number, number, number, number, number];
export interface Glyph {
  readonly i: number;
  /** innermost \cssId around this element, or null */
  readonly tag: string | null;
  /** all enclosing \cssId names, outermost first */
  readonly tags: readonly string[];
  /** index of this glyph inside its innermost tag (or among untagged glyphs) */
  readonly pi: number;
  /** MathJax char code (hex, e.g. '3A' for ':'), 'rule' for rules, or null */
  readonly ch: string | null;
  readonly el: 'path' | 'rect' | 'line' | 'ellipse' | 'polygon';
  readonly mode: 'fill' | 'stroke';
  /** local SVG path data + its transform into formula units (for a crisp Path2D) */
  readonly d: string;
  readonly m: Mat;
  /** stroke width in formula units (stroke mode) */
  readonly lw: number;
  /** outlines (fill) or centre lines (stroke) in formula units */
  readonly subs: readonly (readonly Pt[])[];
  readonly closed: boolean;
  readonly clip: Box | null;
  /** explicit colour from \color / \textcolor */
  readonly col: string | null;
  readonly box: Box;
  readonly len: number;
}
export interface Formula<T extends string = string> {
  readonly src: string;
  readonly glyphs: readonly Glyph[];
  /** the \cssId names found, in order of appearance */
  readonly tags: readonly T[];
  /** glyph count per tag ('' = untagged) */
  readonly count: Readonly<Record<string, number>>;
  /** viewBox: left, width, top (above baseline, negative), bottom */
  readonly x0: number; readonly w: number; readonly top: number; readonly bottom: number;
  readonly missing: readonly string[];
  /** a font file is still loading: the formula is empty for now (redraw on onTexLoad) */
  readonly pending: boolean;
}

export class TexError extends Error {
  constructor(readonly src: string, message: string) { super(`TeX error in "${src}": ${message}`); this.name = 'TexError'; }
}

// ---------- matrices ----------
const I: Mat = [1, 0, 0, 1, 0, 0];
const mul = (M: Mat, N: Mat): Mat => [
  M[0] * N[0] + M[2] * N[1], M[1] * N[0] + M[3] * N[1], M[0] * N[2] + M[2] * N[3], M[1] * N[2] + M[3] * N[3],
  M[0] * N[4] + M[2] * N[5] + M[4], M[1] * N[4] + M[3] * N[5] + M[5],
];
const apply = (M: Mat, [x, y]: Pt): Pt => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
function parseTransform(s: string): Mat {
  let M: Mat = I;
  for (const m of s.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const v = (m[2] ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
    const a = v[0] ?? 0;
    if (m[1] === 'translate') M = mul(M, [1, 0, 0, 1, a, v[1] ?? 0]);
    else if (m[1] === 'scale') M = mul(M, [a, 0, 0, v[1] ?? a, 0, 0]);
    else if (m[1] === 'matrix' && v.length === 6) M = mul(M, v as unknown as Mat);
    else if (m[1] === 'rotate') {
      const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r), cx = v[1] ?? 0, cy = v[2] ?? 0;
      M = mul(M, [1, 0, 0, 1, cx, cy]); M = mul(M, [c, sn, -sn, c, 0, 0]); M = mul(M, [1, 0, 0, 1, -cx, -cy]);
    }
  }
  return M;
}

// ---------- SVG path data -> polylines ----------
export interface SubPath { pts: Pt[]; closed: boolean }
/** flatten SVG path data (M L H V Q T C S A Z, absolute + relative) into polylines */
export function flattenD(d: string, seg = 8): SubPath[] {
  const tok = d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? [];
  const subs: SubPath[] = [];
  let cur: Pt[] | null = null, i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx = 0, cy = 0, pc = '';
  const num = (): number => Number(tok[i++]);
  const isCmd = (t: string | undefined) => !!t && /^[a-zA-Z]$/.test(t);
  const flush = (closed: boolean) => { if (cur && cur.length > 1) subs.push({ pts: cur, closed }); cur = null; };
  const quad = (x1: number, y1: number, x2: number, y2: number) => {
    for (let k = 1; k <= seg; k++) { const s = k / seg, u = 1 - s; cur!.push([u * u * x + 2 * u * s * x1 + s * s * x2, u * u * y + 2 * u * s * y1 + s * s * y2]); }
  };
  const cubic = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
    for (let k = 1; k <= seg; k++) {
      const s = k / seg, u = 1 - s;
      cur!.push([u * u * u * x + 3 * u * u * s * x1 + 3 * u * s * s * x2 + s * s * s * x3, u * u * u * y + 3 * u * u * s * y1 + 3 * u * s * s * y2 + s * s * s * y3]);
    }
  };
  const arc = (rx: number, ry: number, phi: number, large: boolean, sweep: boolean, x2: number, y2: number) => {
    // SVG arc endpoint -> centre parameterisation (SVG 1.1 F.6.5)
    if (rx === 0 || ry === 0) { cur!.push([x2, y2]); return; }
    rx = Math.abs(rx); ry = Math.abs(ry);
    const f = (phi * Math.PI) / 180, cf = Math.cos(f), sf = Math.sin(f);
    const dx = (x - x2) / 2, dy = (y - y2) / 2, x1p = cf * dx + sf * dy, y1p = -sf * dx + cf * dy;
    const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    let co = Math.sqrt(Math.max(0, num2 / (den || 1)));
    if (large === sweep) co = -co;
    const cxp = (co * rx * y1p) / ry, cyp = (-co * ry * x1p) / rx;
    const ccx = cf * cxp - sf * cyp + (x + x2) / 2, ccy = sf * cxp + cf * cyp + (y + y2) / 2;
    const ang = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!sweep && dt > 0) dt -= 2 * Math.PI; else if (sweep && dt < 0) dt += 2 * Math.PI;
    const n = Math.max(4, Math.ceil((Math.abs(dt) / (Math.PI / 2)) * seg));
    for (let k = 1; k <= n; k++) {
      const t = t1 + (dt * k) / n, ex = rx * Math.cos(t), ey = ry * Math.sin(t);
      cur!.push([cf * ex - sf * ey + ccx, sf * ex + cf * ey + ccy]);
    }
  };
  while (i < tok.length) {
    if (isCmd(tok[i])) cmd = tok[i++]!;
    if (!cmd) { i++; continue; }
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { flush(true); x = sx; y = sy; pc = 'Z'; continue; }
    if (C === 'M') { flush(false); x = ox + num(); y = oy + num(); sx = x; sy = y; cur = [[x, y]]; cmd = rel ? 'l' : 'L'; pc = 'M'; continue; }
    if (!cur) cur = [[x, y]];
    if (C === 'L') { x = ox + num(); y = oy + num(); cur.push([x, y]); }
    else if (C === 'H') { x = ox + num(); cur.push([x, y]); }
    else if (C === 'V') { y = oy + num(); cur.push([x, y]); }
    else if (C === 'Q') { const x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(); quad(x1, y1, x2, y2); cx = x1; cy = y1; x = x2; y = y2; }
    else if (C === 'T') {
      const x1 = 'QT'.includes(pc) ? 2 * x - cx : x, y1 = 'QT'.includes(pc) ? 2 * y - cy : y, x2 = ox + num(), y2 = oy + num();
      quad(x1, y1, x2, y2); cx = x1; cy = y1; x = x2; y = y2;
    } else if (C === 'C') {
      const a = [num(), num(), num(), num(), num(), num()].map((v, j) => v + (j % 2 ? oy : ox)) as [number, number, number, number, number, number];
      cubic(...a); cx = a[2]; cy = a[3]; x = a[4]; y = a[5];
    } else if (C === 'S') {
      const x1 = 'CS'.includes(pc) ? 2 * x - cx : x, y1 = 'CS'.includes(pc) ? 2 * y - cy : y;
      const a = [num(), num(), num(), num()].map((v, j) => v + (j % 2 ? oy : ox)) as [number, number, number, number];
      cubic(x1, y1, ...a); cx = a[0]; cy = a[1]; x = a[2]; y = a[3];
    } else if (C === 'A') {
      const rx = num(), ry = num(), phi = num(), large = num() !== 0, sweep = num() !== 0, x2 = ox + num(), y2 = oy + num();
      arc(rx, ry, phi, large, sweep, x2, y2); x = x2; y = y2;
    } else { i++; continue; }
    pc = C;
  }
  flush(false);
  return subs;
}

// ---------- SVG tree -> Formula ----------
const num = (s: string | null | undefined, d = 0): number => { const v = parseFloat(s ?? ''); return Number.isFinite(v) ? v : d; };
function strokeWidthOf(attr: (n: string) => string | null): number | null {
  const sw = attr('stroke-width');
  if (sw !== null && sw !== '') return num(sw);
  const m = (attr('style') ?? '').match(/stroke-width:\s*([\d.]+)/);
  return m ? num(m[1]) : null;
}
const realColour = (v: string | null): string | null => (v && v !== 'currentColor' && v !== 'none' ? v : null);

function build(src: string, root: MjNode): Omit<Formula, 'pending'> {
  const A = getEngine().adaptor;
  const kind = (n: MjNode) => String(A.kind(n as never)).toLowerCase();
  const kids = (n: MjNode): MjNode[] => (A.childNodes(n as never) as unknown as MjNode[]) ?? [];
  const find = (n: MjNode, tag: string): MjNode | null => {
    if (kind(n) === tag) return n;
    for (const k of kids(n)) { const f = find(k, tag); if (f) return f; }
    return null;
  };
  const svg = find(root, 'svg');
  if (!svg) throw new TexError(src, 'MathJax produced no <svg>');
  const at = (n: MjNode) => (name: string): string | null => {
    const v = A.getAttribute(n as never, name) as unknown;
    return v === undefined || v === null ? null : String(v);
  };
  const vb = (at(svg)('viewBox') ?? '0 0 0 0').split(/[\s,]+/).map(Number);
  const glyphs: Omit<Glyph, 'pi'>[] = [];
  const missing: string[] = [];
  const tagOrder: string[] = [];

  interface Ctx { M: Mat; tags: string[]; fill: string | null; stroke: string | null; clip: Box | null }
  const add = (el: Glyph['el'], d: string, c: Ctx, a: (n: string) => string | null, forceStroke = false) => {
    const sw = strokeWidthOf(a);
    const fillAttr = a('fill');
    const mode: Glyph['mode'] = forceStroke || fillAttr === 'none' ? 'stroke' : 'fill';
    const scale = Math.sqrt(Math.abs(c.M[0] * c.M[3] - c.M[1] * c.M[2])) || 1;
    const lw = mode === 'stroke' ? (sw ?? 40) * scale : 0;
    const raw = flattenD(d);
    let subs: Pt[][] = raw.map(s => s.pts.map(p => apply(c.M, p)));
    const closed = raw.length > 0 && raw.every(s => s.closed);
    if (mode === 'fill' && c.clip) subs = subs.map(P => clipToBox(P, c.clip!)).filter(P => P.length > 2);
    else if (mode === 'fill') subs = subs.filter(P => P.length > 2);
    if (!subs.length) return;
    let b = unionBox(subs.map(P => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of P) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      return box(x0, y0, x1, y1);
    }));
    if (mode === 'stroke') b = box(b.x0 - lw / 2, b.y0 - lw / 2, b.x1 + lw / 2, b.y1 + lw / 2);
    if (c.clip) b = box(Math.max(b.x0, c.clip.x0), Math.max(b.y0, c.clip.y0), Math.min(b.x1, c.clip.x1), Math.min(b.y1, c.clip.y1));
    const col = mode === 'stroke' ? realColour(a('stroke')) ?? c.stroke : realColour(fillAttr) ?? c.fill;
    glyphs.push({
      i: glyphs.length, tag: c.tags[c.tags.length - 1] ?? null, tags: [...c.tags],
      ch: a('data-c') ?? (el === 'path' ? null : 'rule'), el, mode, d, m: c.M, lw, subs, closed, clip: c.clip, col, box: b,
      len: subs.reduce((s, P) => s + polyLen(P, mode === 'fill' || closed), 0),
    });
  };

  const walk = (n: MjNode, parent: Ctx, isRoot: boolean) => {
    const name = kind(n);
    if (name === '#text' || name === '#comment') return;
    const a = at(n);
    let M = parent.M, clip = parent.clip;
    if (name === 'svg' && !isRoot) {
      // nested svg: x, y, width, height, viewBox (+ clipping to its box)
      const x = num(a('x')), y = num(a('y')), w = num(a('width')), h = num(a('height'));
      const v = (a('viewBox') ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
      const c0 = apply(M, [x, y]), c1 = apply(M, [x + w, y + h]);
      const cb = box(Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]));
      clip = clip ? box(Math.max(clip.x0, cb.x0), Math.max(clip.y0, cb.y0), Math.min(clip.x1, cb.x1), Math.min(clip.y1, cb.y1)) : cb;
      M = mul(M, [1, 0, 0, 1, x, y]);
      if (v.length === 4 && v[2] && v[3]) M = mul(mul(M, [w / v[2], 0, 0, h / v[3], 0, 0]), [1, 0, 0, 1, -v[0]!, -v[1]!]);
    }
    const tr = a('transform');
    if (tr) M = mul(M, parseTransform(tr));
    const id = a('id');
    const tags = id ? [...parent.tags, id] : parent.tags;
    if (id && !tagOrder.includes(id)) tagOrder.push(id);
    const c: Ctx = { M, tags, clip, fill: realColour(a('fill')) ?? parent.fill, stroke: realColour(a('stroke')) ?? parent.stroke };
    if (name === 'path') { const d = a('d'); if (d) add('path', d, c, a); }
    else if (name === 'rect') {
      if (a('data-background') !== 'true' || realColour(a('fill'))) {
        const x = num(a('x')), y = num(a('y')), w = num(a('width')), h = num(a('height'));
        if (w > 0 && h > 0) add('rect', `M${x} ${y}H${x + w}V${y + h}H${x}Z`, c, a);
      }
    } else if (name === 'line') {
      add('line', `M${num(a('x1'))} ${num(a('y1'))}L${num(a('x2'))} ${num(a('y2'))}`, c, a, true);
    } else if (name === 'ellipse' || name === 'circle') {
      const cx = num(a('cx')), cy = num(a('cy')), rx = num(a('rx') ?? a('r')), ry = num(a('ry') ?? a('r'));
      add('ellipse', `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`, c, a);
    } else if (name === 'polygon' || name === 'polyline') {
      const p = (a('points') ?? '').split(/[\s,]+/).filter(Boolean).map(Number);
      if (p.length >= 6) {
        let d = `M${p[0]} ${p[1]}`;
        for (let j = 2; j + 1 < p.length; j += 2) d += `L${p[j]} ${p[j + 1]}`;
        add('polygon', d + (name === 'polygon' ? 'Z' : ''), c, a, name === 'polyline');
      }
    } else if (name === 'text') {
      missing.push(String(A.textContent(n as never) ?? '?'));
    }
    for (const k of kids(n)) walk(k, c, false);
  };
  walk(svg, { M: I, tags: [], fill: null, stroke: null, clip: null }, true);

  const count: Record<string, number> = {};
  const withPi: Glyph[] = glyphs.map(gl => {
    const key = gl.tag ?? '';
    const pi = count[key] ?? 0;
    count[key] = pi + 1;
    return { ...gl, pi };
  });
  return { src, glyphs: withPi, tags: tagOrder, count, x0: vb[0] ?? 0, w: vb[2] ?? 0, top: vb[1] ?? 0, bottom: (vb[1] ?? 0) + (vb[3] ?? 0), missing };
}

// ---------- cache, sync + async conversion ----------
const cache = new Map<string, Formula>();
const loading = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();
let ready: Promise<void> | null = null;

const errMsg = (e: unknown): string => (e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : String(e));
const empty = (src: string): Formula => ({ src, glyphs: [], tags: [], count: {}, x0: 0, w: 0, top: 0, bottom: 0, missing: [], pending: true });

/** characters/commands every scene uses: their font files are loaded up front so tex() stays synchronous */
const WARM = ['0123456789+-=:<>?!.,', '\\times\\div\\pm\\neq\\approx\\cdot\\to\\longrightarrow\\rightarrow\\checkmark',
  '\\tfrac{1}{2}\\frac{3}{4}', '\\text{abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ’,.!?:;()-}', '\\text{¢}\\%\\$',
  '\\xrightarrow{\\times 2}\\enclose{circle}{6}\\cancel{5}', '\\qty{5}{ft}\\sfrac{1}{2}'];

/** start MathJax and load the common font files. Await before the first tex() call. */
export function texReady(extra: readonly string[] = []): Promise<void> {
  if (!ready) ready = (async () => { const e = getEngine(); for (const s of WARM) await e.convertAsync(s); })();
  return extra.length ? ready.then(() => Promise.all(extra.map(s => texAsync(s))).then(() => undefined)) : ready;
}

/** TeX -> Formula (cached). Synchronous: when a rare font file is needed it returns an empty `pending` formula, loads the
 *  file and calls the onTexLoad listeners (redraw then). Throws TexError on bad TeX. */
export function tex<S extends string>(src: S): Formula<TagsOf<S>> {
  const hit = cache.get(src);
  if (hit) return hit as Formula<TagsOf<S>>;
  const e = getEngine();
  try {
    const F = { ...build(src, e.convert(src)), pending: false } as Formula;
    cache.set(src, F);
    return F as Formula<TagsOf<S>>;
  } catch (err) {
    const retry = (err as { retry?: Promise<unknown> }).retry;
    if (retry) {
      if (!loading.has(src)) {
        loading.set(src, retry.then(() => { loading.delete(src); tex(src); listeners.forEach(f => f()); }, () => { loading.delete(src); }));
      }
      return empty(src) as Formula<TagsOf<S>>;
    }
    if (err instanceof TexError) throw err;
    throw new TexError(src, errMsg(err));
  }
}
/** TeX -> Formula, waiting for any font file it needs */
export async function texAsync<S extends string>(src: S): Promise<Formula<TagsOf<S>>> {
  const hit = cache.get(src);
  if (hit) return hit as Formula<TagsOf<S>>;
  try {
    const node = await getEngine().convertAsync(src);
    const F = { ...build(src, node), pending: false } as Formula;
    cache.set(src, F);
    return F as Formula<TagsOf<S>>;
  } catch (err) {
    throw err instanceof TexError ? err : new TexError(src, errMsg(err));
  }
}
/** a formula with a runtime check that the listed parts exist (for sources built from numbers at runtime) */
export function texT<T extends string>(src: string, tags: readonly T[]): Formula<T> {
  const F = tex(src) as Formula;
  if (!F.pending) for (const t of tags) if (!F.tags.includes(t)) throw new TexError(src, `missing part \\cssId{${t}}`);
  return F as Formula<T>;
}
/** resolves when no font file is loading */
export async function texSettled(): Promise<void> { while (loading.size) await Promise.all([...loading.values()]); }
export function onTexLoad(fn: () => void): () => void { listeners.add(fn); return () => listeners.delete(fn); }

// ---------- placement ----------
export type Align = 'left' | 'center' | 'right';
/** 'middle' puts the maths axis (0.25 em above the baseline) on y, so rows of different formulas line up */
export type VAlign = 'middle' | 'baseline' | 'center' | 'top' | 'bottom';
export interface PlaceOpts { size?: number; align?: Align; valign?: VAlign }
export function texPlace(F: Formula, x: number, y: number, o: PlaceOpts = {}): { ox: number; oy: number; s: number } {
  const s = (o.size ?? 52) / 1000, al = o.align ?? 'left';
  const ox = x - (al === 'center' ? F.w / 2 : al === 'right' ? F.w : 0) * s - F.x0 * s;
  const v = o.valign ?? 'middle';
  const oy = v === 'middle' ? y + 250 * s : v === 'baseline' ? y : v === 'center' ? y - ((F.top + F.bottom) / 2) * s
    : v === 'top' ? y - F.top * s : y - F.bottom * s;
  return { ox, oy, s };
}
/** world box of a tagged part (or of the whole formula's ink when tag is omitted) */
export function texBox<T extends string>(F: Formula<T>, x: number, y: number, o: PlaceOpts = {}, tag?: T): Box {
  const { ox, oy, s } = texPlace(F, x, y, o);
  const G = F.glyphs.filter(gl => !tag || gl.tags.includes(tag));
  if (!G.length) {
    if (F.pending) return box(x, y, x, y);
    if (tag) throw new TexError(F.src, `no part '${tag}'`);
    return box(ox + F.x0 * s, oy + F.top * s, ox + (F.x0 + F.w) * s, oy + F.bottom * s);
  }
  const b = unionBox(G.map(g => g.box));
  return box(ox + b.x0 * s, oy + b.y0 * s, ox + b.x1 * s, oy + b.y1 * s);
}
/** width in px of a formula at a size (advance width, not ink) */
export const texWidth = (F: Formula, size: number): number => (F.w * size) / 1000;
/** world outlines of a part (for morph): filled glyphs as outlines, stroked ones as outline polygons */
export function texShape<T extends string>(F: Formula<T>, x: number, y: number, o: PlaceOpts = {}, tag?: T): Pt[][] {
  const { ox, oy, s } = texPlace(F, x, y, o);
  const w = (P: readonly Pt[]) => P.map(([u, v]) => [ox + u * s, oy + v * s] as Pt);
  return F.glyphs.filter(gl => !tag || gl.tags.includes(tag)).flatMap(gl =>
    gl.mode === 'fill' ? gl.subs.map(w) : gl.subs.flatMap(P => strokeOutline(w(P), gl.lw * s, gl.closed)));
}

// ---------- drawing ----------
export interface PartStyle {
  col?: Paint; alpha?: number;
  /** write-on progress of this part (glyphs inside stagger by the lag ratio) */
  k?: number;
  dx?: number; dy?: number;
  /** scale / rotate about the part's own centre */
  s?: number; rot?: number;
  glow?: number; glowCol?: Paint; hide?: boolean;
}
export type PartStyles<T extends string> = { [K in T]?: PartStyle } & { [K in `#${string}`]?: PartStyle };
export interface TexDrawOpts<T extends string = string> extends PlaceOpts {
  col?: Paint; alpha?: number;
  /** write-on 0..1 (default 1), glyph by glyph */
  k?: number;
  /** stagger ratio of the write-on */
  lag?: number;
  /** per-part styles by \cssId name, or per glyph by char code: '#3A' = ':' */
  tags?: PartStyles<T>;
  glow?: number; glowCol?: Paint;
  /** outline width (px) while writing */
  lw?: number;
  /** per-glyph override, applied on top of the part style (e.g. move single glyphs in a morph) */
  glyph?: (gl: Glyph) => PartStyle | undefined;
}

const p2d = new WeakMap<Glyph, Path2D>();
function glyphPath(gl: Glyph): Path2D {
  let p = p2d.get(gl);
  if (!p) {
    p = new Path2D();
    const [a, b, c, d, e, f] = gl.m;
    p.addPath(new Path2D(gl.d), { a, b, c, d, e, f });
    p2d.set(gl, p);
  }
  return p;
}
const partBoxCache = new WeakMap<Formula, Map<string, Box>>();
function partBox(F: Formula, tag: string): Box {
  let m = partBoxCache.get(F);
  if (!m) { m = new Map(); partBoxCache.set(F, m); }
  let b = m.get(tag);
  if (!b) { b = unionBox(F.glyphs.filter(g => g.tags.includes(tag)).map(g => g.box)); m.set(tag, b); }
  return b;
}

/** Draw a formula. Every glyph writes on (outline traced, then filled) at its staggered share of k. */
export function texDraw<T extends string>(c: Canvas, F: Formula<T>, x: number, y: number, o: TexDrawOpts<T> = {}): void {
  if (!F.glyphs.length) return;
  const { g, th } = c;
  const { ox, oy, s } = texPlace(F, x, y, o);
  const k = o.k ?? 1, n = F.glyphs.length, lg = o.lag ?? 0.35;
  const styles = (o.tags ?? {}) as Record<string, PartStyle | undefined>;
  g.save(); g.globalAlpha *= clamp(o.alpha ?? 1);
  for (const gl of F.glyphs) {
    // the innermost styled part wins; a char-code style applies to single glyphs
    let p: PartStyle = {}, pTag: string | null = null;
    for (let j = gl.tags.length - 1; j >= 0; j--) { const st = styles[gl.tags[j]!]; if (st) { p = st; pTag = gl.tags[j]!; break; } }
    if (!pTag && gl.ch && styles['#' + gl.ch]) p = styles['#' + gl.ch]!;
    const extra = o.glyph?.(gl);
    if (extra) p = { ...p, ...extra };
    if (p.hide) continue;
    const kg = p.k !== undefined
      ? (pTag ? lag(p.k, F.glyphs.filter(q => q.tags.includes(pTag!)).indexOf(gl), F.glyphs.filter(q => q.tags.includes(pTag!)).length, lg) : p.k)
      : lag(k, gl.i, n, lg);
    const alpha = p.alpha ?? 1;
    if (kg <= 0 || alpha <= 0) continue;
    const col = paint(th, p.col ?? (gl.col as Paint | null) ?? o.col ?? 'ink', 'text');
    g.save();
    g.translate(ox + (p.dx ?? 0), oy + (p.dy ?? 0));
    if (p.s !== undefined || p.rot) {
      const pb = pTag ? partBox(F, pTag) : gl.box;
      g.translate(pb.cx * s, pb.cy * s);
      if (p.rot) g.rotate(p.rot);
      if (p.s !== undefined) g.scale(p.s, p.s);
      g.translate(-pb.cx * s, -pb.cy * s);
    }
    g.scale(s, s);
    g.globalAlpha *= clamp(alpha);
    const gw = p.glow ?? o.glow;
    if (gw) glowOn(c, paint(th, p.glowCol ?? o.glowCol ?? (p.col ?? o.col ?? 'ink'), 'fill'), gw);
    writeGlyph(g, gl, kg, col, (o.lw ?? 1.8) / s);
    g.restore();
  }
  g.restore();
}

/** one element written on. fill: outline traced (0 -> .6), fill fades in (.4 -> 1) as the outline fades.
 *  stroke: its centre line draws on at its own width. */
function writeGlyph(g: CanvasRenderingContext2D, gl: Glyph, k: number, col: string, lw: number): void {
  if (gl.clip) { g.save(); const b = gl.clip; g.beginPath(); g.rect(b.x0, b.y0, b.w, b.h); g.clip(); }
  if (gl.mode === 'stroke') {
    g.save(); g.strokeStyle = col; g.lineWidth = gl.lw; g.lineJoin = 'round'; g.lineCap = gl.el === 'line' ? 'butt' : 'round';
    if (k >= 1) g.stroke(glyphPath(gl));
    else for (const P of gl.subs) { const Q = partial(P, E.inOut(k), gl.closed); if (Q.length > 1) g.stroke(pathOf(Q, false)); }
    g.restore();
  } else {
    const ks = clamp(k / 0.6), kf = E.inOut(clamp((k - 0.4) / 0.6));
    if (kf > 0) { g.save(); g.globalAlpha *= kf; g.fillStyle = col; g.fill(glyphPath(gl)); g.restore(); }
    if (kf < 1) {
      g.save(); g.globalAlpha *= 1 - kf; g.strokeStyle = col; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
      if (ks >= 1) g.stroke(glyphPath(gl));
      else for (const P of gl.subs) { const Q = partial(P, ks, true); if (Q.length > 1) g.stroke(pathOf(Q, false)); }
      g.restore();
    }
  }
  if (gl.clip) g.restore();
}

/** shorthand: draw a TeX source at (x, y) */
export function texAt(c: Canvas, src: string, x: number, y: number, o: TexDrawOpts = {}): Box {
  const F = tex(src) as Formula;
  texDraw(c, F, x, y, o);
  return texBox(F, x, y, o);
}
