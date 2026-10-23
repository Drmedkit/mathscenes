// items.ts: practice families for "cross-sections of right rectangular prisms and pyramids" (grade 7, 7.G.A.3).
// Each family is one deep structure; a generator gets the sub-goal id and uses that sub-goal's cases (topic JSON).
// Every wrong answer the classifier recognises carries its misconception id (math-curriculum-essentials).
// Pure: no DOM, no canvas. The picture (SlicePicture) is drawn by the page with the Slicer block; every number on it
// comes from sliceMaths.ts. PROBES records, per item, typical wrong responses and the id they must get (tests).
import { type Gen, type Item, type Response, type Verdict, A, B, S, int, pick, shuffle } from '../../runtime/item';
import {
  type FaceName, type Plane, type Pose, type SolidSpec, type V3, edgesOf, faceCount, len, lerp3, planeAxis, planeThrough, planeUpright,
  sectionOf, shapeOf, solidFaces, solidVerts, sub, dot, cross, unit,
} from './sliceMaths';
import type { Dim, Mark } from './Slicer';
import { endOnChoice } from '../../runtime/explain';

export type FamilyId = 'name' | 'dims' | 'orient' | 'taper' | 'half' | 'upright' | 'bottom' | 'join' | 'count' | 'equi' | 'possible' | 'most';
export const FAMILY_NAMES: Record<FamilyId, string> = {
  name: 'Name the cross-section',
  dims: 'How big is it?',
  orient: 'Which way to cut',
  taper: 'Slices of a pyramid',
  half: 'Halfway up',
  upright: 'Standing slices of a pyramid',
  bottom: 'The bottom side',
  join: 'Join the points',
  count: 'Count the sides',
  equi: 'Corner cuts',
  possible: 'Possible or not?',
  most: 'The most sides',
};

/** what the page draws for an item: the Slicer block's parameters plus the solution's board lines */
export interface SlicePicture {
  kind: 'slice';
  solid: SolidSpec; pose: Pose; unit: string;
  planes: Plane[]; planeNames?: string[];
  dims: Dim[];
  points?: Mark[];
  /** the planes appear only in the worked solution */ hidePlanes?: boolean;
  /** no true-shape sketch on the board (two planes, a point) */ noFlat?: boolean;
  sideLabels?: 'auto' | 'none';
  /** a face that lights up in the solution */ glow?: FaceName;
  /** the solution's lines on the board (TeX) */ hero: string[];
}

export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();
const probe = (it: Item, r: Response, mc: string) => { const l = PROBES.get(it) ?? []; l.push({ r, mc }); PROBES.set(it, l); };

export const MC = {
  piece: 'mc.shapes.cross-section-as-piece-face-or-silhouette',
  copiesBase: 'mc.shapes.section-copies-base-shape',
  baseBottom: 'mc.shapes.base-is-the-bottom-face',
  allTriangle: 'mc.shapes.vertical-section-always-triangle',
  offApexRect: 'mc.shapes.off-apex-pyramid-section-is-rectangle',
  joinsInterior: 'mc.shapes.joins-section-points-through-interior',
  cornerEqui: 'mc.shapes.corner-cut-always-equilateral',
  cubeOnlyRect: 'mc.shapes.cube-section-only-square-rectangle',
  noExample: 'mc.reasoning-language.assumes-case-possible-without-example',
  overgeneral: 'mc.reasoning-language.overgeneralizes-to-new-cases',
  moreSides: 'mc.shapes.section-more-sides-than-faces',
} as const;

// ---------- helpers ----------
function choiceCheck(r: Response, right: number, says: { say: string; mc?: string }[]): Verdict {
  if (r.kind !== 'choice') return { ok: false, say: 'Pick one answer.' };
  const s = says[r.i];
  if (!s) return { ok: false, say: 'Pick one answer.' };
  return { ok: r.i === right, mc: r.i === right ? undefined : s.mc, say: s.say };
}
interface Opt { t: string; ok?: boolean; say: string; mc?: string }
function options(R: () => number, opts: Opt[]): { choices: string[]; right: number; says: { say: string; mc?: string }[] } {
  const o = shuffle(R, opts.slice());
  return { choices: o.map(x => x.t), right: o.findIndex(x => x.ok), says: o.map(x => ({ say: x.say, mc: x.mc })) };
}
function choiceItem(base: Omit<Item, 'input' | 'choices' | 'answer' | 'check'>, R: () => number, opts: Opt[]): Item {
  const o = options(R, opts);
  return { ...base, solution: endOnChoice(base.solution, o.choices[o.right]!), input: 'choice', choices: o.choices, answer: { kind: 'choice', i: o.right }, check: r => choiceCheck(r, o.right, o.says) };
}
interface PairWrong { v: [number, number]; mc?: string; say: string }
function pairCheck(r: Response, a: number, b: number, okSay: string, wrongs: PairWrong[], fallback: string): Verdict {
  if (r.kind !== 'pair' || !Number.isFinite(r.x) || !Number.isFinite(r.y)) return { ok: false, say: 'Type a number in both boxes.' };
  const is = (x: number, y: number) => (r.x === x && r.y === y) || (r.x === y && r.y === x);
  if (is(a, b)) return { ok: true, say: okSay };
  for (const w of wrongs) if (is(w.v[0], w.v[1])) return { ok: false, mc: w.mc, say: w.say };
  return { ok: false, say: fallback };
}
const u2 = (x: number, u: string) => `${x} ${u}`;
const by = (a: number, b: number, u: string) => `${a} ${u} × ${b} ${u}`;
/** the two side lengths, each marked as an answer (the steps card reads a pair from the last two marks) */
const byS = (a: number, b: number, u: string) => `${S(`${a} ${u}`)} × ${S(`${b} ${u}`)}`;
/** "a" or "an" before a number word or a word (an 8 in, an 11 ft, an octagon) */
const an = (next: string) => (/^(8|11|18|8\d|[aeiou])/i.test(next.trim()) ? 'an' : 'a');
const tt = (s: string) => `\\text{${s}}`;
const texBy = (a: number, b: number, u: string) => `${a}\\text{ ${u}} \\times ${b}\\text{ ${u}}`;
const SIDE_NAMES: Record<number, string> = { 3: 'triangle', 4: 'rectangle', 5: 'pentagon', 6: 'hexagon', 7: 'heptagon', 8: 'octagon' };
const FACE_WORDS: Record<FaceName, string> = { bottom: 'bottom face', top: 'top face', front: 'front face', back: 'back face', left: 'left end', right: 'right end', base: 'base', cap: 'cut face' };

// ---------- contexts (US units, no money) ----------
// boxes come 2 to 12 in on a side (boxDims): only things that really come in those sizes (no 9 in tall bar of soap, no
// 11 in tall sheet cake)
const BOXES = [
  { what: 'block of cheese', u: 'in' }, { what: 'brick of clay', u: 'in' }, { what: 'block of tofu', u: 'in' },
  { what: 'foam block', u: 'in' }, { what: 'block of marble', u: 'in' }, { what: 'block of ice', u: 'in' },
  { what: 'wooden block', u: 'in' }, { what: 'wooden crate', u: 'ft' }, { what: 'stone block', u: 'ft' }, { what: 'block of wax', u: 'in' },
];
const CUBES = ['wooden cube', 'cube of cheese', 'foam cube', 'clay cube', 'glass cube'];
const PYRS = ['glass paperweight', 'pyramid candle', 'chocolate pyramid', 'clay pyramid', 'crystal pyramid', 'wooden pyramid'];
const CUT = ['a knife', 'a wire cutter', 'a saw', 'a flat cut'];

/** three different whole lengths (l the longest so the box reads well) */
function boxDims(R: () => number, u: string): [number, number, number] {
  const hi = u === 'ft' ? 8 : 12;
  for (let t = 0; t < 100; t++) {
    const l = int(R, 5, hi), w = int(R, 2, l - 1), h = int(R, 2, Math.min(hi - 1, l));
    if (l !== w && w !== h && l !== h && h <= l + 1 && l <= 3 * Math.min(w, h) + 2) return [l, w, h];
  }
  return [6, 4, 3];
}
const AXIS_FACE = ['ends', 'front', 'bottom'] as const;
/** the section of a box cut parallel to a face: x-cut = w x h, y-cut = l x h, z-cut = l x w */
const secDims = (axis: 0 | 1 | 2, l: number, w: number, h: number): [number, number] => (axis === 0 ? [w, h] : axis === 1 ? [l, h] : [l, w]);
const cutWords = (axis: 0 | 1 | 2) => (axis === 2 ? 'level, parallel to the bottom face' : axis === 1 ? 'straight down, parallel to the front face' : 'straight down, parallel to the end faces');
const fromWords = (axis: 0 | 1 | 2, t: number, u: string) => (axis === 2 ? `${u2(t, u)} up from the bottom` : axis === 1 ? `${u2(t, u)} back from the front` : `${u2(t, u)} from the left end`);

// =====================================================================================================
// 1. name the cross-section of a box cut parallel to a face   [cs-plane-section-parallel, cs-perpendicular-orientation]
function boxCut(R: () => number, sg?: string) {
  const cube = sg === 'cs-plane-section-parallel' && R() < 0.35;
  const sk = cube ? { what: pick(R, CUBES), u: 'in' } : pick(R, BOXES);
  const axis: 0 | 1 | 2 = sg === 'cs-perpendicular-orientation' ? (R() < 0.75 ? pick(R, [0, 1] as const) : 2) : pick(R, [0, 1, 2] as const);
  let l = 7, w = 5, h = 4, t = 2;
  for (let k = 0; k < 40; k++) {
    if (cube) { const s = int(R, 3, 8); l = w = h = s; } else [l, w, h] = boxDims(R, sk.u);
    const along = axis === 0 ? l : axis === 1 ? w : h;
    t = int(R, 1, along - 1);
    if (cube || ![l, w, h].includes(t)) break;
    if (k === 39) { l = 7; w = 5; h = 4; t = axis === 2 ? 1 : 2; }
  }
  const [a, b] = secDims(axis, l, w, h);
  return { cube, sk, l, w, h, axis, t, a, b, plane: planeAxis(axis, t), sq: a === b };
}
function boxSolution(c: ReturnType<typeof boxCut>): string[] {
  const { a, b, sk, axis, sq } = c, shape = sq ? 'square' : 'rectangle';
  return [
    `The cut is ${cutWords(axis)}, so the cross-section is the same shape as the ${AXIS_FACE[axis] === 'ends' ? 'end faces' : AXIS_FACE[axis] + ' face'}.`,
    `Its sides run along the ${u2(a, sk.u)} and ${u2(b, sk.u)} edges: ${an(String(a))} ${byS(a, b, sk.u)} ${shape}.`,
    'It is flat, with no thickness: the cut-off piece is a solid, the cross-section is only the face the cut leaves.',
  ];
}
function boxPicture(c: ReturnType<typeof boxCut>, hide = false): SlicePicture {
  return { kind: 'slice', solid: { kind: 'box', l: c.l, w: c.w, h: c.h }, pose: 'upright', unit: c.sk.u, planes: [c.plane], dims: ['l', 'w', 'h'], hidePlanes: hide,
    hero: [tt(c.sq ? 'square' : 'rectangle'), texBy(c.a, c.b, c.sk.u)] };
}
const name: Gen = (R, n, sg) => {
  const c = boxCut(R, sg);
  const { l, w, h, a, b, t, axis, sk, cube, sq } = c;
  const u = sk.u, shape = sq ? 'square' : 'rectangle';
  const opts: Opt[] = [
    { t: `${an(String(a))} ${by(a, b, u)} ${shape}`, ok: true, say: `Yes: the cut is parallel to the ${axis === 0 ? 'ends' : axis === 1 ? 'front' : 'bottom'}, so its sides run along the ${u2(a, u)} and ${u2(b, u)} edges.` },
    { t: `the ${u2(t, u)} thick piece that is cut off`, mc: 'mc.shapes.cross-section-as-piece-face-or-silhouette', say: `The piece is a solid: it has thickness. The cross-section is only the flat face the cut leaves, ${by(a, b, u)}.` },
  ];
  if (cube) opts.push({ t: `${an(String(a))} ${by(a, t, u)} rectangle`, mc: MC.piece, say: `That is a side of the cut-off piece. The cross-section is where the cut goes through the cube: ${an(String(a))} ${by(a, b, u)} square.` });
  else if (axis !== 2) opts.push({ t: `${an(String(l))} ${by(l, w, u)} rectangle`, mc: MC.copiesBase, say: `That copies the bottom face. This cut stands up, so it copies the ${axis === 0 ? 'end faces' : 'front face'}: ${by(a, b, u)}.` });
  else opts.push({ t: `${an(String(l))} ${by(l, h, u)} rectangle`, mc: MC.piece, say: `That is the front face, the outline you see from the front. A level cut has the shape of the bottom: ${by(a, b, u)}.` });
  return choiceItem({
    id: `name-${n}`, family: 'name',
    prompt: `${an(sk.what) === 'an' ? 'An' : 'A'} ${A(`${sk.what} ${u2(l, u)} long, ${u2(w, u)} wide and ${u2(h, u)} tall`)} is cut ${B(`${cutWords(axis)}, ${fromWords(axis, t, u)}`)}. What is the cross-section?`,
    board: `${tt('section')} = \\,?`, picture: boxPicture(c) as never, solution: boxSolution(c),
  }, R, opts);
};

// 2. the size of that cross-section (two lengths, either order)   [cs-plane-section-parallel, cs-perpendicular-orientation]
const dims: Gen = (R, n, sg) => {
  const c = boxCut(R, sg);
  const { l, w, h, a, b, t, axis, sk } = c, u = sk.u;
  const wrongs: PairWrong[] = [];
  if (axis !== 2) wrongs.push({ v: [l, w], mc: MC.copiesBase, say: `${by(l, w, u)} is the bottom face. This cut stands up, ${axis === 0 ? 'parallel to the ends' : 'parallel to the front'}: its sides run along the ${u2(a, u)} and ${u2(b, u)} edges.` });
  wrongs.push({ v: [t, a], mc: MC.piece, say: `${u2(t, u)} is how thick the cut-off piece is. The cross-section is flat: only the ${u2(a, u)} and ${u2(b, u)} edges count.` });
  wrongs.push({ v: [t, b], mc: MC.piece, say: `${u2(t, u)} is how thick the cut-off piece is. The cross-section is flat: only the ${u2(a, u)} and ${u2(b, u)} edges count.` });
  const others = ([[l, w], [l, h], [w, h]] as [number, number][]).filter(p => !((p[0] === a && p[1] === b) || (p[0] === b && p[1] === a)) && !(axis !== 2 && p[0] === l && p[1] === w));
  for (const o of others) wrongs.push({ v: o, mc: MC.piece, say: `${by(o[0], o[1], u)} is another face of the ${sk.what}. A cut ${cutWords(axis)} has the shape of the ${axis === 0 ? 'ends' : axis === 1 ? 'front' : 'bottom'}.` });
  const it: Item = {
    id: `dims-${n}`, family: 'dims',
    prompt: `${an(sk.what) === 'an' ? 'An' : 'A'} ${A(`${sk.what} ${u2(l, u)} long, ${u2(w, u)} wide and ${u2(h, u)} tall`)} is cut ${B(`${cutWords(axis)}, ${fromWords(axis, t, u)}`)}. How long are the sides of the cross-section, in ${u === 'ft' ? 'feet' : 'inches'}?`,
    board: `? \\times ?`, input: 'pair', pairLead: 'The cross-section is', pairOp: '×',
    picture: boxPicture(c) as never, solution: boxSolution(c),
    answer: { kind: 'pair', x: a, y: b },
    check: r => pairCheck(r, a, b, `Yes: ${by(a, b, u)}. ${c.sq ? 'A square.' : 'A rectangle.'}`, wrongs, `Not quite. Which edges does the cut run along? It is ${cutWords(axis)}.`),
  };
  if (axis !== 2 && !(l === a && w === b) && !(l === b && w === a)) probe(it, { kind: 'pair', x: l, y: w }, MC.copiesBase);
  if (t !== b && !(t === a && a === b)) probe(it, { kind: 'pair', x: t, y: a }, MC.piece);
  return it;
};

// 3. which way to cut for a given rectangle; the slanted cut through two opposite edges   [cs-perpendicular-orientation]
const orient: Gen = (R, n) => {
  const sk = pick(R, BOXES), u = sk.u;
  const [l, w, h] = boxDims(R, u);
  const solid: SolidSpec = { kind: 'box', l, w, h };
  if (R() < 0.6) {
    const axis = pick(R, [0, 1, 2] as const), [a, b] = secDims(axis, l, w, h);
    const t = Math.max(1, Math.floor((axis === 0 ? l : axis === 1 ? w : h) / 2));
    const say = (ax: 0 | 1 | 2) => { const [p, q] = secDims(ax, l, w, h); return `A cut ${cutWords(ax)} gives ${by(p, q, u)}.`; };
    const opts: Opt[] = ([0, 1, 2] as const).map(ax => ({
      t: ax === 2 ? 'a level cut, parallel to the bottom' : ax === 1 ? 'a standing cut, parallel to the front' : 'a standing cut, parallel to the ends',
      ok: ax === axis, mc: ax === 2 && axis !== 2 ? MC.copiesBase : undefined,
      say: ax === axis ? `Yes. ${say(ax)}` : ax === 2 ? `${say(2)} Not every cut copies the bottom: ${by(a, b, u)} needs a cut parallel to the ${axis === 0 ? 'ends' : 'front'}.` : `${say(ax)} You need ${by(a, b, u)}.`,
    }));
    return choiceItem({
      id: `or-${n}`, family: 'orient',
      prompt: `This ${A(`${sk.what}`)} is ${u2(l, u)} long, ${u2(w, u)} wide and ${u2(h, u)} tall. Which cut gives ${an(String(a))} ${S(by(a, b, u))} cross-section?`,
      board: texBy(a, b, u) + '\\,?',
      picture: { kind: 'slice', solid, pose: 'upright', unit: u, planes: [planeAxis(axis, t)], dims: ['l', 'w', 'h'], hidePlanes: true, hero: [tt('rectangle'), texBy(a, b, u)] } as never,
      solution: [`A cut parallel to a face has the same shape and size as that face.`, `${by(a, b, u)} is the ${axis === 0 ? 'end faces' : axis === 1 ? 'front face' : 'bottom face'}: cut ${cutWords(axis)}.`],
    }, R, opts);
  }
  // the slanted cut through two opposite edges: a rectangle with one side = that edge, the other side a face diagonal
  const alongX = R() < 0.6;
  const plane = alongX ? planeThrough([0, 0, h], [l, 0, h], [0, w, 0]) : planeThrough([0, 0, h], [0, w, h], [l, 0, 0]);
  const keep = alongX ? l : w, m = alongX ? Math.max(w, h) : Math.max(l, h);
  const sec = sectionOf(solid, plane);
  const sh = shapeOf(sec.pts);
  if (sh.name !== 'rectangle' && sh.name !== 'square') throw new Error('orient: the slanted cut is not a rectangle');
  const opts: Opt[] = [
    { t: `a rectangle: one side ${u2(keep, u)}, the other longer than ${u2(m, u)}`, ok: true, say: `Yes. One side is the ${u2(keep, u)} edge the cut runs along. The other crosses a face corner to corner, so it is longer than any edge of that face.` },
    { t: `${an(String(l))} ${by(l, w, u)} rectangle, the same as the bottom`, mc: MC.copiesBase, say: `A slanted cut does not copy the bottom. One side is the ${u2(keep, u)} edge; the other runs corner to corner across a face, longer than ${u2(m, u)}.` },
    { t: `a rectangle: one side ${u2(keep, u)}, the other shorter than ${u2(Math.min(alongX ? w : l, h), u)}`, say: `The slanted side runs corner to corner across a face, so it is LONGER than that face's edges, not shorter.` },
  ];
  return choiceItem({
    id: `or-d-${n}`, family: 'orient',
    prompt: `This ${A(`${sk.what}`)} is ${u2(l, u)} long, ${u2(w, u)} wide and ${u2(h, u)} tall. A ${B('slanted cut')} runs from one top edge down to the opposite bottom edge. What is the cross-section?`,
    board: `${tt('section')} = \\,?`,
    picture: { kind: 'slice', solid, pose: 'upright', unit: u, planes: [plane], dims: ['l', 'w', 'h'], hero: [tt('rectangle'), `${keep}\\text{ ${u}} \\times (> ${m}\\text{ ${u}})`] } as never,
    solution: [`The cut contains two opposite edges of the ${sk.what}, each ${u2(keep, u)} long: those are two sides.`, `The other two sides cross the end faces corner to corner, longer than ${u2(m, u)}.`, `So it is a rectangle, ${u2(keep, u)} by more than ${u2(m, u)} (no need to work out the exact length).`],
  }, R, opts);
};

// =====================================================================================================
// pyramids
const FRACS = [{ t: 1 / 4, w: 'a quarter of the way' }, { t: 1 / 3, w: 'a third of the way' }, { t: 1 / 2, w: 'halfway' }, { t: 2 / 3, w: 'two thirds of the way' }, { t: 3 / 4, w: 'three quarters of the way' }];
function pyrDims(R: () => number, even = false): [number, number, number] {
  for (let k = 0; k < 50; k++) {
    const l = even ? 2 * int(R, 2, 6) : int(R, 4, 10), w = even ? 2 * int(R, 1, l / 2 - 1) : int(R, 3, l - 1);
    const h = int(R, Math.max(3, Math.ceil(0.6 * l)), Math.max(4, l + 1));   // tall enough that the slanted faces read
    if (l !== w && w >= 2 && l <= 3 * w) return [l, w, h];
  }
  return even ? [8, 4, 5] : [6, 4, 4];
}
const poseWords = (p: Pose) => (p === 'upright' ? '' : p === 'upsideDown' ? ' It is shown upside down.' : ' It is lying on one of its triangle faces.');

// 4. slices parallel to the base shrink toward the apex   [cs-pyramid-tapering]
const taper: Gen = (R, n) => {
  const what = pick(R, PYRS), u = 'in';
  const [l, w, h] = pyrDims(R);
  const solid: SolidSpec = { kind: 'pyramid', l, w, h };
  const pose: Pose = pick(R, ['upright', 'upright', 'upsideDown', 'onFace'] as const);
  const mode = pose === 'onFace' && R() < 0.3 ? 'base' : pick(R, ['shape', 'shape', 'compare', 'apex'] as const);
  const intro = `This ${A(what)} is a right rectangular pyramid with ${an(String(l))} ${by(l, w, u)} base.${poseWords(pose)}`;
  if (mode === 'base') {
    return choiceItem({
      id: `tp-b-${n}`, family: 'taper', prompt: `${intro} Which face is its base?`, board: `${tt('base')} = \\,?`,
      picture: { kind: 'slice', solid, pose, unit: u, planes: [], dims: ['l', 'w'], glow: 'base', hero: [tt('the rectangle')] } as never,
      solution: ['The base of a pyramid is the face that is not a triangle: here, the rectangle.', 'It stays the base whichever face the pyramid rests on.'],
    }, R, [
      { t: 'the rectangle face', ok: true, say: 'Yes: the base is the rectangle, whichever way the pyramid lies.' },
      { t: 'the triangle face it is lying on', mc: MC.baseBottom, say: 'The face it rests on is not always the base. The base is the rectangle; the triangles meet at the apex.' },
      { t: 'the triangle face on top', say: 'The four triangles are the side faces; they meet at the apex. The base is the rectangle.' },
    ]);
  }
  if (mode === 'apex') {
    return choiceItem({
      id: `tp-a-${n}`, family: 'taper', prompt: `${intro} A ${B('plane parallel to the base')} goes through the apex. What is the cross-section?`, board: `${tt('section')} = \\,?`,
      picture: { kind: 'slice', solid, pose, unit: u, planes: [planeAxis(2, h)], dims: ['l', 'w'], noFlat: true, hero: [tt('a point')] } as never,
      solution: ['Slices parallel to the base get smaller as they get closer to the apex.', 'At the apex there is nothing left but one point.'],
    }, R, [
      { t: 'a single point', ok: true, say: 'Yes: the slices shrink toward the apex, and at the apex only a point is left.' },
      { t: `${an(String(l))} ${by(l, w, u)} rectangle, the same as the base`, mc: MC.copiesBase, say: 'Slices of a pyramid shrink as they move toward the apex. At the apex the slice is just a point.' },
      { t: 'a small triangle', mc: MC.allTriangle, say: 'A slice parallel to the base is never a triangle. Near the apex it is a tiny rectangle; at the apex, a point.' },
    ]);
  }
  if (mode === 'compare') {
    // two slices clearly apart (at least a third of the height between them)
    const pairsFar = FRACS.flatMap((a, i) => FRACS.slice(i + 1).filter(b => b.t - a.t >= 1 / 3 - 1e-9).map(b => [a, b] as const));
    const [f1, f2] = pick(R, pairsFar);
    const nearFirst = R() < 0.5;
    const planes = nearFirst ? [planeAxis(2, f1.t * h), planeAxis(2, f2.t * h)] : [planeAxis(2, f2.t * h), planeAxis(2, f1.t * h)];
    const bigName = nearFirst ? 'A' : 'B', smallName = nearFirst ? 'B' : 'A';
    // which slice is lower in the picture (the world)? upside down, the one nearer the base is the higher one
    const nearIsLower = pose === 'upright';
    return choiceItem({
      id: `tp-c-${n}`, family: 'taper', prompt: `${intro} Planes ${B('A')} and ${B('B')} are both parallel to the base. Which cross-section is larger?`, board: `A\\ \\text{or}\\ B\\,?`,
      picture: { kind: 'slice', solid, pose, unit: u, planes, planeNames: ['A', 'B'], dims: ['l', 'w'], noFlat: true, hero: [tt(`${bigName} is larger`)] } as never,
      solution: ['Slices parallel to the base shrink as they move from the base toward the apex.', `${bigName} is nearer the base, so its rectangle is larger.`],
    }, R, [
      { t: `${bigName}`, ok: true, say: `Yes: ${bigName} is nearer the base. The side faces lean in toward the apex, so slices shrink as they move away from the base.` },
      { t: `${smallName}`, mc: nearIsLower ? undefined : MC.baseBottom, say: nearIsLower ? `${smallName} is nearer the apex, where the pyramid is narrow.` : `The base is the rectangle, not the face nearest the bottom of the picture. ${smallName} is nearer the apex, so it is smaller.` },
      { t: 'They are the same size', mc: MC.copiesBase, say: 'Slices of a pyramid do not all copy the base: they shrink toward the apex.' },
    ]);
  }
  const f = pick(R, FRACS);
  return choiceItem({
    id: `tp-s-${n}`, family: 'taper', prompt: `${intro} A ${B('plane parallel to the base')} cuts it ${f.w} from the base to the apex. What is the cross-section?`, board: `${tt('section')} = \\,?`,
    picture: { kind: 'slice', solid, pose, unit: u, planes: [planeAxis(2, f.t * h)], dims: ['l', 'w'], sideLabels: f.t === 0.5 ? 'auto' : 'none', hero: [tt('smaller rectangle')] } as never,
    solution: ['A cut parallel to the base crosses the 4 side faces: 4 sides, each parallel to a base edge, so a rectangle.', 'The side faces lean in toward the apex, so the rectangle is smaller than the base.'],
  }, R, [
    { t: 'a rectangle, smaller than the base', ok: true, say: 'Yes: a rectangle, because each side is parallel to a base edge, and smaller, because the side faces lean in toward the apex.' },
    { t: `${an(String(l))} ${by(l, w, u)} rectangle, the same as the base`, mc: MC.copiesBase, say: 'That would be true for a box. A pyramid narrows toward the apex, so the slice is a smaller rectangle.' },
    { t: 'a triangle, like the side faces', mc: MC.allTriangle, say: 'A cut parallel to the base crosses all 4 side faces: 4 sides. It is a smaller rectangle.' },
  ]);
};

// 5. halfway up: half as long and half as wide   [cs-pyramid-tapering]
const half: Gen = (R, n) => {
  const what = pick(R, PYRS), u = 'in';
  const [l, w, h] = pyrDims(R, true);
  const pose: Pose = pick(R, ['upright', 'upright', 'upsideDown', 'onFace'] as const);
  const it: Item = {
    id: `half-${n}`, family: 'half',
    prompt: `This ${A(what)} is a right rectangular pyramid with ${an(String(l))} ${by(l, w, u)} base.${poseWords(pose)} A ${B('plane parallel to the base')} cuts it halfway from the base to the apex. How long are the sides of the cross-section?`,
    board: `? \\times ?`, input: 'pair', pairLead: 'The cross-section is', pairOp: '×',
    picture: { kind: 'slice', solid: { kind: 'pyramid', l, w, h }, pose, unit: u, planes: [planeAxis(2, h / 2)], dims: ['l', 'w'], hero: [tt('rectangle'), texBy(l / 2, w / 2, u)] } as never,
    solution: ['Halfway to the apex, every side face has come halfway in toward the apex.', `So the rectangle is half as long and half as wide as the base: ${byS(l / 2, w / 2, u)}.`],
    answer: { kind: 'pair', x: l / 2, y: w / 2 },
    check: r => pairCheck(r, l / 2, w / 2, `Yes: half of ${l} and half of ${w}, ${by(l / 2, w / 2, u)}.`,
      [{ v: [l, w], mc: MC.copiesBase, say: `${by(l, w, u)} is the base itself. Halfway to the apex the pyramid is narrower: half as long and half as wide.` }],
      `Not quite. Halfway up, the slice is half as long and half as wide as the ${by(l, w, u)} base.`),
  };
  probe(it, { kind: 'pair', x: l, y: w }, MC.copiesBase);
  return it;
};

// 6. slices perpendicular to the base: a triangle through the apex, a trapezoid when it misses   [cs-pyramid-perpendicular]
function uprightCut(R: () => number, allowDiag: boolean) {
  const what = pick(R, PYRS), u = 'in';
  const [l, w, h] = pyrDims(R);
  const solid: SolidSpec = { kind: 'pyramid', l, w, h };
  const kind = allowDiag ? pick(R, ['apexL', 'apexW', 'diag', 'off', 'off', 'off'] as const) : pick(R, ['apexL', 'apexW', 'off', 'off'] as const);
  let plane: Plane, edgeLen = 0, words: string;
  const offAlongX = R() < 0.5;
  if (kind === 'apexL') { plane = planeAxis(1, w / 2); edgeLen = l; words = `parallel to the ${u2(l, u)} edges, through the apex`; }
  else if (kind === 'apexW') { plane = planeAxis(0, l / 2); edgeLen = w; words = `parallel to the ${u2(w, u)} edges, through the apex`; }
  else if (kind === 'diag') { plane = planeUpright([0, 0, 0], [l, w, 0]); words = 'along a diagonal of the base, through the apex'; }
  else {
    const D = offAlongX ? l : w, q = pick(R, [0.25, 0.75]);
    plane = planeAxis(offAlongX ? 0 : 1, D * q);
    edgeLen = offAlongX ? w : l;
    words = `parallel to the ${u2(edgeLen, u)} edges, missing the apex`;
  }
  const sh = shapeOf(sectionOf(solid, plane).pts);
  const expect = kind === 'off' ? 'trapezoid' : 'triangle';
  if (sh.name !== expect) throw new Error(`upright: expected a ${expect}, got ${sh.name}`);
  return { what, u, l, w, h, solid, kind, plane, edgeLen, words, shape: expect as 'triangle' | 'trapezoid' };
}
const upright: Gen = (R, n) => {
  const c = uprightCut(R, true);
  const { what, u, l, w, solid, kind, plane, edgeLen, words, shape } = c;
  const off = kind === 'off';
  const hero = [tt(shape)];
  if (kind !== 'diag') hero.push(`${tt('bottom')}\\ ${edgeLen}\\text{ ${u}}`);
  return choiceItem({
    id: `up-${n}`, family: 'upright',
    prompt: `This ${A(what)} is a right rectangular pyramid with ${an(String(l))} ${by(l, w, u)} base. A ${B('plane perpendicular to the base')} cuts it ${B(words)}. What shape is the cross-section?`,
    board: `${tt('shape')} = \\,?`,
    picture: { kind: 'slice', solid, pose: 'upright', unit: u, planes: [plane], dims: ['l', 'w'], hero } as never,
    solution: off
      ? ['The plane crosses the base, two slanted side faces and the face in front of the apex: 4 faces, 4 sides.', 'The top side is shorter than the bottom (the faces lean in), and the two are parallel: a trapezoid.']
      : ['Through the apex, the plane crosses the base and two side faces that meet at the apex: 3 faces, 3 sides.', 'The two slanted sides meet at the apex: a triangle.'],
  }, R, [
    { t: 'a triangle', ok: !off, mc: off ? MC.allTriangle : undefined, say: off ? 'Only a cut through the apex makes the slanted sides meet. This one misses the apex, so there is a fourth side on top: a trapezoid.' : 'Yes: through the apex, the two slanted sides meet at the apex.' },
    { t: 'a trapezoid', ok: off, say: off ? 'Yes: it misses the apex, so there is a short top side, parallel to the bottom.' : 'This cut goes through the apex, so the slanted sides meet there: a triangle, no top side.' },
    { t: 'a rectangle', mc: off ? MC.offApexRect : undefined, say: off ? 'That would be true for a box. A pyramid leans in, so the top side is shorter than the bottom: a trapezoid.' : 'A pyramid leans in toward the apex, so a standing slice is never a rectangle. Through the apex it is a triangle.' },
  ]);
};

// 7. the bottom side of a standing slice is a base edge   [cs-pyramid-perpendicular]
const bottom: Gen = (R, n) => {
  const c = uprightCut(R, false);
  const { what, u, l, w, h, solid, plane, edgeLen, words, shape } = c;
  const other = edgeLen === l ? w : l;
  return {
    id: `bt-${n}`, family: 'bottom',
    prompt: `This ${A(what)} is a right rectangular pyramid with ${an(String(l))} ${by(l, w, u)} base, ${u2(h, u)} tall. A ${B('plane perpendicular to the base')} cuts it ${B(words)}. How long is the bottom side of the cross-section?`,
    board: `${tt('bottom')} = \\,?`, input: 'num', unit: u,
    picture: { kind: 'slice', solid, pose: 'upright', unit: u, planes: [plane], dims: ['l', 'w', 'h'], hero: [tt(shape), `${tt('bottom')}\\ ${edgeLen}\\text{ ${u}}`] } as never,
    solution: ['The bottom side is where the plane crosses the base.', `The plane is parallel to the ${u2(edgeLen, u)} edges, so the bottom side runs right across the base, ${S(u2(edgeLen, u))} long.`],
    answer: { kind: 'num', v: edgeLen },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (r.v === edgeLen) return { ok: true, say: `Yes: the bottom side lies in the base, parallel to the ${u2(edgeLen, u)} edges, so it is ${u2(edgeLen, u)} too.` };
      if (r.v === other) return { ok: false, say: `${u2(other, u)} is the other base edge. The cut is parallel to the ${u2(edgeLen, u)} edges, so the bottom side matches them.` };
      if (r.v === h) return { ok: false, say: `${u2(h, u)} is the height. The bottom side lies in the base, parallel to the ${u2(edgeLen, u)} edges.` };
      return { ok: false, say: `Look at the base: the bottom side runs across it, parallel to the ${u2(edgeLen, u)} edges.` };
    },
  };
};

// =====================================================================================================
// oblique cuts of a box: marked points on the edges
interface Oblique { solid: SolidSpec; plane: Plane; pts: V3[]; faces: FaceName[] }
const FR = [0.25, 1 / 3, 0.5, 2 / 3, 0.75];
/** is this section easy to read? vertices apart, away from corners, no thin angle */
function readable(solid: SolidSpec, pts: V3[]): boolean {
  const m = Math.min(solid.l, solid.w, solid.h);
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (len(sub(pts[i]!, pts[j]!)) < 0.32 * m) return false;
  for (const p of pts) for (const v of solidVerts(solid)) if (len(sub(p, v)) < 0.2 * m) return false;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[(i - 1 + pts.length) % pts.length]!, b = pts[i]!, c = pts[(i + 1) % pts.length]!;
    const cos = dot(unit(sub(a, b)), unit(sub(c, b)));
    if (cos > Math.cos(28 * Math.PI / 180)) return false;
  }
  return true;
}
/** a plane through 3 points on edges with exactly k sides, crossing face interiors only (random, then a fixed search) */
export function findPlane(solid: SolidSpec, k: number, R?: () => number): Oblique | null {
  const E = edgesOf(solidFaces(solid));
  const tryOne = (e: number[], f: number[]): Oblique | null => {
    const P = e.map((ei, i) => lerp3(E[ei]!.a, E[ei]!.b, f[i]!)) as [V3, V3, V3];
    if (len(cross(sub(P[1], P[0]), sub(P[2], P[0]))) < 1e-6) return null;
    const plane = planeThrough(P[0], P[1], P[2]);
    const s = sectionOf(solid, plane);
    if (s.kind !== 'polygon' || s.throughVertex || s.containsEdge || s.pts.length !== k || s.crossed.length !== k) return null;
    if (solid.kind === 'pyramid' && solidVerts(solid).some(v => Math.abs(dot(plane.n, v) - plane.d) < 1e-6)) return null;
    if (!readable(solid, s.pts)) return null;
    return { solid, plane, pts: s.pts, faces: s.sideFaces };
  };
  if (R) for (let t = 0; t < 700; t++) {
    const e = shuffle(R, E.map((_, i) => i)).slice(0, 3), f = [pick(R, FR), pick(R, FR), pick(R, FR)];
    const o = tryOne(e, f);
    if (o) return o;
  }
  for (let a = 0; a < E.length; a++) for (let b = a + 1; b < E.length; b++) for (let c = b + 1; c < E.length; c++)
    for (const fa of FR) for (const fb of FR) for (const fc of FR) { const o = tryOne([a, b, c], [fa, fb, fc]); if (o) return o; }
  return null;
}
/** the hexagon through the midpoints of six edges (any box): the most sides a box can give */
function hexPlane(s: SolidSpec): Plane { return planeThrough([s.l, s.w / 2, 0], [s.l / 2, 0, 0], [0, 0, s.h / 2]); }
const LETTERS = ['P', 'Q', 'R', 'S', 'T', 'U'];
function obliqueBox(R: () => number, k: number) {
  const cube = R() < 0.5;
  const sk = cube ? { what: pick(R, CUBES), u: 'in' } : pick(R, BOXES.filter(b => b.u === 'in'));
  for (let t = 0; t < 6; t++) {
    const [l, w, h] = cube ? (() => { const s = int(R, 4, 8); return [s, s, s] as [number, number, number]; })() : boxDims(R, 'in');
    const solid: SolidSpec = { kind: 'box', l, w, h };
    const o = findPlane(solid, k, R);
    if (o) return { cube, sk, o };
  }
  const solid: SolidSpec = { kind: 'box', l: 6, w: 6, h: 6 };
  return { cube: true, sk: { what: 'wooden cube', u: 'in' }, o: k === 6 ? { solid, plane: hexPlane(solid), pts: sectionOf(solid, hexPlane(solid)).pts, faces: sectionOf(solid, hexPlane(solid)).sideFaces } : findPlane(solid, k)! };
}

// 8. join two marked points only across a face they share   [cs-oblique-trace]
const join: Gen = (R, n) => {
  const k = pick(R, [4, 5, 5, 6]);
  const { sk, o } = obliqueBox(R, k);
  const names = shuffle(R, LETTERS.slice(0, o.pts.length));
  const N = o.pts.length;
  const j = int(R, 0, N - 1), a = names[j]!, b = names[(j + 1) % N]!;
  const nonAdj: [number, number][] = [];
  for (let p = 0; p < N; p++) for (let q = p + 2; q < N; q++) if (!(p === 0 && q === N - 1)) nonAdj.push([p, q]);
  const [x1, x2] = shuffle(R, nonAdj).slice(0, 2) as [[number, number], [number, number]];
  const face = FACE_WORDS[o.faces[j]!];
  const pair = (p: number, q: number) => [names[p]!, names[q]!].sort().join(' and ');
  const wrongSay = (p: number, q: number) => `${pair(p, q)} are not on a common face: a segment between them would run through the inside of the ${sk.what}. A side of the cross-section always lies on a face.`;
  return choiceItem({
    id: `jn-${n}`, family: 'join',
    prompt: `A ${B('flat cut')} goes through this ${A(sk.what)} and crosses its edges at the marked points. Which two points are joined by a side of the cross-section?`,
    board: `${tt('join')}\\ ?\\,?`,
    picture: { kind: 'slice', solid: o.solid, pose: 'upright', unit: sk.u, planes: [o.plane], dims: [], points: o.pts.map((p, i) => ({ name: names[i]!, at: p })), hidePlanes: true, sideLabels: 'none', hero: [`${tt(`${N} sides`)}`, tt('one per face')] } as never,
    solution: ['Each side of a cross-section is where the cut crosses one face.', `${[a, b].sort().join(' and ')} both lie on the ${face}, so they are joined by a side.`, 'Join points only across a face they share; going round face by face gives the whole shape.'],
  }, R, [
    { t: pair(j, (j + 1) % N), ok: true, say: `Yes: ${[a, b].sort().join(' and ')} both lie on the ${face}, so the cut crosses that face from one to the other.` },
    { t: pair(x1[0], x1[1]), mc: MC.joinsInterior, say: wrongSay(x1[0], x1[1]) },
    { t: pair(x2[0], x2[1]), mc: MC.joinsInterior, say: wrongSay(x2[0], x2[1]) },
  ]);
};

// 9. count the sides: one per face crossed   [cs-oblique-trace]
const count: Gen = (R, n) => {
  const k = pick(R, [3, 4, 5, 5, 6]);
  const { sk, o, cube } = obliqueBox(R, k);
  const N = o.pts.length, nm = shapeOf(o.pts).name;
  const quad = ['rectangle', 'square', 'trapezoid', 'parallelogram', 'rhombus'].includes(nm) ? nm : 'quadrilateral';
  const nameOf = (m: number) => (m === 4 ? (m === N ? quad : 'quadrilateral') : SIDE_NAMES[m]!);
  const opts: Opt[] = [{ t: `${N} sides: ${an(nameOf(N))} ${nameOf(N)}`, ok: true, say: `Yes: the cut crosses ${N} faces, one side on each.` }];
  if (cube && N !== 4) opts.push({ t: '4 sides: a square or a rectangle', mc: MC.cubeOnlyRect, say: `Cubes can be cut into other shapes too. This cut crosses ${N} faces, so the cross-section has ${N} sides.` });
  const more = cube && N + 1 === 4 ? N + 2 : N + 1;
  if (more <= 8) opts.push({ t: `${more} sides: ${an(nameOf(more))} ${nameOf(more)}`, mc: MC.moreSides, say: `The cut crosses only ${N} faces, and each face holds exactly one side. Count the marked points: ${N}.` });
  if (opts.length < 3) opts.push(N - 1 >= 3 ? { t: `${N - 1} sides: ${an(nameOf(N - 1))} ${nameOf(N - 1)}`, say: `Count the marked points: there are ${N}, one corner of the cross-section each.` } : { t: `${N + 2} sides: ${an(nameOf(N + 2))} ${nameOf(N + 2)}`, mc: MC.moreSides, say: `Each face crossed gives one side. ${N} faces, ${N} sides.` });
  return choiceItem({
    id: `ct-${n}`, family: 'count',
    prompt: `A ${B('flat cut')} goes through this ${A(sk.what)}. It crosses the edges at the marked points. How many sides does the cross-section have?`,
    board: `${tt('sides')} = \\,?`,
    picture: { kind: 'slice', solid: o.solid, pose: 'upright', unit: sk.u, planes: [o.plane], dims: [], points: o.pts.map((p, i) => ({ name: LETTERS[i]!, at: p })), sideLabels: 'none', hero: [tt(`${N} faces crossed`), tt(`${N} sides`)] } as never,
    solution: ['Go round face by face: each face the cut crosses gives one side.', `The cut crosses ${N} faces, so the cross-section has ${N} sides: ${an(nameOf(N))} ${nameOf(N)}.`],
  }, R, opts);
};

// 10. corner cuts: equilateral only when the three cuts are equally far from the corner   [cs-oblique-trace]
const equi: Gen = (R, n) => {
  const cube = R() < 0.55;
  const sk = cube ? { what: pick(R, CUBES), u: 'in' } : pick(R, BOXES.filter(b => b.u === 'in'));
  // a compact solid (every edge 4 to 8 in), so the corner triangle is big enough to read
  const [l, w, h] = cube ? (() => { const s = int(R, 4, 8); return [s, s, s] as [number, number, number]; })() : (() => {
    for (let k = 0; k < 40; k++) { const d = [int(R, 5, 8), int(R, 4, 7), int(R, 4, 7)] as [number, number, number]; if (new Set(d).size === 3) return d; }
    return [7, 5, 4] as [number, number, number];
  })();
  const m = Math.min(l, w, h);
  const same = R() < 0.45;
  // the three points are at least 2 units from the corner, so the triangle is big enough to read
  const lo = m >= 4 ? 2 : 1;
  let a = int(R, lo, m - 1), b = a, c = a;
  if (!same) { for (let t = 0; t < 30 && a === b && b === c; t++) { b = int(R, lo, Math.min(w, m + 2) - 1); c = int(R, lo, Math.min(h, m + 2) - 1); } if (a === b && b === c) b = a === lo ? lo + 1 : a - 1; }
  b = Math.min(b, w - 1); c = Math.min(c, h - 1); a = Math.min(a, l - 1);
  const eq = a === b && b === c;
  const C: V3 = [l, 0, h], P: V3 = [l - a, 0, h], Q: V3 = [l, b, h], Rr: V3 = [l, 0, h - c];
  const plane = planeThrough(P, Q, Rr);
  const sh = shapeOf(sectionOf({ kind: 'box', l, w, h }, plane).pts);
  if (sh.name !== 'triangle' || sh.equalSides !== eq) throw new Error('equi: the corner cut is not what it should be');
  const u = sk.u;
  const opts: Opt[] = eq ? [
    { t: 'Yes: all three cuts are the same distance from the corner', ok: true, say: 'Yes: equal distances from the corner make three equal sides.' },
    { t: 'Yes: every corner cut gives an equilateral triangle', mc: MC.cornerEqui, say: 'The answer is yes, but not for that reason: a corner cut is equilateral only when the three distances are equal, as they are here.' },
    { t: 'No: a corner cut is never equilateral', say: 'It can be: when the three cuts are equally far from the corner, all three sides match.' },
  ] : [
    { t: 'No: the cuts are different distances from the corner', ok: true, say: 'Yes: unequal distances from the corner give unequal sides.' },
    { t: 'Yes: every corner cut gives an equilateral triangle', mc: MC.cornerEqui, say: `Only when all three distances are equal. Here they are ${a}, ${b} and ${c} ${u}, so the sides are not all equal.` },
    { t: 'It is not a triangle: corner cuts give squares', mc: MC.cubeOnlyRect, say: 'The cut crosses 3 faces round the corner, so it has 3 sides: a triangle.' },
  ];
  return choiceItem({
    id: `eq-${n}`, family: 'equi',
    prompt: `A ${B('flat cut')} slices a corner off this ${A(sk.what)}. It goes through P, Q and R, which are ${S(`${u2(a, u)}, ${u2(b, u)} and ${u2(c, u)}`)} from corner C along its three edges. Is the cross-section an equilateral triangle?`,
    board: tt('equilateral?'),
    picture: { kind: 'slice', solid: { kind: 'box', l, w, h }, pose: 'upright', unit: u, planes: [plane], dims: [], points: [{ name: 'P', at: P }, { name: 'Q', at: Q }, { name: 'R', at: Rr }, { name: 'C', at: C }], hidePlanes: true, sideLabels: 'none', hero: [tt('triangle'), tt(eq ? 'equilateral' : 'not equilateral')] } as never,
    solution: ['A corner cut crosses the 3 faces round the corner: a triangle.', eq ? 'All three points are the same distance from the corner, so the three sides are equal: equilateral.' : `The distances ${a}, ${b} and ${c} are not all equal, so the sides are not all equal: not equilateral.`],
  }, R, opts);
};

// =====================================================================================================
// 11. which polygons are possible? one side per face crossed rules shapes out; a real cut shows one is possible   [cs-section-possibility]
function solidFor(R: () => number) {
  const kind = pick(R, ['cube', 'box', 'pyramid'] as const);
  if (kind === 'cube') { const s = int(R, 4, 8); return { kind, what: 'cube', solid: { kind: 'box', l: s, w: s, h: s } as SolidSpec, dims: [] as Dim[] }; }
  if (kind === 'box') { const [l, w, h] = boxDims(R, 'in'); return { kind, what: 'box (a rectangular prism)', solid: { kind: 'box', l, w, h } as SolidSpec, dims: [] as Dim[] }; }
  const [l, w, h] = pyrDims(R); return { kind, what: 'right rectangular pyramid', solid: { kind: 'pyramid', l, w, h } as SolidSpec, dims: [] as Dim[] };
}
/** a cut with k sides for the worked solution: level, apex, hexagon, or a searched oblique one */
function exampleCut(s: SolidSpec, k: number, R: () => number): Plane {
  if (s.kind === 'box') {
    if (k === 6) return hexPlane(s);
    if (k === 4) return planeAxis(2, s.h / 2);
    if (k === 3) return planeThrough([s.l * 0.5, 0, s.h], [s.l, s.w * 0.5, s.h], [s.l, 0, s.h * 0.5]);
  } else {
    if (k === 4) return planeAxis(2, s.h / 2);
    if (k === 3) return planeAxis(0, s.l / 2);
  }
  const o = findPlane(s, k, R) ?? findPlane(s, k);
  if (!o) throw new Error(`no ${k}-sided cut of this solid`);
  return o.plane;
}
const possible: Gen = (R, n) => {
  const S0 = solidFor(R), F = faceCount(S0.solid), isPyr = S0.kind === 'pyramid';
  const k = isPyr ? pick(R, [3, 4, 5, 6, 6]) : pick(R, [3, 5, 6, 7, 8, 8]);
  const ok = k <= F;
  const plane = exampleCut(S0.solid, ok ? k : F, R);
  const shapeW = SIDE_NAMES[k]!;
  let opts: Opt[];
  if (ok) {
    opts = [
      { t: `Yes: a cut that crosses exactly ${k} faces makes one`, ok: true, say: `Yes. A cut that crosses ${k} faces has ${k} sides; the picture now shows one.` },
      isPyr
        ? (k === 3 ? { t: 'No: every cross-section of a pyramid is a rectangle, like its base', mc: MC.copiesBase, say: 'A cut through the apex, standing straight up, gives a triangle: the picture shows one.' }
          : { t: 'No: every cross-section of a pyramid is a triangle', mc: MC.allTriangle, say: `Only some cuts give triangles. This one crosses ${k} faces, so it has ${k} sides.` })
        : { t: `No: a ${S0.kind} can only be cut into squares and rectangles`, mc: MC.cubeOnlyRect, say: `Tilt the cut so it crosses ${k} faces and you get ${k} sides: the picture shows one.` },
      { t: `Yes: it has ${F} faces, so every shape with up to ${F} sides must work`, mc: MC.noExample, say: 'The yes is right, the reason is not. Counting faces only rules shapes OUT. To show a shape is possible, you need a real cut that makes it, like the one in the picture.' },
    ];
  } else {
    opts = [
      { t: `No: each side needs its own face, and a ${S0.kind} has only ${F} faces`, ok: true, say: `Yes: one side per face crossed, and only ${F} faces, so at most ${F} sides.` },
      { t: 'Yes: tilt the cut enough and any shape is possible', mc: MC.noExample, say: `A shape is possible only if a real cut makes it. Each side lies on its own face, so a ${S0.kind} gives at most ${F} sides.` },
      isPyr && k === 6 && R() < 0.5
        ? { t: 'Yes: a cube can be cut into a hexagon, so a pyramid can too', mc: MC.overgeneral, say: 'A cube has 6 faces; a rectangular pyramid has only 5. One side per face crossed: at most 5 sides.' }
        : { t: 'Yes: two sides of the cross-section can lie on the same face', mc: MC.moreSides, say: 'A face is flat, so the cut crosses it in one straight segment: one side per face, never two.' },
    ];
  }
  return choiceItem({
    id: `ps-${n}`, family: 'possible',
    prompt: `Can a flat cut through a ${A(S0.what)} make a cross-section that is ${an(shapeW)} ${S(shapeW)} (${k} sides)?`,
    board: tt(`${k} sides?`),
    picture: { kind: 'slice', solid: S0.solid, pose: 'upright', unit: 'in', planes: [plane], dims: S0.dims, hidePlanes: true, sideLabels: 'none', hero: ok ? [tt(`${k} faces crossed`), tt(`${k} sides: yes`)] : [tt(`${F} faces`), tt(`at most ${F} sides`)] } as never,
    solution: ok
      ? [`Each side of a cross-section lies on one face, one side per face crossed.`, `A cut that crosses ${k} faces gives ${k} sides. The picture shows a real one: that is what proves it is possible.`]
      : [`Each side of a cross-section lies on its own face.`, `A ${S0.kind} has ${F} faces, so a cross-section has at most ${F} sides. ${k} sides is impossible. The picture shows the most: ${F} sides.`],
  }, R, opts);
};

// 12. the most sides a cross-section can have = the number of faces   [cs-section-possibility]
const most: Gen = (R, n) => {
  const S0 = solidFor(R), F = faceCount(S0.solid), isPyr = S0.kind === 'pyramid';
  const plane = exampleCut(S0.solid, F, R);
  const it: Item = {
    id: `mo-${n}`, family: 'most',
    prompt: `What is the greatest number of sides a cross-section of a ${A(S0.what)} can have?`,
    board: tt('most sides?'), input: 'num', unit: 'sides',
    picture: { kind: 'slice', solid: S0.solid, pose: 'upright', unit: 'in', planes: [plane], dims: S0.dims, hidePlanes: true, sideLabels: 'none', hero: [tt(`${F} faces`), tt(`at most ${F} sides`)] } as never,
    solution: ['Each side of a cross-section lies on one face, and no face holds two sides.', `A ${S0.kind} has ${F} faces, so at most ${S(String(F))} sides, and the cut in the picture reaches ${F}.`],
    answer: { kind: 'num', v: F },
    check: r => {
      if (r.kind !== 'num' || !Number.isFinite(r.v)) return { ok: false, say: 'Type a number.' };
      if (r.v === F) return { ok: true, say: `Yes: ${F} faces, one side each, so ${F} sides at most, and a real cut reaches it.` };
      const V = isPyr ? 5 : 8, Ed = isPyr ? 8 : 12;
      if (r.v > F) return { ok: false, mc: MC.moreSides, say: `${r.v === V && !isPyr ? 'That is the number of corners. ' : r.v === Ed ? 'That is the number of edges. ' : ''}Each side needs its own face, and there are only ${F} faces.` };
      if (!isPyr && r.v === 4) return { ok: false, mc: MC.cubeOnlyRect, say: 'Squares and rectangles are not the end: a tilted cut can cross all 6 faces and make a hexagon.' };
      if (isPyr && r.v === 3) return { ok: false, mc: MC.allTriangle, say: 'Pyramid cuts are not all triangles: a level cut gives a rectangle, and a tilted one can cross all 5 faces.' };
      return { ok: false, say: `A cut can cross every face once. There are ${F} faces, so ${F} sides is the most.` };
    },
  };
  if (!isPyr) { probe(it, { kind: 'num', v: 8 }, MC.moreSides); probe(it, { kind: 'num', v: 4 }, MC.cubeOnlyRect); }
  else { probe(it, { kind: 'num', v: 8 }, MC.moreSides); probe(it, { kind: 'num', v: 3 }, MC.allTriangle); }
  return it;
};

export const GENS: Record<FamilyId, Gen> = { name, dims, orient, taper, half, upright, bottom, join, count, equi, possible, most };
