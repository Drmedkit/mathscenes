// items.ts: exercise families for "area and circumference of circles" (secondary-t5-21), generated from templates,
// checked exactly (pi-coefficients) or to the asked rounding, and every wrong answer the classifier recognises is
// tagged with its misconception id (math-curriculum-essentials/misconceptions.json). A generator gets the SUB-GOAL it
// practises (plan.ts) and uses that sub-goal's number ranges from the topic JSON. Pure: no DOM, no canvas.
import { type Item, type Response, type Verdict, fr, int, pick, shuffle } from '../../runtime/item';
import { type Look, type Pic, type Seg, PI, dec, layoutPic, near, piTex, roundTo } from './circleMaths';

export type FamilyId = 'whichSeg' | 'convertRD' | 'aroundAcross' | 'lengthOrArea' | 'gridBound' | 'piRatio' | 'cFromD' | 'cFromR'
  | 'aFromR' | 'aFromD' | 'approx' | 'chooseMeasure' | 'wedgeRead' | 'deriveArea' | 'scaleC' | 'scaleA' | 'scaleFrac'
  | 'propCheck' | 'claimJudge' | 'areaBack' | 'reverseC' | 'reverseA';
export const FAMILIES: readonly { id: FamilyId; name: string }[] = [
  { id: 'whichSeg', name: 'Name the segment' },
  { id: 'convertRD', name: 'Radius and diameter' },
  { id: 'aroundAcross', name: 'Around or across?' },
  { id: 'lengthOrArea', name: 'Length or area?' },
  { id: 'gridBound', name: 'Squares on the grid' },
  { id: 'piRatio', name: 'What pi is' },
  { id: 'cFromD', name: 'Circumference from d' },
  { id: 'cFromR', name: 'Circumference from r' },
  { id: 'aFromR', name: 'Area from r' },
  { id: 'aFromD', name: 'Area from d' },
  { id: 'approx', name: 'Exact or about' },
  { id: 'chooseMeasure', name: 'Pick the measure' },
  { id: 'wedgeRead', name: 'Read the wedges' },
  { id: 'deriveArea', name: 'Why A = πr²' },
  { id: 'scaleC', name: 'Scale the circumference' },
  { id: 'scaleA', name: 'Scale the area' },
  { id: 'scaleFrac', name: 'Shrink and stretch' },
  { id: 'propCheck', name: 'Proportional or not?' },
  { id: 'claimJudge', name: 'Check the claim' },
  { id: 'areaBack', name: 'Area factor back to r' },
  { id: 'reverseC', name: 'From C back to d' },
  { id: 'reverseA', name: 'From A back to r' },
];
export const FAMILY_NAMES: Record<string, string> = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));

/** the practice picture frame (the page draws the board to its right) */
export const PF = { x: 40, y: 70, w: 1200, h: 940 } as const;

export interface Solve { show?: string[]; hide?: string[]; hl?: number; tex?: string }
export interface CircleItem extends Item { family: FamilyId; pict?: { pic: Pic; rest?: string[]; solve: Solve } }
type Gen = (R: () => number, n: number, sg?: string) => CircleItem;

// ---------- misconception ids ----------
export const MC = {
  prototype: 'mc.shapes.prototype-only-recognition',
  anyInside: 'mc.circles.any-inside-segment-is-radius',
  chordDiam: 'mc.circles.every-chord-is-diameter',
  reversed: 'mc.circles.radius-diameter-conversion-reversed',
  dForR: 'mc.circles.diameter-for-radius',
  rForD: 'mc.circles.radius-or-semiaxis-as-full-width',
  sameAttr: 'mc.area-perimeter.thinks-area-and-perimeter-are-the-same-attribute',
  aroundAcross: 'mc.circles.distance-around-as-across',
  unitDim: 'mc.measurement-units.wrong-unit-dimension',
  rRect: 'mc.circles.area-as-radius-based-rectangle',
  piGrows: 'mc.circles.pi-not-a-fixed-ratio',
  piUnit: 'mc.circles.pi-retains-length-unit',
  pi314: 'mc.circles.pi-is-exactly-3-14',
  dSquared: 'mc.circles.squares-diameter-in-circumference',
  piSquared: 'mc.circles.squares-pi-with-radius',
  areaPerim: 'mc.area-perimeter.confuses-area-with-perimeter',
  powTimes: 'mc.exponents-roots.power-as-base-times-exponent',
  earlyRound: 'mc.decimals.intermediate-precision-always-invalid',
  lastRule: 'mc.angles.last-practiced-rule',
  rearrange: 'mc.area-perimeter.thinks-rearranging-changes-area',
  exactRect: 'mc.circles.wedge-rearrangement-exact-rectangle',
  dropHalf: 'mc.circles.drops-half-in-area-from-circumference',
  examples: 'mc.reasoning-language.examples-as-proof',
  areaToLen: 'mc.area-perimeter.applies-area-factor-to-lengths',
  additive: 'mc.ratio-rate.additive-keep-difference',
  areaByK: 'mc.area-perimeter.area-scales-by-length-factor',
  mulBigger: 'mc.mul-div.multiplication-makes-bigger',
  origin: 'mc.ratio-rate.origin-alone-means-proportional',
  allProp: 'mc.ratio-rate.scales-non-proportional',
  halveC: 'mc.circles.radius-from-circumference-halving',
  rootHalf: 'mc.exponents-roots.root-as-dividing-by-index',
  noRoot: 'mc.exponents-roots.stops-before-taking-root',
} as const;

/** the classified wrong answers of an item (tests: each must get exactly this misconception) */
export const PROBES = new WeakMap<Item, { r: Response; mc: string }[]>();

// ---------- reading answers ----------
/** the value of a typed answer: a number, a fraction or a mixed number (a decimal in the whole box counts too) */
export function valueOf(r: Response): number | null {
  if (r.kind === 'num') return Number.isFinite(r.v) ? r.v : null;
  if (r.kind === 'frac') {
    if (![r.w, r.n, r.d].every(Number.isFinite) || r.d <= 0 || r.n < 0 || r.w < 0) return null;
    return r.w + r.n / r.d;
  }
  return null;
}

// ---------- item builders ----------
type Base = Omit<CircleItem, 'input' | 'answer' | 'check' | 'choices'>;
interface Wrong { v: number; mc?: string; say: string }
/** a typed-number item: exact (tol ~0) or rounded (tol = half the asked place) */
function numeric(base: Base, o: { ans: number; tol?: number; frac?: [number, number]; input?: 'num' | 'frac'; right: string; wrongs: Wrong[]; other: string }): CircleItem {
  const tol = o.tol ?? 1e-6;
  const wrongs: Wrong[] = [];
  for (const w of o.wrongs) {
    if (!Number.isFinite(w.v) || Math.abs(w.v - o.ans) <= tol * 2 + 1e-9) continue;
    if (wrongs.some(x => Math.abs(x.v - w.v) <= tol * 2 + 1e-9)) continue;
    wrongs.push(w);
  }
  const input = o.input ?? 'num';
  const answer: Response = input === 'frac' ? (o.frac ? { kind: 'frac', w: 0, n: o.frac[0], d: o.frac[1] } : { kind: 'frac', w: o.ans, n: 0, d: 1 }) : { kind: 'num', v: o.ans };
  const it: CircleItem = {
    ...base, input, answer,
    check(r: Response): Verdict {
      const v = valueOf(r);
      if (v === null) return { ok: false, say: input === 'frac' ? 'Type a number: a whole number or decimal in the first box, or a fraction in the stacked boxes.' : 'Type a number (a decimal is fine).' };
      if (Math.abs(v - o.ans) <= tol + 1e-9) return { ok: true, say: o.right };
      for (const w of wrongs) if (Math.abs(v - w.v) <= tol + 1e-9) return { ok: false, mc: w.mc, say: w.say };
      return { ok: false, say: o.other };
    },
  };
  PROBES.set(it, wrongs.filter(w => w.mc).map(w => ({ r: input === 'frac' ? { kind: 'frac', w: w.v, n: 0, d: 1 } : { kind: 'num', v: w.v }, mc: w.mc! })));
  return it;
}
interface Opt { t: string; ok?: boolean; mc?: string; say: string }
function choice(R: () => number, base: Base, opts: Opt[], keepOrder = false): CircleItem {
  const o = keepOrder ? opts.slice() : shuffle(R, opts.slice());
  const i = o.findIndex(x => x.ok);
  const it: CircleItem = {
    ...base, input: 'choice', choices: o.map(x => x.t), answer: { kind: 'choice', i },
    check(r: Response): Verdict {
      if (r.kind !== 'choice' || !o[r.i]) return { ok: false, say: 'Pick one of the answers.' };
      const c = o[r.i]!;
      return { ok: !!c.ok, mc: c.mc, say: c.say };
    },
  };
  PROBES.set(it, o.map((x, j) => ({ x, j })).filter(({ x }) => !x.ok && x.mc).map(({ x, j }) => ({ r: { kind: 'choice', i: j } as Response, mc: x.mc! })));
  return it;
}

// ---------- words and numbers ----------
const P = 'π';
/** HTML of c·π: π, 8π, 49/4 π */
function piH(c: number, den = 1): string {
  if (den !== 1) return `${fr(c, den)}${P}`;
  return near(c, 1) ? P : `${dec(c)}${P}`;
}
const sq = (u: string) => `sq ${u}`;
const T = (s: string) => `\\text{${s}}`;
const NAMES = ['Sam', 'Lena', 'Theo', 'Priya', 'Marcus', 'Ava', 'Diego', 'Mei', 'Jordan', 'Nia'];
const NOCALC = '<span class="tag">(no calculator)</span>';
const CALC = '<span class="tag">(calculator)</span>';

interface Ctx {
  id: string; look: Look; u: string; around: string; cover: string;
  /** short words for claims, and the questions as a kid would ask them */
  aroundW: string; coverW: string; aroundQ: string; coverQ: string;
  diam: (d: string) => string; rad: (r: string) => string;
}
const CTX: readonly Ctx[] = [
  { id: 'pizza', look: 'pizza', u: 'in', around: 'the crust around the edge', cover: 'the cheese that covers the top', aroundW: 'crust', coverW: 'cheese',
    aroundQ: 'How long is the crust around the edge?', coverQ: 'How much area does the cheese cover?', diam: d => `a ${d}-inch pizza`, rad: r => `a pizza with a radius of ${r} in` },
  { id: 'garden', look: 'garden', u: 'ft', around: 'edging around the flower bed', cover: 'mulch to cover the flower bed', aroundW: 'edging', coverW: 'mulch',
    aroundQ: 'How many feet of edging go around the flower bed?', coverQ: 'How much area must the mulch cover?', diam: d => `a round flower bed ${d} ft across`, rad: r => `a round flower bed with a radius of ${r} ft` },
  { id: 'pool', look: 'pool', u: 'ft', around: 'a rope around the edge of the pool', cover: 'a cover for the whole pool', aroundW: 'rope', coverW: 'cover',
    aroundQ: 'How long is a rope that goes once around the edge of the pool?', coverQ: 'How much area must a cover for the whole pool have?', diam: d => `a round pool ${d} ft across`, rad: r => `a round pool with a radius of ${r} ft` },
  { id: 'table', look: 'table', u: 'ft', around: 'trim around the edge of the tabletop', cover: 'a cloth that covers the tabletop exactly', aroundW: 'trim', coverW: 'cloth',
    aroundQ: 'How long is the trim around the edge of the tabletop?', coverQ: 'How much cloth covers the tabletop exactly?', diam: d => `a round tabletop ${d} ft across`, rad: r => `a round tabletop with a radius of ${r} ft` },
  { id: 'rug', look: 'rug', u: 'ft', around: 'binding sewn around the edge of the rug', cover: 'the fabric of the rug', aroundW: 'binding', coverW: 'fabric',
    aroundQ: 'How long is the binding sewn around the edge of the rug?', coverQ: 'How much floor does the rug cover?', diam: d => `a round rug ${d} ft across`, rad: r => `a round rug with a radius of ${r} ft` },
  { id: 'lid', look: 'lid', u: 'cm', around: 'a rubber seal around the lid', cover: 'a sticker that covers the top of the lid', aroundW: 'seal', coverW: 'sticker',
    aroundQ: 'How long is a rubber seal that goes once around the lid?', coverQ: 'How much area does a sticker need to cover the whole top?', diam: d => `a jar lid ${d} cm across`, rad: r => `a jar lid with a radius of ${r} cm` },
  { id: 'field', look: 'garden', u: 'm', around: 'one lap around the edge of the field', cover: 'new turf for the whole field', aroundW: 'lap', coverW: 'turf',
    aroundQ: 'How long is one lap around the edge of the field?', coverQ: 'How much turf covers the whole field?', diam: d => `a circular field ${d} m across`, rad: r => `a circular field with a radius of ${r} m` },
  { id: 'sprinkler', look: 'garden', u: 'ft', around: 'the edge of the watered circle', cover: 'the lawn the sprinkler waters', aroundW: 'edge', coverW: 'lawn',
    aroundQ: 'How long is the edge of the watered circle?', coverQ: 'How much lawn does the sprinkler water?', diam: d => `a sprinkler that waters a circle ${d} ft across`, rad: r => `a sprinkler that reaches ${r} ft in every direction` },
];
/** "a 12-inch pizza" -> "A 12-inch pizza." */
const Cap = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}.`;
const Up = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;

// ---------- pictures ----------
const L = (s: string) => `\\text{${s}}`;
/** a disc with segments; the generator retries angles until the layout is readable */
function discPic(look: Look, segs: Seg[], extra: { ctag?: string; atag?: string } = {}): Pic {
  return { kind: 'disc', look, segs, ...extra };
}
const fits = (p: Pic) => layoutPic(p, PF).why === null;
/** a given segment with its measure, and the asked one with "?" that turns into the answer */
function givenAsked(R: () => number, look: Look, given: { kind: 'radius' | 'diameter'; tag: string; ans?: string }, asked: { kind: 'radius' | 'diameter'; ans: string } | null, extra: { ctag?: string; atag?: string } = {}, hideAsked = false): { pic: Pic; asked: number } {
  for (let t = 0; t < 80; t++) {
    const a = given.kind === 'diameter' ? pick(R, [0, 0, 180, -20, 20, 160]) : pick(R, [20, 35, -35, 150, 210, 60]);
    const segs: Seg[] = [{ kind: given.kind, a, tag: given.tag, ans: given.ans }];
    if (asked) segs.push({ kind: asked.kind, a: asked.kind === 'diameter' ? a + pick(R, [60, 90, 120]) : a + pick(R, [70, 100, 130, -70, -110, -130]), tag: hideAsked ? undefined : '?', ans: asked.ans, hidden: hideAsked });
    const p = discPic(look, segs, extra);
    if (fits(p)) return { pic: p, asked: 1 };
  }
  // fall back to the simplest readable picture
  const p = discPic(look, [{ kind: given.kind, a: 0, tag: given.tag }], extra);
  return { pic: p, asked: -1 };
}
const unitTex = (v: string, u: string) => `${v}\\text{ ${u}}`;

// ===================================================================================================================
// 1-2 radius / diameter: name the segment
// ===================================================================================================================
const LET = ['A', 'B', 'C', 'D'] as const;
function rimDirs(s: Seg): number[] {
  switch (s.kind) {
    case 'radius': case 'stub': return [s.a];
    case 'diameter': return [s.a, s.a + 180];
    case 'chord': return [s.a, s.b!];
    case 'off': return [s.a, s.b!];
  }
}
const angDiff = (a: number, b: number) => { const d = Math.abs((((a - b) % 360) + 540) % 360 - 180); return d; };
function makeSeg(R: () => number, kind: Seg['kind'], a: number, nearCenter = false): Seg {
  switch (kind) {
    case 'radius': return { kind, a };
    case 'diameter': return { kind, a };
    case 'chord': return { kind, a, b: a + (nearCenter ? pick(R, [150, 156, 204, 210]) : pick(R, [80, 95, 110, 125, -90, -110])) };
    case 'stub': return { kind, a, f: pick(R, [0.45, 0.55, 0.62]) };
    case 'off': return { kind, a, b: a + 180 + pick(R, [-55, -45, 45, 55]), f: pick(R, [0.32, 0.4]) };
  }
}
/** segments with well-separated ends and readable letter labels */
function letteredSegs(R: () => number, kinds: Seg['kind'][], nearChord = -1): Seg[] | null {
  for (let t = 0; t < 120; t++) {
    const segs: Seg[] = [];
    let ok = true;
    for (let i = 0; i < kinds.length && ok; i++) {
      const s = makeSeg(R, kinds[i]!, int(R, 0, 23) * 15, i === nearChord);
      const dirs = rimDirs(s);
      if (segs.some(o => rimDirs(o).some(a => dirs.some(b => angDiff(a, b) < 30)))) ok = false;
      segs.push({ ...s, tag: L(LET[i]!) });
    }
    if (ok && fits(discPic('plain', segs))) return segs;
  }
  return null;
}
const SEGWORD: Record<Seg['kind'], string> = {
  radius: 'a radius: from the center to the circle',
  diameter: 'a diameter: edge to edge, through the center',
  chord: 'edge to edge, but it misses the center',
  stub: 'it starts at the center but stops inside the circle',
  off: 'it does not start at the center',
};
const whichSeg: Gen = (R, n, sg = 'radius') => {
  const diam = sg === 'diameter';
  const v = diam ? pick(R, ['which', 'which', 'isIt'] as const) : pick(R, ['which', 'which', 'count', 'length'] as const);
  if (v === 'which') {
    for (;;) {
      const right: Seg['kind'] = diam ? 'diameter' : 'radius';
      const pool: Seg['kind'][] = diam ? ['chord', 'chord', 'radius', 'stub', 'off'] : ['stub', 'chord', 'off', 'diameter'];
      const others = shuffle(R, pool.slice()).slice(0, 3);
      const kinds = shuffle(R, [right, ...others]);
      const segs = letteredSegs(R, kinds);
      if (!segs) continue;
      const iR = kinds.indexOf(right);
      const opts: Opt[] = kinds.map((k, i) => ({
        t: `Segment ${LET[i]}`, ok: i === iR,
        mc: i === iR ? undefined : diam ? (k === 'chord' ? MC.chordDiam : k === 'radius' ? MC.rForD : undefined) : (k === 'diameter' ? MC.dForR : MC.anyInside),
        say: i === iR ? `Yes: ${LET[i]} is ${SEGWORD[k]}.` : `${LET[i]} is not: ${SEGWORD[k]}. ${diam ? 'A diameter runs edge to edge through the center' : 'A radius runs from the center to the circle'}: that is ${LET[iR]}.`,
      }));
      return choice(R, {
        id: `whichSeg-${n}`, family: 'whichSeg', prompt: `Which segment is a ${diam ? 'diameter' : 'radius'} of the circle? The dot is the center.`,
        board: diam ? T('which one is a diameter?') : T('which one is a radius?'),
        solution: [`A ${diam ? 'diameter goes from edge to edge and passes through the center' : 'radius goes from the center to a point on the circle'}.`, `Segment ${LET[iR]} does. It can point any way: tilted counts too.`],
        pict: { pic: discPic('plain', segs), solve: { hl: iR, tex: `\\text{${LET[iR]}: ${diam ? 'a diameter' : 'a radius'}}` } },
      }, opts, true);
    }
  }
  if (v === 'isIt') {
    for (;;) {
      const isD = R() < 0.5;
      const kinds: Seg['kind'][] = [isD ? 'diameter' : 'chord'];
      const segs = letteredSegs(R, kinds, isD ? -1 : 0);
      if (!segs) continue;
      const opts: Opt[] = isD ? [
        { t: 'Yes: it goes edge to edge through the center', ok: true, say: 'Yes. Edge to edge through the center: a diameter, tilted or not.' },
        { t: 'No: a diameter must go straight across', mc: MC.prototype, say: 'A diameter can point any way. It only has to go edge to edge through the center, and A does.' },
        { t: 'No: its ends are not on the circle', say: 'Look again: both ends of A are on the circle, and it passes through the center.' },
      ] : [
        { t: 'No: it does not pass through the center', ok: true, say: 'Right. Both ends are on the circle, but it misses the center: not a diameter.' },
        { t: 'Yes: both of its ends are on the circle', mc: MC.chordDiam, say: 'Both ends on the circle is not enough. A diameter must also pass through the center, and A misses it.' },
        { t: 'No: a diameter must go straight across', mc: MC.prototype, say: 'A diameter can point any way. A is not one because it misses the center.' },
      ];
      return choice(R, {
        id: `whichSeg-${n}`, family: 'whichSeg', prompt: 'Is segment A a diameter of the circle? The dot is the center.',
        board: T('is A a diameter?'),
        solution: ['A diameter goes from edge to edge AND passes through the center.', isD ? 'A does both, so it is a diameter, whichever way it points.' : 'A goes edge to edge but misses the center, so it is not a diameter.'],
        pict: { pic: discPic('plain', segs), solve: { hl: 0, tex: isD ? T('A: through the center') : T('A misses the center') } },
      }, opts);
    }
  }
  if (v === 'count') {
    for (;;) {
      const nr = int(R, 2, 3), extra = shuffle(R, ['stub', 'chord', 'off'] as Seg['kind'][]).slice(0, 4 - nr);
      const kinds = shuffle(R, [...Array<Seg['kind']>(nr).fill('radius'), ...extra]);
      const segs = letteredSegs(R, kinds);
      if (!segs) continue;
      const straight = segs.filter(s => s.kind === 'radius' && s.a % 90 === 0).length;
      if (straight === nr) continue;   // at least one tilted radius: the prototype trap
      const stubs = extra.filter(k => k === 'stub' || k === 'off').length;
      const cand: [number, string | undefined, string][] = [
        [nr, undefined, `Yes: ${nr} radii. Every segment from the center to the circle is a radius, tilted ones too.`],
        [straight, MC.prototype, `Tilted segments from the center to the circle are radii too. There are ${nr}.`],
        [nr + stubs, MC.anyInside, `A segment that stops inside, or does not start at the center, is not a radius. There are ${nr}.`],
        [4, MC.anyInside, `Not every segment inside the circle is a radius. Only the ones from the center to the circle: ${nr}.`],
        [nr === 2 ? 3 : 2, undefined, `Count the segments that run from the center all the way to the circle: ${nr}.`],
        [1, undefined, `Count the segments that run from the center all the way to the circle: ${nr}.`],
      ];
      const opts: Opt[] = [];
      for (const [val, mc, say] of cand) if (!opts.some(o => o.t === String(val)) && opts.length < 4) opts.push({ t: String(val), ok: val === nr, mc, say });
      if (opts.length < 3) continue;
      return choice(R, {
        id: `whichSeg-${n}`, family: 'whichSeg', prompt: 'How many of these segments are radii of the circle? The dot is the center.',
        board: T('how many radii?'),
        solution: ['A radius runs from the center to a point on the circle, in any direction.', `Here: ${segs.map((s, i) => s.kind === 'radius' ? LET[i] : null).filter(Boolean).join(', ')}. That is ${nr}.`],
        pict: { pic: discPic('plain', segs), solve: { tex: `${nr}\\ \\text{radii}` } },
      }, opts.sort((a, b) => Number(a.t) - Number(b.t)), true);
    }
  }
  // length: all radii of a circle are equal
  for (;;) {
    const r = int(R, 3, 15), u = pick(R, ['cm', 'in', 'ft']);
    const a = pick(R, [0, 180, 90]), b = a + pick(R, [115, 135, 160, 200, 225]);
    const segs: Seg[] = [{ kind: 'radius', a, tag: `${L('A')}\\ ${unitTex(String(r), u)}` }, { kind: 'radius', a: b, tag: L('B'), ans: `${L('B')}\\ ${unitTex(String(r), u)}` }];
    const pic = discPic('plain', segs);
    if (!fits(pic)) continue;
    return numeric({
      id: `whichSeg-${n}`, family: 'whichSeg', prompt: `Segment A is a radius of this circle, ${r} ${u} long. Segment B is also a radius. How long is B?`, unit: u,
      board: `\\text{A} = ${unitTex(String(r), u)}`,
      solution: ['Every radius of a circle runs from the center to the circle, so all radii are the same length.', `B = <b class="s">${r} ${u}</b>, tilted or not.`],
      pict: { pic, solve: { show: ['seg1A'], tex: `\\text{B} = ${unitTex(String(r), u)}` } },
    }, {
      ans: r, right: `Yes: every radius of a circle has the same length, ${r} ${u}.`,
      wrongs: [{ v: 2 * r, mc: MC.dForR, say: `${2 * r} ${u} would be a diameter, edge to edge. B goes from the center to the circle, like A: ${r} ${u}.` }],
      other: `B also runs from the center to the circle, so it is as long as A: ${r} ${u}.`,
    });
  }
};

// ===================================================================================================================
// 3 r-d-convert
// ===================================================================================================================
const convertRD: Gen = (R, n) => {
  const phase = pick(R, ['p1', 'p1', 'p1', 'p1b', 'p2', 'p2'] as const);
  let toD: boolean, given: number;
  if (phase === 'p1') { toD = R() < 0.5; given = toD ? int(R, 1, 10) : 2 * int(R, 1, 10); }
  else if (phase === 'p1b') { toD = R() < 0.5; given = toD ? int(R, 11, 15) : 2 * int(R, 11, 15); }
  else { toD = false; given = R() < 0.6 ? 2 * int(R, 1, 14) + 1 : pick(R, [2.4, 4.6, 6.4, 8.2, 3.8, 5.2, 7.6, 9.4, 1.6, 4.8]); }
  const ans = toD ? 2 * given : given / 2;
  const ctx = toD ? pick(R, CTX.filter(c => ['sprinkler', 'garden', 'pool', 'rug', 'field'].includes(c.id))) : pick(R, CTX);
  const u = ctx.u;
  const what = toD ? ctx.rad(dec(given)) : ctx.diam(dec(given));
  const half = !Number.isInteger(ans);
  const { pic } = givenAsked(R, ctx.look, { kind: toD ? 'radius' : 'diameter', tag: unitTex(dec(given), u) }, { kind: toD ? 'diameter' : 'radius', ans: unitTex(dec(ans), u) });
  return numeric({
    id: `convertRD-${n}`, family: 'convertRD',
    prompt: `Think of ${what}. What is its ${toD ? 'diameter' : 'radius'}? ${NOCALC}`, unit: u,
    board: toD ? `r = ${unitTex(dec(given), u)}\\quad d = 2r` : `d = ${unitTex(dec(given), u)}\\quad r = d \\div 2`,
    solution: toD
      ? [`"${dec(given)} ${u} in every direction" is from the center to the edge: the radius.`, `A diameter is two radii: d = 2 × ${dec(given)} = <b class="s">${dec(ans)} ${u}</b>.`]
      : [`"${dec(given)} ${u} across" is edge to edge through the center: the diameter.`, `The radius is half of it: r = ${dec(given)} ÷ 2 = <b class="s">${dec(ans)} ${u}</b>${half ? ` (or ${Math.floor(ans)} ${fr(1, 2)} ${u})` : ''}.`],
    pict: { pic, solve: { show: ['seg1A'], tex: toD ? `d = 2 \\times ${dec(given)} = ${dec(ans)}` : `r = ${dec(given)} \\div 2 = ${dec(ans)}` } },
  }, {
    ans, input: half ? 'frac' : 'num',
    right: toD ? `Yes: the diameter is two radii, ${dec(ans)} ${u}.` : `Yes: the radius is half the diameter, ${dec(ans)} ${u}.`,
    wrongs: toD
      ? [{ v: given / 2, mc: MC.reversed, say: `That halves the radius. A diameter is TWO radii: 2 × ${dec(given)}.` },
        { v: given, mc: MC.rForD, say: `${dec(given)} ${u} is the radius, from the center out. The diameter goes all the way across: twice as long.` }]
      : [{ v: given * 2, mc: MC.reversed, say: `That doubles it. The radius is half of the diameter: ${dec(given)} ÷ 2.` },
        { v: given, mc: MC.dForR, say: `${dec(given)} ${u} is all the way across, the diameter. The radius only goes from the center to the edge: half of it.` }],
    other: toD ? `d = 2r = 2 × ${dec(given)}.` : `r = d ÷ 2 = ${dec(given)} ÷ 2.`,
  });
};

// ===================================================================================================================
// 4 circumference-meaning: around or across
// ===================================================================================================================
const OBJ = [
  { t: 'a jar lid', look: 'lid' as Look, u: 'cm' }, { t: 'a round cake', look: 'pizza' as Look, u: 'in' }, { t: 'a tree trunk', look: 'table' as Look, u: 'in' },
  { t: 'a round tabletop', look: 'table' as Look, u: 'ft' }, { t: 'a drum', look: 'lid' as Look, u: 'in' }, { t: 'a round rug', look: 'rug' as Look, u: 'ft' },
];
const MEASURE_OPTS = (right: 'C' | 'd' | 'A', what: string): Opt[] => [
  { t: 'its circumference', ok: right === 'C', mc: right === 'A' ? MC.sameAttr : right === 'd' ? MC.aroundAcross : undefined, say: right === 'C' ? `Yes: ${what} is the distance around, the circumference.` : `The circumference is the distance AROUND. ${what} is ${right === 'd' ? 'straight across' : 'the space inside'}.` },
  { t: 'its diameter', ok: right === 'd', mc: right === 'C' ? MC.aroundAcross : undefined, say: right === 'd' ? `Yes: ${what} goes straight across through the center: the diameter.` : `The diameter goes straight across. ${what} ${right === 'C' ? 'goes around the curved edge' : 'covers the inside'}.` },
  { t: 'its radius', ok: false, mc: right === 'C' ? MC.aroundAcross : undefined, say: `The radius is from the center to the edge. ${what} ${right === 'C' ? 'goes all the way around' : right === 'd' ? 'goes all the way across' : 'covers the inside'}.` },
  { t: 'its area', ok: right === 'A', mc: right === 'C' ? MC.sameAttr : undefined, say: right === 'A' ? `Yes: ${what} covers the inside, the area.` : `The area is the space inside, in square units. ${what} is a length.` },
];
const aroundAcross: Gen = (R, n) => {
  const o = pick(R, OBJ);
  const v = pick(R, ['string', 'estimate', 'lit', 'lit'] as const);
  if (v === 'string') {
    return choice(R, {
      id: `aroundAcross-${n}`, family: 'aroundAcross', prompt: `You wrap a string once around the edge of ${o.t}, then lay it straight. What does the string's length measure?`,
      board: T('around the edge'),
      solution: ['A string around the edge measures the distance around: the circumference.', 'It is a length, so it is in inches, feet, cm… not square units.'],
      pict: { pic: discPic(o.look, []), solve: { show: ['C'], tex: T('around = circumference') } },
    }, MEASURE_OPTS('C', 'the string around the edge'));
  }
  if (v === 'estimate') {
    const d = int(R, 3, 12);
    const opts: Opt[] = [
      { t: `a bit more than ${3 * d} ${o.u}`, ok: true, say: `Yes: the way around is a bit more than 3 times the way across (π ≈ 3.14), so a bit more than ${3 * d} ${o.u}.` },
      { t: `${d} ${o.u}`, mc: MC.aroundAcross, say: `${d} ${o.u} is straight across. Around the curved edge is much longer: a bit more than 3 times as long.` },
      { t: `${2 * d} ${o.u}`, say: `Around the edge is a bit more than 3 times the way across, not 2 times.` },
      { t: `${d * d} sq ${o.u}`, mc: MC.sameAttr, say: `Square ${o.u} measure the inside (area). A string is a length: a bit more than ${3 * d} ${o.u}.` },
    ];
    return choice(R, {
      id: `aroundAcross-${n}`, family: 'aroundAcross', prompt: `${o.t[0]!.toUpperCase()}${o.t.slice(1)} is ${d} ${o.u} across. About how long is a string that goes once around its edge?`,
      board: `d = ${unitTex(String(d), o.u)}\\quad C = \\ ?`,
      solution: [`Around is a bit more than 3 times across: C = π × d ≈ 3.14 × ${d}.`, `So the string is a bit more than ${3 * d} ${o.u} (about ${dec(roundTo(PI * d, 1))} ${o.u}).`],
      pict: { pic: givenAsked(R, o.look, { kind: 'diameter', tag: unitTex(String(d), o.u) }, null).pic, solve: { show: ['C'], tex: `C \\approx 3.14 \\times ${d}` } },
    }, opts);
  }
  // lit: which measure does the lit part show?
  const lit = pick(R, ['C', 'C', 'd', 'A'] as const);
  const pic = lit === 'd' ? givenAsked(R, o.look, { kind: 'diameter', tag: '' }, null).pic : discPic(o.look, []);
  if (pic.kind === 'disc' && lit === 'd') pic.segs[0]!.tag = undefined;
  return choice(R, {
    id: `aroundAcross-${n}`, family: 'aroundAcross', prompt: `The picture shows ${o.t}. What does the lit part show?`,
    board: T('the lit part?'),
    solution: lit === 'C' ? ['The light runs around the curved edge: the distance around, the circumference.'] : lit === 'd' ? ['The line goes straight across through the center: the diameter.'] : ['The whole inside is lit: the space it covers, the area.'],
    pict: { pic, rest: ['in', 'segs', lit === 'A' ? 'A' : lit === 'C' ? 'C' : 'segs'], solve: { tex: lit === 'C' ? T('around: C') : lit === 'd' ? T('across: d') : T('inside: A') } },
  }, MEASURE_OPTS(lit, lit === 'C' ? 'the lit edge' : lit === 'd' ? 'the lit line' : 'the lit inside'));
};

// ===================================================================================================================
// 5 area-meaning (and 13): length or area, and its unit
// ===================================================================================================================
const lengthOrArea: Gen = (R, n) => {
  const ctx = pick(R, CTX), around = R() < 0.5, u = ctx.u;
  const v = pick(R, ['measure', 'measure', 'unit'] as const);
  const job = around ? ctx.around : ctx.cover;
  const pict = { pic: discPic(ctx.look, []), solve: { show: [around ? 'C' : 'A'], tex: around ? T(`around: C, in ${u}`) : T(`inside: A, in sq ${u}`) } };
  const sol = [around ? `${job[0]!.toUpperCase()}${job.slice(1)} goes around the edge: a length, the circumference, in ${u}.` : `${job[0]!.toUpperCase()}${job.slice(1)} covers the inside: the area, in square ${u}.`];
  if (v === 'measure') {
    const opts: Opt[] = [
      { t: `the circumference, in ${u}`, ok: around, mc: around ? undefined : MC.sameAttr, say: around ? 'Yes: around the edge is the circumference, a length.' : `That measures around the edge. ${Up(job)} covers the inside: the area, in sq ${u}.` },
      { t: `the area, in sq ${u}`, ok: !around, mc: around ? MC.sameAttr : undefined, say: !around ? 'Yes: covering the inside is the area, in square units.' : `The area covers the inside. ${Up(job)} only goes around the edge: the circumference, in ${u}.` },
      { t: `the circumference, in sq ${u}`, mc: around ? MC.unitDim : MC.sameAttr, say: around ? `Right measure, wrong unit: a length is in ${u}, not square ${u}.` : `This one covers the inside: the area, in sq ${u}.` },
      { t: `the area, in ${u}`, mc: around ? MC.sameAttr : MC.unitDim, say: around ? `This one goes around the edge: the circumference, in ${u}.` : `Right measure, wrong unit: an area is in square ${u}.` },
    ];
    return choice(R, {
      id: `lengthOrArea-${n}`, family: 'lengthOrArea', prompt: `${Cap(ctx.diam(String(2 * int(R, 2, 9))))} The question is: “${around ? ctx.aroundQ : ctx.coverQ}” Which measure answers it?`,
      board: around ? T('around, or inside?') : T('inside, or around?'), solution: sol, pict,
    }, opts);
  }
  const r = int(R, 3, 9);
  const val = around ? dec(roundTo(2 * PI * r, 1)) : dec(roundTo(PI * r * r, 1));
  const opts: Opt[] = [
    { t: u, ok: around, mc: around ? undefined : MC.unitDim, say: around ? `Yes: a length is in ${u}.` : `This is an area, so it is in square ${u}.` },
    { t: `sq ${u}`, ok: !around, mc: around ? MC.unitDim : undefined, say: !around ? `Yes: an area is in square ${u}.` : `This is a length around the edge, so it is in ${u}, not square ${u}.` },
    { t: `cubic ${u}`, say: `Cubic units measure space inside a solid. ${around ? `A length is in ${u}.` : `An area is in square ${u}.`}` },
  ];
  return choice(R, {
    id: `lengthOrArea-${n}`, family: 'lengthOrArea', prompt: `${Cap(ctx.rad(String(r)))} The answer to “${around ? ctx.aroundQ : ctx.coverQ}” is ${val}. Which unit goes with ${val}?`,
    board: around ? `C = 2\\pi r` : `A = \\pi r^2`, solution: sol, pict,
  }, opts, true);
};

// ===================================================================================================================
// 6 area-grid-estimate
// ===================================================================================================================
const gridBound: Gen = (R, n) => {
  const r = pick(R, [3, 4, 5] as const), v = pick(R, ['outer', 'inner', 'about'] as const);
  const pic: Pic = { kind: 'grid', r };
  if (v === 'outer') return numeric({
    id: `gridBound-${n}`, family: 'gridBound', prompt: `The circle has radius ${r}. The dashed square around it touches the circle on all four sides. What is the area of that square?`, unit: 'square units',
    board: `r = ${r}\\quad \\text{side} = 2r`,
    solution: [`Each side of the outer square is a diameter: 2 × ${r} = ${2 * r}.`, `Area = ${2 * r} × ${2 * r} = <b class="s">${4 * r * r}</b> square units, that is 4r².`],
    pict: { pic, solve: { tex: `${2 * r} \\times ${2 * r} = ${4 * r * r}` } },
  }, {
    ans: 4 * r * r, right: `Yes: the side is 2r = ${2 * r}, so ${2 * r} × ${2 * r} = ${4 * r * r}. The circle is less than that.`,
    wrongs: [{ v: r * r, mc: MC.rRect, say: `${r} × ${r} is a small square of side r. The outer square has side 2r = ${2 * r}.` },
      { v: 8 * r, mc: MC.areaPerim, say: `${8 * r} is the distance around the square. Its area is side × side: ${2 * r} × ${2 * r}.` },
      { v: 4 * r, mc: MC.powTimes, say: `(2r)² means ${2 * r} × ${2 * r}, not ${2 * r} × 2.` }],
    other: `The side of the outer square is 2r = ${2 * r}. Area = ${2 * r} × ${2 * r}.`,
  });
  if (v === 'inner') return numeric({
    id: `gridBound-${n}`, family: 'gridBound', prompt: `The blue square inside the circle has its corners on the circle. Its diagonals cut it into 4 triangles, and each triangle is half of an r-by-r square. With r = ${r}, what is the area of the blue square?`, unit: 'square units',
    board: `4 \\times \\tfrac{1}{2} \\times ${r} \\times ${r}`,
    solution: [`Each triangle is half of a ${r} × ${r} square: ${r * r} ÷ 2 = ${r * r / 2}.`, `4 triangles: 4 × ${r * r / 2} = <b class="s">${2 * r * r}</b> square units, that is 2r², half of the outer square.`],
    pict: { pic, solve: { tex: `4 \\times ${dec(r * r / 2)} = ${2 * r * r}` } },
  }, {
    ans: 2 * r * r, right: `Yes: 4 halves of a ${r} × ${r} square is 2 × ${r * r} = ${2 * r * r}. The circle is more than that.`,
    wrongs: [{ v: r * r, mc: MC.rRect, say: `${r * r} is one r-by-r square. The blue square is 4 HALVES of one, so 2 of them.` },
      { v: 4 * r * r, say: `${4 * r * r} is the big outer square. The blue one is half of it.` }],
    other: `4 triangles, each half of ${r} × ${r}: 4 × ${r * r / 2}.`,
  });
  const opts: Opt[] = [
    { t: `about ${3 * r * r} square units`, ok: true, say: `Yes: between ${2 * r * r} (inner square) and ${4 * r * r} (outer square), about 3r² = ${3 * r * r}.` },
    { t: `about ${r * r} square units`, mc: MC.rRect, say: `${r * r} is one r-by-r square. The circle covers more than the blue square, which is already ${2 * r * r}.` },
    { t: `about ${4 * r * r} square units`, say: `${4 * r * r} is the whole outer square, and the circle leaves its corners empty. It is less.` },
    { t: `about ${2 * r} square units`, mc: MC.powTimes, say: `r² means ${r} × ${r}, not ${r} × 2. The circle is about 3 × ${r * r}.` },
  ];
  return choice(R, {
    id: `gridBound-${n}`, family: 'gridBound', prompt: `The circle (r = ${r}) is more than the blue square and less than the dashed square. About how big is its area?`,
    board: `${2 * r * r} < A < ${4 * r * r}`,
    solution: [`Inner square: 2r² = ${2 * r * r}. Outer square: 4r² = ${4 * r * r}.`, `The circle is in between, about 3r² = <b class="s">${3 * r * r}</b> (really π × ${r * r} ≈ ${dec(roundTo(PI * r * r, 1))}).`],
    pict: { pic, solve: { show: ['A'], tex: `A \\approx 3 \\times ${r * r} = ${3 * r * r}` } },
  }, opts);
};

// ===================================================================================================================
// 7 pi-ratio
// ===================================================================================================================
const piRatio: Gen = (R, n) => {
  const v = pick(R, ['compute', 'compute', 'bigger', 'whatIs', 'line'] as const);
  if (v === 'compute') {
    const d = int(R, 6, 40), u = pick(R, ['cm', 'in']);
    const C = roundTo(PI * d * (1 + (int(R, -6, 6) / 1000)), 1);
    const ans = roundTo(C / d, 2);
    return numeric({
      id: `piRatio-${n}`, family: 'piRatio', prompt: `A class measures a can: diameter ${d} ${u}, circumference ${dec(C)} ${u} (string and ruler). What is C ÷ d? Round to the nearest hundredth. ${CALC}`,
      board: `\\tfrac{C}{d} = \\tfrac{${dec(C)}}{${d}}`,
      solution: [`C ÷ d = ${dec(C)} ÷ ${d} ≈ <b class="s">${dec(ans)}</b>.`, 'Close to π ≈ 3.14: measuring with a string is never perfect. And it has no unit: cm ÷ cm.'],
      pict: { pic: { kind: 'unroll', look: 'lid', dTag: `d = ${unitTex(String(d), u)}` }, solve: { show: ['roll', 'dm'], tex: `${dec(C)} \\div ${d} \\approx ${dec(ans)}` } },
    }, {
      ans, tol: 0.0051, right: `Yes: about ${dec(ans)}, close to π. A measured ratio is never exactly π.`,
      wrongs: [{ v: roundTo(d / C, 2), say: `That is d ÷ C. Divide the circumference by the diameter: ${dec(C)} ÷ ${d}.` }, { v: roundTo(C - d, 2), say: 'Divide, don\'t subtract: C ÷ d.' }],
      other: `Divide: ${dec(C)} ÷ ${d}, then round to two decimal places.`,
    });
  }
  if (v === 'bigger') {
    const d1 = int(R, 2, 9), d2 = d1 * int(R, 3, 6), u = pick(R, ['cm', 'in']);
    return choice(R, {
      id: `piRatio-${n}`, family: 'piRatio', prompt: `A coin is ${d1} ${u} across and a plate is ${d2} ${u} across. For the coin, C ÷ d is about 3.14. For the plate, C ÷ d is…`,
      board: `\\tfrac{C}{d} = \\ ?`,
      solution: ['Every circle is a scaled copy of every other: across and around grow by the same factor.', 'So C ÷ d is the same for every circle, π ≈ 3.14, with no unit.'],
      pict: { pic: { kind: 'pair', look: 'lid', r1: d1, r2: d2, tags: [unitTex(String(d1), u), unitTex(String(d2), u)], seg: 'diameter' }, solve: { show: ['C'], tex: `\\tfrac{C}{d} = \\pi \\approx 3.14` } },
    }, [
      { t: 'about 3.14 too: the same for every circle', ok: true, say: 'Yes: bigger across means bigger around by the same factor. C ÷ d is π for every circle.' },
      { t: `about ${dec(roundTo(3.14 * d2 / d1, 1))}: a bigger circle has a bigger π`, mc: MC.piGrows, say: 'The plate is bigger around AND bigger across, by the same factor. C ÷ d stays π.' },
      { t: `about 3.14 ${u}`, mc: MC.piUnit, say: `${u} ÷ ${u} has no unit. π is a plain number, about 3.14.` },
      { t: 'exactly 3.14, if you measure carefully', mc: MC.pi314, say: 'π is about 3.14, never exactly. Its digits go on forever: 3.14159…' },
    ]);
  }
  if (v === 'whatIs') return choice(R, {
    id: `piRatio-${n}`, family: 'piRatio', prompt: 'Which sentence about π is true?',
    board: '\\pi = \\tfrac{C}{d}',
    solution: ['π is the circumference divided by the diameter, the same for every circle.', 'π = 3.14159…: 3.14 and 22/7 are only close to it.'],
  }, [
    { t: 'π is a bit more than 3.14, and its digits never end', ok: true, say: 'Yes: π = 3.14159…, and 3.14 and 22/7 are handy approximations.' },
    { t: 'π is exactly 3.14', mc: MC.pi314, say: '3.14 is close, but π = 3.14159… and keeps going. 3.14 is an approximation.' },
    { t: 'π is bigger for a bigger circle', mc: MC.piGrows, say: 'C ÷ d is the same for every circle. π does not depend on size.' },
    { t: 'π is a length, in the unit of the circle', mc: MC.piUnit, say: 'π is C ÷ d: a length divided by a length, so it has no unit.' },
  ]);
  return choice(R, {
    id: `piRatio-${n}`, family: 'piRatio', prompt: 'On a number line, between which two numbers is π?',
    board: '\\pi = 3.14159\\ldots',
    solution: ['π = 3.14159…', 'That is more than 3.1 and less than 3.2.'],
  }, [
    { t: '3.1 and 3.2', ok: true, say: 'Yes: π = 3.14159…, between 3.1 and 3.2.' },
    { t: '3.0 and 3.1', say: 'π = 3.14…, which is more than 3.1.' },
    { t: '3.2 and 3.3', say: 'π = 3.14…, which is less than 3.2.' },
    { t: '3 and 3.14, because π is 3.14 at most', mc: MC.pi314, say: 'π = 3.14159…, a little MORE than 3.14.' },
  ], true);
};

// ===================================================================================================================
// 8 c-from-d, 9 c-from-r
// ===================================================================================================================
const cFromD: Gen = (R, n) => {
  const ctx = pick(R, CTX.filter(c => c.id !== 'sprinkler'));
  const kind = pick(R, ['whole', 'whole', 'whole', 'dec', 'frac'] as const);
  const d = kind === 'whole' ? int(R, 1, 30) : kind === 'dec' ? pick(R, [2.5, 4.5, 7.5, 1.5, 3.2, 6.4, 0.8, 10.5]) : pick(R, [3, 5, 7, 9, 11]) / 2;
  const dTxt = kind === 'frac' ? `${d * 2}/2` : dec(d);
  const dHtml = kind === 'frac' ? fr(d * 2, 2) : dec(d);
  const u = ctx.u;
  const { pic } = givenAsked(R, ctx.look, { kind: 'diameter', tag: unitTex(kind === 'frac' ? `\\tfrac{${d * 2}}{2}` : dec(d), u) }, null);
  return numeric({
    id: `cFromD-${n}`, family: 'cFromD',
    prompt: `${Cap(ctx.diam(dHtml))} ${ctx.aroundQ} Give the exact answer in terms of π. ${NOCALC}`, unit: `π ${u}`,
    board: `C = \\pi d`,
    solution: [`Around the edge is the circumference: C = π × d.`, `C = π × ${dHtml} = <b class="b">${kind === 'frac' ? `${fr(d * 2, 2)}π` : piH(d)} ${u}</b>${kind === 'frac' ? ` (or ${dec(d)}π)` : ''}.`],
    pict: { pic, solve: { show: ['C'], tex: `C = \\pi \\times ${kind === 'frac' ? `\\tfrac{${d * 2}}{2}` : dec(d)} = ${kind === 'frac' ? `\\tfrac{${d * 2}}{2}\\pi` : piTex(d)}` } },
  }, {
    ans: d, input: kind === 'whole' ? 'num' : 'frac', frac: kind === 'frac' ? [d * 2, 2] : undefined,
    right: `Yes: C = π × ${dTxt} = ${dTxt}π ${u}.`,
    wrongs: [{ v: d * d, mc: MC.dSquared, say: `C = π × d, not π × d². Only area has a square in it.` },
      { v: 2 * d, mc: MC.dForR, say: `2πr uses the RADIUS. With the diameter it is just π × d: d already is 2r.` }],
    other: `C = π × d = π × ${dTxt}. Type the number in front of π.`,
  });
};
const cFromR: Gen = (R, n) => {
  const ctx = pick(R, CTX), u = ctx.u;
  const calc = R() < 0.3;
  const r = calc ? pick(R, [3.75, 2.35, 6.45, 4.15, 7.25, 5.65, 1.85, 8.35]) : R() < 0.65 ? int(R, 1, 20) : pick(R, [4.5, 1.25, 2.5, 3.5, 6.5, 2.25, 0.75, 1.5]);
  const { pic } = givenAsked(R, ctx.look, { kind: 'radius', tag: unitTex(dec(r), u) }, null);
  const base = {
    id: `cFromR-${n}`, family: 'cFromR' as const, board: 'C = 2\\pi r',
    pict: { pic, solve: { show: ['C'], tex: calc ? `C = 2\\pi \\times ${dec(r)} \\approx ${dec(roundTo(2 * PI * r, 1))}` : `C = 2\\pi \\times ${dec(r)} = ${piTex(2 * r)}` } },
  };
  if (calc) {
    const ans = roundTo(2 * PI * r, 1);
    return numeric({
      ...base, prompt: `${Cap(ctx.rad(dec(r)))} ${ctx.aroundQ} Use the π key and round to the nearest tenth. ${CALC}`, unit: u,
      solution: [`Estimate first: 2 × ${Math.round(r)} × 3 ≈ ${6 * Math.round(r)}.`, `C = 2 × π × ${dec(r)} ≈ <b class="b">${dec(ans)} ${u}</b>.`],
    }, {
      ans, tol: 0.051, right: `Yes: C = 2π × ${dec(r)} ≈ ${dec(ans)} ${u}. Close to the estimate ${6 * Math.round(r)}.`,
      wrongs: [{ v: roundTo(PI * r, 1), mc: MC.rForD, say: `π × ${dec(r)} uses the radius as if it were the diameter: half the answer. C = 2πr.` },
        { v: roundTo(PI * r * r, 1), mc: MC.areaPerim, say: 'πr² is the area. Around the edge is C = 2πr.' }],
      other: `C = 2 × π × ${dec(r)}. Estimate: about ${6 * Math.round(r)}.`,
    });
  }
  return numeric({
    ...base, prompt: `${Cap(ctx.rad(dec(r)))} ${ctx.aroundQ} Give the exact answer in terms of π. ${NOCALC}`, unit: `π ${u}`,
    solution: [`Around the edge is the circumference: C = 2πr (two radii make the diameter).`, `C = 2 × ${dec(r)} × π = <b class="b">${piH(2 * r)} ${u}</b>.`],
  }, {
    ans: 2 * r, right: `Yes: C = 2π × ${dec(r)} = ${dec(2 * r)}π ${u}.`,
    wrongs: [{ v: r, mc: MC.rForD, say: `π × ${dec(r)} treats the radius as the whole way across. C = 2πr: double the radius first.` },
      { v: r * r, mc: MC.areaPerim, say: `r² belongs to the area. Around the edge: C = 2 × ${dec(r)} × π.` }],
    other: `C = 2πr = 2 × ${dec(r)} × π. Type the number in front of π.`,
  });
};

// ===================================================================================================================
// 10 a-from-r, 11 a-from-d
// ===================================================================================================================
const aFromR: Gen = (R, n) => {
  const ctx = pick(R, CTX), u = ctx.u;
  const kind = pick(R, ['whole', 'whole', 'whole', 'frac', 'calc'] as const);
  if (kind === 'calc') {
    const r = pick(R, [2.5, 3.5, 1.5, 4.5, 2.4, 3.2, 5.5, 1.2]);
    const ans = roundTo(PI * r * r, 1);
    const { pic } = givenAsked(R, ctx.look, { kind: 'radius', tag: unitTex(dec(r), u) }, null);
    const lo = Math.floor(r) ** 2, hi = Math.ceil(r) ** 2;
    return numeric({
      id: `aFromR-${n}`, family: 'aFromR', prompt: `${Cap(ctx.rad(dec(r)))} ${ctx.coverQ} Use the π key and round to the nearest tenth. ${CALC}`, unit: sq(u),
      board: 'A = \\pi r^2',
      solution: [`Square the radius first: ${dec(r)}² = ${dec(r * r)} (between ${lo} and ${hi}).`, `A = π × ${dec(r * r)} ≈ <b class="a">${dec(ans)} ${sq(u)}</b>. About 3 × ${dec(r * r)} ≈ ${dec(roundTo(3 * r * r, 1))}: close.`],
      pict: { pic, solve: { show: ['A'], tex: `A = \\pi \\times ${dec(r)}^2 \\approx ${dec(ans)}` } },
    }, {
      ans, tol: 0.051, right: `Yes: A = π × ${dec(r * r)} ≈ ${dec(ans)} ${sq(u)}.`,
      wrongs: [{ v: roundTo(PI * PI * r * r, 1), mc: MC.piSquared, say: `That squares π too: (π × ${dec(r)})². Only the radius is squared: π × ${dec(r)}².` },
        { v: roundTo(2 * PI * r, 1), mc: MC.areaPerim, say: '2πr is the circumference, around the edge. The area is πr².' }],
      other: `A = π × ${dec(r)} × ${dec(r)}. Estimate: about 3 × ${dec(r * r)}.`,
    });
  }
  if (kind === 'frac') {
    const p = pick(R, [1, 3, 5, 7, 9]), r = p / 2;
    const { pic } = givenAsked(R, ctx.look, { kind: 'radius', tag: unitTex(`\\tfrac{${p}}{2}`, u) }, null);
    return numeric({
      id: `aFromR-${n}`, family: 'aFromR', prompt: `A circle has a radius of ${fr(p, 2)} ${u}. What is its exact area, in terms of π? ${NOCALC}`, unit: `π ${sq(u)}`,
      board: 'A = \\pi r^2',
      solution: [`Square the radius: (${fr(p, 2)})² = ${fr(p * p, 4)}.`, `A = <b class="a">${fr(p * p, 4)}π ${sq(u)}</b> (or ${dec(p * p / 4)}π).`],
      pict: { pic, solve: { show: ['A'], tex: `A = \\pi \\left(\\tfrac{${p}}{2}\\right)^2 = \\tfrac{${p * p}}{4}\\pi` } },
    }, {
      ans: r * r, input: 'frac', frac: [p * p, 4], right: `Yes: (${p}/2)² = ${p * p}/4, so A = ${p * p}/4 π ${sq(u)}.`,
      wrongs: [{ v: 2 * r, mc: MC.powTimes, say: `r² means r × r, not r × 2: (${p}/2) × (${p}/2) = ${p * p}/4.` }, { v: p * p / 2, say: `Square the bottom too: (${p}/2)² = ${p * p}/4.` }],
      other: `A = π × (${p}/2)²: square the top and the bottom.`,
    });
  }
  let r = int(R, 1, 12);
  if (r === 2) r = 7;
  const { pic } = givenAsked(R, ctx.look, { kind: 'radius', tag: unitTex(String(r), u) }, null);
  return numeric({
    id: `aFromR-${n}`, family: 'aFromR', prompt: `${Cap(ctx.rad(String(r)))} ${ctx.coverQ} Give the exact area in terms of π. ${NOCALC}`, unit: `π ${sq(u)}`,
    board: 'A = \\pi r^2',
    solution: [`Covering the inside is the area: A = π × r × r.`, `A = π × ${r} × ${r} = <b class="a">${piH(r * r)} ${sq(u)}</b>. Check: about 3 × ${r * r} = ${3 * r * r}.`],
    pict: { pic, solve: { show: ['A'], tex: `A = \\pi \\times ${r}^2 = ${piTex(r * r)}` } },
  }, {
    ans: r * r, right: `Yes: A = π × ${r}² = ${r * r}π ${sq(u)}.`,
    wrongs: [{ v: 2 * r, mc: MC.powTimes, say: `r² means ${r} × ${r}, not ${r} × 2. A = ${r * r}π.` }, { v: 4 * r * r, mc: MC.dForR, say: `That squares the diameter. A = πr² uses the radius, ${r}.` }],
    other: `A = π × ${r} × ${r}. Type the number in front of π.`,
  });
};
const aFromD: Gen = (R, n) => {
  const ctx = pick(R, CTX.filter(c => c.id !== 'sprinkler')), u = ctx.u;
  const kind = pick(R, ['even', 'even', 'odd', 'calc'] as const);
  if (kind === 'calc') {
    const d = pick(R, [4.2, 5.6, 7.4, 3.8, 6.2, 9.4, 2.6]), r = d / 2, ans = roundTo(PI * r * r, 1);
    const { pic } = givenAsked(R, ctx.look, { kind: 'diameter', tag: unitTex(dec(d), u) }, { kind: 'radius', ans: `r = ${unitTex(dec(r), u)}` }, {}, true);
    return numeric({
      id: `aFromD-${n}`, family: 'aFromD', prompt: `${Cap(ctx.diam(dec(d)))} ${ctx.coverQ} Use the π key and round to the nearest tenth. ${CALC}`, unit: sq(u),
      board: `d = ${unitTex(dec(d), u)}\\quad A = \\pi r^2`,
      solution: [`Write the radius first: r = ${dec(d)} ÷ 2 = ${dec(r)}.`, `A = π × ${dec(r)}² = π × ${dec(r * r)} ≈ <b class="a">${dec(ans)} ${sq(u)}</b>. About 3 × ${dec(roundTo(r * r, 1))} ≈ ${dec(roundTo(3 * r * r, 0))}.`],
      pict: { pic, solve: { show: ['seg1', 'seg1A', 'A'], tex: `r = ${dec(r)}\\quad A \\approx ${dec(ans)}` } },
    }, {
      ans, tol: 0.051, right: `Yes: r = ${dec(r)}, A = π × ${dec(r * r)} ≈ ${dec(ans)} ${sq(u)}.`,
      wrongs: [{ v: roundTo(PI * d * d, 1), mc: MC.dForR, say: `That uses the diameter as r. Halve it first: r = ${dec(r)}.` }, { v: roundTo(PI * d, 1), mc: MC.areaPerim, say: 'π × d is the circumference. The area is πr².' }],
      other: `r = ${dec(d)} ÷ 2 = ${dec(r)}, then A = π × ${dec(r)}².`,
    });
  }
  const d = kind === 'even' ? 2 * int(R, 1, 12) : 2 * int(R, 1, 7) + 1, r = d / 2;
  const rT = kind === 'even' ? String(r) : `\\tfrac{${d}}{2}`;
  const { pic } = givenAsked(R, ctx.look, { kind: 'diameter', tag: unitTex(String(d), u) }, { kind: 'radius', ans: `r = ${unitTex(rT, u)}` }, {}, true);
  return numeric({
    id: `aFromD-${n}`, family: 'aFromD', prompt: `${Cap(ctx.diam(String(d)))} ${ctx.coverQ} Give the exact area in terms of π, and write the radius down first. ${NOCALC}`, unit: `π ${sq(u)}`,
    board: `d = ${unitTex(String(d), u)}\\quad A = \\pi r^2`,
    solution: kind === 'even'
      ? [`The radius is half the diameter: r = ${d} ÷ 2 = ${r}.`, `A = π × ${r}² = <b class="a">${piH(r * r)} ${sq(u)}</b>.`]
      : [`The radius is half the diameter: r = ${fr(d, 2)}.`, `A = π × (${fr(d, 2)})² = <b class="a">${fr(d * d, 4)}π ${sq(u)}</b> (or ${dec(d * d / 4)}π).`],
    pict: { pic, solve: { show: ['seg1', 'seg1A', 'A'], tex: kind === 'even' ? `A = \\pi \\times ${r}^2 = ${piTex(r * r)}` : `A = \\pi \\left(\\tfrac{${d}}{2}\\right)^2 = \\tfrac{${d * d}}{4}\\pi` } },
  }, {
    ans: r * r, input: kind === 'even' ? 'num' : 'frac', frac: kind === 'odd' ? [d * d, 4] : undefined,
    right: `Yes: r = ${kind === 'even' ? r : `${d}/2`}, so A = ${kind === 'even' ? r * r : `${d * d}/4`} π ${sq(u)}.`,
    wrongs: [{ v: d * d, mc: MC.dForR, say: `That squares the diameter. A = πr² needs the radius: ${kind === 'even' ? r : `${d}/2`}.` }, { v: d, mc: MC.powTimes, say: `r² means r × r, not r × 2.` }, { v: d * d / 2, say: `Square the whole radius: (${d}/2)² = ${d * d}/4.` }],
    other: `First r = ${d} ÷ 2, then A = π × r × r.`,
  });
};

// ===================================================================================================================
// 12 approx-pi
// ===================================================================================================================
const approx: Gen = (R, n) => {
  const v = pick(R, ['314', '314', '227', 'calc', 'equals', 'round'] as const);
  const u = pick(R, ['ft', 'in', 'cm', 'm']);
  if (v === '314') {
    const c = int(R, 2, 40), ans = roundTo(3.14 * c, 2);
    return numeric({
      id: `approx-${n}`, family: 'approx', prompt: `The exact circumference is ${c}π ${u}. Use π ≈ 3.14 to write it as a decimal. ${NOCALC}`, unit: u,
      board: `${c}\\pi \\approx ${c} \\times 3.14`,
      solution: [`${c} × 3.14 = ${c} × 3 + ${c} × 0.14 = ${3 * c} + ${dec(0.14 * c)} = <b class="s">${dec(ans)}</b>.`, `So ${c}π ≈ ${dec(ans)} ${u}: "≈", because 3.14 is only close to π.`],
      pict: undefined,
    }, {
      ans, tol: 0.006, right: `Yes: ${c}π ≈ ${c} × 3.14 = ${dec(ans)} ${u}.`,
      wrongs: [{ v: 3 * c, say: `${3 * c} is the quick estimate with π ≈ 3. With 3.14 it is a bit more.` }, { v: roundTo(PI * c, 2), say: `That is the π key. This one asks for 3.14: ${c} × 3.14.` }],
      other: `Multiply ${c} × 3.14.`,
    });
  }
  if (v === '227') {
    const k = int(R, 1, 6), d = 7 * k;
    return numeric({
      id: `approx-${n}`, family: 'approx', prompt: `A circle is ${d} ${u} across. Use π ≈ ${fr(22, 7)} to find its circumference. ${NOCALC}`, unit: u,
      board: `C \\approx \\tfrac{22}{7} \\times ${d}`,
      solution: [`C = π × d ≈ ${fr(22, 7)} × ${d}.`, `${d} ÷ 7 = ${k}, and 22 × ${k} = <b class="s">${22 * k}</b> ${u}.`],
    }, {
      ans: 22 * k, right: `Yes: ${fr(22, 7)} × ${d} = 22 × ${k} = ${22 * k} ${u}.`,
      wrongs: [{ v: 44 * k, mc: MC.dForR, say: `That doubles the diameter. C = π × d, and d is already all the way across.` }, { v: 21 * k, say: `${21 * k} is 3 × ${d}, the estimate. 22/7 is a bit more than 3.` }],
      other: `${d} ÷ 7 = ${k}, then × 22.`,
    });
  }
  if (v === 'calc') {
    const c = pick(R, [12.5, 7.2, 18.4, 9.6, 15.5, 4.8, 22.5, 30.25]), ans = roundTo(PI * c, 1);
    return numeric({
      id: `approx-${n}`, family: 'approx', prompt: `The exact area is ${dec(c)}π sq ${u}. Use the π key and round to the nearest tenth. ${CALC}`, unit: `sq ${u}`,
      board: `${dec(c)}\\pi \\approx\\ ?`,
      solution: [`Estimate: 3 × ${dec(c)} ≈ ${dec(roundTo(3 * c, 1))}.`, `${dec(c)} × π = ${dec(roundTo(PI * c, 4))}… ≈ <b class="s">${dec(ans)}</b> sq ${u}. Round only at the end.`],
    }, {
      ans, tol: 0.051, right: `Yes: ${dec(c)}π ≈ ${dec(ans)} sq ${u}, close to the estimate ${dec(roundTo(3 * c, 1))}.`,
      wrongs: [{ v: roundTo(3 * c, 1), say: 'That is the estimate with π ≈ 3. Use the π key, then round.' }],
      other: `Type ${dec(c)} × π on the calculator, then round to one decimal place.`,
    });
  }
  if (v === 'equals') {
    const c = int(R, 3, 20), name = pick(R, NAMES);
    return choice(R, {
      id: `approx-${n}`, family: 'approx', prompt: `${name} writes: “${c}π = ${dec(roundTo(3.14 * c, 2))}”. What is the best way to write it?`,
      board: `${c}\\pi \\ \\square\\ ${dec(roundTo(3.14 * c, 2))}`,
      solution: [`3.14 is only close to π (π = 3.14159…).`, `So ${c}π ≈ ${dec(roundTo(3.14 * c, 2))}: use ≈ for a rounded value, = only for an exact one.`],
    }, [
      { t: `${c}π ≈ ${dec(roundTo(3.14 * c, 2))}`, ok: true, say: 'Yes: with 3.14 the answer is only approximately equal.' },
      { t: `${c}π = ${dec(roundTo(3.14 * c, 2))}: it is already right`, mc: MC.pi314, say: 'π is not exactly 3.14, so the decimal is only approximately equal: ≈.' },
      { t: `${c}π = ${3 * c}`, say: `${3 * c} uses π ≈ 3, and it is still not exact: ≈.` },
    ]);
  }
  // radii whose early-rounded answer really differs from the right one
  const r = pick(R, [2.5, 1.5, 4.5, 5.5]), r2 = r * r, good = Math.round(PI * r2), early = Math.round(PI * Math.round(r2 - 1e-9)), up = Math.round(PI * Math.ceil(r) ** 2);
  return choice(R, {
    id: `approx-${n}`, family: 'approx', prompt: `Ana finds the area of a circle with r = ${dec(r)} ft and must round to the nearest whole number. Which way is right?`,
    board: `A = \\pi \\times ${dec(r)}^2`,
    solution: [`Keep every digit until the end: ${dec(r)}² = ${dec(r2)}, π × ${dec(r2)} = ${dec(roundTo(PI * r2, 2))}…`, `Then round once: <b class="s">${good} sq ft</b>. Rounding early drifts away from it.`],
  }, [
    { t: `Keep ${dec(r2)}, multiply by π, round at the end: ${good} sq ft`, ok: true, say: 'Yes: round only the final answer.' },
    { t: `Round ${dec(r2)} to ${Math.round(r2 - 1e-9)} first to match, then π × ${Math.round(r2 - 1e-9)}: ${early} sq ft`, mc: MC.earlyRound, say: 'Working values may keep more digits than the answer. Round only at the end.' },
    { t: `Round ${dec(r)} up to ${Math.ceil(r)} first: ${up} sq ft`, mc: MC.earlyRound, say: 'Rounding the radius first changes the answer a lot. Keep the digits, round only at the end.' },
  ].filter((o, i, a) => a.findIndex(x => x.t === o.t) === i));
};

// ===================================================================================================================
// 13 choose-c-or-a
// ===================================================================================================================
const chooseMeasure: Gen = (R, n) => {
  const ctx = pick(R, CTX), u = ctx.u, around = R() < 0.5;
  const byD = R() < 0.4 && ctx.id !== 'sprinkler';
  const r = int(R, 3, 10), d = 2 * r;
  const exact = R() < 0.45;
  const given = byD ? ctx.diam(String(d)) : ctx.rad(String(r));
  const { pic } = givenAsked(R, ctx.look, { kind: byD ? 'diameter' : 'radius', tag: unitTex(String(byD ? d : r), u) }, null);
  const C = 2 * r, A = r * r;  // pi-coefficients
  const val = (c: number) => (exact ? c : roundTo(3.14 * c, 2));
  const ansC = around ? C : A;
  const unit = exact ? `π ${around ? u : sq(u)}` : around ? u : sq(u);
  const est = around ? 6 * r : 3 * r * r;
  return numeric({
    id: `chooseMeasure-${n}`, family: 'chooseMeasure',
    prompt: `${Cap(given)} ${around ? ctx.aroundQ : ctx.coverQ} ${exact ? 'Give the exact answer in terms of π.' : 'Use π ≈ 3.14.'} ${NOCALC}`, unit,
    board: byD ? `d = ${unitTex(String(d), u)}` : `r = ${unitTex(String(r), u)}`,
    solution: [around ? `${ctx.around[0]!.toUpperCase()}${ctx.around.slice(1)}: a length around the edge, the circumference.` : `${ctx.cover[0]!.toUpperCase()}${ctx.cover.slice(1)}: the inside, the area.`,
      `${byD ? `r = ${d} ÷ 2 = ${r}. ` : ''}Estimate with π ≈ 3: about ${est}.`,
      around ? `C = 2π × ${r} = ${exact ? `<b class="b">${C}π ${u}</b>` : `${C}π ≈ <b class="b">${dec(val(C))} ${u}</b>`}.` : `A = π × ${r}² = ${exact ? `<b class="a">${A}π ${sq(u)}</b>` : `${A}π ≈ <b class="a">${dec(val(A))} ${sq(u)}</b>`}.`],
    pict: { pic, solve: { show: [around ? 'C' : 'A'], tex: around ? `C = 2\\pi \\times ${r} = ${C}\\pi` : `A = \\pi \\times ${r}^2 = ${A}\\pi` } },
  }, {
    ans: val(ansC), tol: exact ? 1e-6 : 0.006,
    right: around ? `Yes: around the edge, C = ${C}π${exact ? '' : ` ≈ ${dec(val(C))}`} ${u}.` : `Yes: the inside, A = ${A}π${exact ? '' : ` ≈ ${dec(val(A))}`} ${sq(u)}.`,
    wrongs: [
      { v: val(around ? A : C), mc: MC.sameAttr, say: around ? `That is the area, the inside. ${Up(ctx.around)} only goes around the edge: C = 2πr.` : `That is the circumference, around the edge. ${Up(ctx.cover)} covers the inside: A = πr².` },
      { v: val(around ? 2 * d : d * d), mc: MC.dForR, say: `That uses ${d}, the diameter, as the radius. r = ${r}.` },
      ...(exact ? [] : [{ v: around ? 3 * C : 3 * A, say: 'That is the estimate with π ≈ 3. Use 3.14.' }]),
    ],
    other: around ? `Around the edge: C = 2 × π × ${r}.` : `The inside: A = π × ${r} × ${r}.`,
  });
};

// ===================================================================================================================
// 14 sector-rearrangement, 15 derive-area
// ===================================================================================================================
const WLOOKS: Look[] = ['pizza', 'rug', 'plain', 'table', 'lid'];
const wedgeRead: Gen = (R, n) => {
  const nW = pick(R, [8, 16, 32]), look = pick(R, WLOOKS);
  const v = pick(R, ['top', 'area', 'exact', 'num'] as const);
  if (v === 'num') {
    const r = int(R, 2, 12), u = pick(R, ['cm', 'in', 'ft']);
    const pic: Pic = { kind: 'wedges', look, n: nW, htTag: unitTex(String(r), u), topTag: '?' };
    return numeric({
      id: `wedgeRead-${n}`, family: 'wedgeRead', prompt: `A circle with r = ${r} ${u} is cut into ${nW} wedges and laid out like this. How long are the arcs along the top, all together? Answer in terms of π.`, unit: `π ${u}`,
      board: `C = 2\\pi \\times ${r} = ${2 * r}\\pi`,
      solution: [`The whole crust is the circumference: C = 2π × ${r} = ${2 * r}π.`, `Half of the wedges point up, half point down: the top gets half of it, <b class="b">${r}π ${u}</b>.`],
      pict: { pic, solve: { show: ['top'], tex: `\\tfrac{1}{2} \\times ${2 * r}\\pi = ${piTex(r)}` } },
    }, {
      ans: r, right: `Yes: the top is half the circumference, ${r}π ${u}.`,
      wrongs: [{ v: 2 * r, mc: MC.dropHalf, say: `${2 * r}π is the WHOLE circumference. The other half is along the bottom.` }],
      other: `The whole circumference is ${2 * r}π; the top has half of it.`,
    });
  }
  const pic: Pic = { kind: 'wedges', look, n: nW, htTag: 'r' };
  const base = { id: `wedgeRead-${n}`, family: 'wedgeRead' as const, board: `${nW}\\ \\text{wedges}` };
  if (v === 'top') return choice(R, {
    ...base, prompt: `A circle with radius r is cut into ${nW} wedges and laid out like this. All the arcs along the top together are how long?`,
    solution: ['Every wedge brings its piece of the crust. Half the wedges point down, half point up.', 'So the top gets half of the circumference: ½ × 2πr = <b class="b">πr</b>.'],
    pict: { pic, solve: { show: ['top'], tex: `\\tfrac{1}{2}C = \\pi r` } },
  }, [
    { t: 'half the circumference: πr', ok: true, say: 'Yes: half the crust is on top, half at the bottom. ½ × 2πr = πr.' },
    { t: 'the whole circumference: 2πr', mc: MC.dropHalf, say: 'Only half the wedges have their crust on top. The other half of the circumference runs along the bottom.' },
    { t: 'the diameter: 2r', mc: MC.aroundAcross, say: 'The top is made of curved crust, the way around, not across. It is half of 2πr.' },
    { t: 'the radius: r', say: 'r is the height of the shape (the side of a wedge). The top is half the crust: πr.' },
  ]);
  if (v === 'area') return choice(R, {
    ...base, prompt: `The circle is cut into ${nW} wedges and laid out like this. Compare the area of the new shape with the area of the circle.`,
    solution: ['Nothing is added and nothing is thrown away: the same wedges, moved.', 'So the area is exactly the same.'],
    pict: { pic, solve: { show: ['A'], tex: T('same wedges, same area') } },
  }, [
    { t: 'exactly the same', ok: true, say: 'Yes: the same pieces, only moved. The area does not change.' },
    { t: 'more: the shape is longer than the circle is wide', mc: MC.rearrange, say: 'Longer but flatter. It is made of the very same wedges, so the area is the same.' },
    { t: 'less: the wedges leave gaps', mc: MC.rearrange, say: 'The wedges fit edge to edge, and every one is still there. Same area.' },
  ]);
  return choice(R, {
    ...base, prompt: `Is the shape made from the ${nW} wedges exactly a rectangle?`,
    solution: ['The top and bottom are bumpy arcs, and the sides lean a little.', 'With thinner wedges the bumps shrink, and the shape gets closer and closer to a rectangle πr long and r tall.'],
    pict: { pic, solve: { show: ['top', 'ht'], tex: T('thinner: closer') } },
  }, [
    { t: 'No: its top is still bumpy; thinner wedges bring it closer to a rectangle', ok: true, say: 'Yes: it only approaches a rectangle as the wedges get thinner.' },
    { t: `Yes: with ${nW} wedges it is exactly a rectangle`, mc: MC.exactRect, say: `Look at the top: ${nW} small arcs, not a straight line. It only gets close to a rectangle.` },
    { t: 'Yes: any number of wedges makes an exact rectangle', mc: MC.exactRect, say: 'With few wedges the top is very bumpy. More wedges make it closer, never exact.' },
  ]);
};
const deriveArea: Gen = (R, n) => {
  const v = pick(R, ['num', 'num', 'step', 'proof'] as const);
  const look = pick(R, WLOOKS);
  if (v === 'num') {
    const r = int(R, 2, 12), u = pick(R, ['cm', 'in', 'ft']);
    const pic: Pic = { kind: 'wedges', look, n: 16, htTag: unitTex(String(r), u), topTag: piTex(r) };
    return numeric({
      id: `deriveArea-${n}`, family: 'deriveArea', prompt: `The wedges of a circle with r = ${r} ${u} make a shape about ${r}π long and ${r} tall. What is the circle's area? Answer in terms of π.`, unit: `π sq ${u}`,
      board: `A \\approx \\text{long} \\times \\text{tall}`,
      solution: [`Long side: half of C = ½ × 2π × ${r} = ${r}π. Height: r = ${r}.`, `A = ${r}π × ${r} = <b class="a">${r * r}π sq ${u}</b>, which is πr².`],
      pict: { pic, solve: { show: ['top', 'ht', 'A'], tex: `A = ${piTex(r)} \\times ${r} = ${piTex(r * r)}` } },
    }, {
      ans: r * r, right: `Yes: ${r}π × ${r} = ${r * r}π, which is π × ${r}².`,
      wrongs: [{ v: 2 * r * r, mc: MC.dropHalf, say: `That uses the whole circumference as the long side. Only half of it (${r}π) is along the top.` }, { v: 2 * r, mc: MC.powTimes, say: `${r}π × ${r} = ${r * r}π, not ${2 * r}π.` }],
      other: `Long side × height: ${r}π × ${r}.`,
    });
  }
  const pic: Pic = { kind: 'wedges', look, n: 16, htTag: 'r', topTag: '\\tfrac{1}{2}C' };
  if (v === 'step') return choice(R, {
    id: `deriveArea-${n}`, family: 'deriveArea', prompt: 'The wedges make a near-rectangle: ½C long, r tall. Fill the gap: A = ½C × r = ▢ = πr². What goes in the gap?',
    board: 'A = \\tfrac{1}{2}C \\times r = \\ \\square\\ = \\pi r^2',
    solution: ['Put C = 2πr in: A = ½ × 2πr × r.', 'Regroup (you may multiply in any order): ½ × 2 = 1 and r × r = r², so A = <b class="a">πr²</b>.'],
    pict: { pic, solve: { show: ['top', 'ht'], tex: '\\tfrac{1}{2} \\times 2\\pi r \\times r' } },
  }, [
    { t: '½ × 2πr × r', ok: true, say: 'Yes: put C = 2πr into ½C × r. Then ½ × 2 = 1 and r × r = r².' },
    { t: '2πr × r', mc: MC.dropHalf, say: 'The long side is HALF the circumference. 2πr × r would be twice the area.' },
    { t: 'πr × 2r', mc: MC.dForR, say: 'The height is the radius r, not the diameter 2r.' },
    { t: '½ × 2πr + r', say: 'Area is long side TIMES height, not plus.' },
  ]);
  const name = pick(R, NAMES);
  return choice(R, {
    id: `deriveArea-${n}`, family: 'deriveArea', prompt: `${name} measured 3 round lids, worked out πr² for each, and the areas matched. ${name} says: “That proves A = πr² for every circle.” Is that a proof?`,
    board: 'A = \\pi r^2',
    solution: ['Three checks show it works for three lids. They do not show it for every circle.', 'The wedge argument works for ANY radius r: same area, a near-rectangle ½C by r, so A = πr².'],
    pict: { pic, solve: { show: ['top', 'ht'], tex: T('works for any r') } },
  }, [
    { t: 'No: three checks are examples; the wedge argument works for every r', ok: true, say: 'Right. Examples support a rule; the wedge argument explains it for every circle.' },
    { t: 'Yes: it worked three times in a row', mc: MC.examples, say: 'Three examples are not every circle. A proof has to work for any r, like the wedge argument.' },
    { t: 'Yes, because the lids were all different sizes', mc: MC.examples, say: 'Different sizes help, but they are still only three cases. The wedge argument covers every r.' },
  ]);
};

// ===================================================================================================================
// 16-18 scaling
// ===================================================================================================================
const pairPic = (look: Look, r1: number, r2: number, u: string): Pic => ({ kind: 'pair', look, r1, r2, tags: [`r = ${unitTex(dec(r1), u)}`, `r = ${unitTex(dec(r2), u)}`], seg: 'radius' });
const scaleC: Gen = (R, n) => {
  const k = pick(R, [2, 3, 4]), u = pick(R, ['cm', 'in', 'ft']), look = pick(R, ['plain', 'lid', 'pool', 'rug'] as Look[]);
  if (R() < 0.6) {
    const r = int(R, 1, 6), r2 = k * r;
    return numeric({
      id: `scaleC-${n}`, family: 'scaleC', prompt: `A circle's radius goes from ${r} ${u} to ${r2} ${u}. Its circumference was ${piH(2 * r)} ${u}. What is the new circumference? Answer in terms of π. ${NOCALC}`, unit: `π ${u}`,
      board: `r: ${r} \\to ${r2}\\quad (\\times ${k})`,
      solution: [`The radius is multiplied by ${r2} ÷ ${r} = ${k}.`, `C = 2πr, so C is multiplied by ${k} too: ${2 * r}π × ${k} = <b class="b">${2 * r2}π ${u}</b>. Check: 2π × ${r2} = ${2 * r2}π.`],
      pict: { pic: pairPic(look, r, r2, u), solve: { show: ['C'], tex: `2\\pi \\times ${r2} = ${2 * r2}\\pi` } },
    }, {
      ans: 2 * r2, right: `Yes: radius × ${k}, circumference × ${k}: ${2 * r2}π ${u}.`,
      wrongs: [{ v: 2 * r * k * k, mc: MC.areaToLen, say: `× ${k * k} is what happens to the AREA. A length like C is only × ${k}.` },
        { v: 2 * r + (r2 - r), mc: MC.additive, say: `The radius was MULTIPLIED by ${k}, not increased by ${r2 - r}. So C is × ${k} too.` }],
      other: `C = 2π × ${r2}.`,
    });
  }
  return numeric({
    id: `scaleC-${n}`, family: 'scaleC', prompt: `Every radius of a circle is multiplied by ${k}. Its circumference is multiplied by…`, unit: '',
    board: `2\\pi(${k}r) = ${k}\\,(2\\pi r)`,
    solution: [`C = 2π × r. With ${k}r instead of r: 2π × ${k}r = ${k} × (2πr).`, `So the circumference is multiplied by <b class="s">${k}</b>, like every length.`],
    pict: { pic: pairPic(look, 1.5, 1.5 * k, u), solve: { show: ['C'], tex: `C \\times ${k}` } },
  }, {
    ans: k, right: `Yes: × ${k}. The circumference is a length, so it scales like the radius.`,
    wrongs: [{ v: k * k, mc: MC.areaToLen, say: `× ${k * k} is for the AREA. The circumference is a length: × ${k}.` }],
    other: `2π(${k}r) = ${k} × 2πr.`,
  });
};
const scaleA: Gen = (R, n) => {
  const k = pick(R, [2, 3]), u = pick(R, ['cm', 'in', 'ft']), look = pick(R, ['plain', 'pizza', 'rug', 'pool'] as Look[]);
  if (R() < 0.55) {
    const r = int(R, 1, 5), r2 = k * r;
    return numeric({
      id: `scaleA-${n}`, family: 'scaleA', prompt: `A circle's radius goes from ${r} ${u} to ${r2} ${u}. Its area was ${piH(r * r)} sq ${u}. What is the new area? Answer in terms of π. ${NOCALC}`, unit: `π sq ${u}`,
      board: `r: ${r} \\to ${r2}\\quad (\\times ${k})`,
      solution: [`The radius is × ${k}. A = π × r × r uses r twice, so the area is × ${k} × ${k} = ${k * k}.`, `${r * r}π × ${k * k} = <b class="a">${r2 * r2}π sq ${u}</b>. Check: π × ${r2}² = ${r2 * r2}π.`],
      pict: { pic: pairPic(look, r, r2, u), solve: { show: ['quad'], tex: `\\pi \\times ${r2}^2 = ${r2 * r2}\\pi` } },
    }, {
      ans: r2 * r2, right: `Yes: radius × ${k}, area × ${k * k}: ${r2 * r2}π sq ${u}. ${k * k} small circles fit the big one's square the same way.`,
      wrongs: [{ v: r * r * k, mc: MC.areaByK, say: `The area is not × ${k}: r is used twice in πr², so it is × ${k} × ${k} = ${k * k}.` }, { v: r * r + (r2 - r), mc: MC.additive, say: `The radius was multiplied by ${k}, not increased. The area is × ${k * k}.` }],
      other: `A = π × ${r2} × ${r2}.`,
    });
  }
  return numeric({
    id: `scaleA-${n}`, family: 'scaleA', prompt: `Every radius of a circle is multiplied by ${k}. Its area is multiplied by…`, unit: '',
    board: `\\pi(${k}r)^2 = ${k * k}\\,\\pi r^2`,
    solution: [`A = π × r × r. With ${k}r: π × ${k}r × ${k}r = ${k} × ${k} × πr².`, `So the area is multiplied by <b class="s">${k * k}</b>: ${k * k} small circles fit the big one's square the same way.`],
    pict: { pic: pairPic(look, 1.5, 1.5 * k, u), solve: { show: ['quad'], tex: `A \\times ${k * k}` } },
  }, {
    ans: k * k, right: `Yes: × ${k} × ${k} = × ${k * k}.`,
    wrongs: [{ v: k, mc: MC.areaByK, say: `× ${k} is for lengths. The area uses r twice: × ${k} × ${k}.` }, { v: 2 * k, mc: MC.powTimes, say: `${k}² means ${k} × ${k}, not ${k} × 2.` }],
    other: `π(${k}r)² = ${k} × ${k} × πr².`,
  });
};
const FRACS = [{ p: 1, q: 2 }, { p: 1, q: 3 }, { p: 3, q: 2 }, { p: 1, q: 1 }, { p: 2, q: 3 }];
const kH = (p: number, q: number) => (q === 1 ? String(p) : fr(p, q));
const scaleFrac: Gen = (R, n) => {
  const f = pick(R, FRACS), dot5 = f.p === 3 && f.q === 2 && R() < 0.5;
  const kTxt = dot5 ? '1.5' : kH(f.p, f.q), u = pick(R, ['cm', 'in', 'ft']), look = pick(R, ['plain', 'pizza', 'rug', 'lid'] as Look[]);
  const r1 = f.q === 3 ? 6 : f.q === 2 ? (f.p === 3 ? 4 : 6) : 4, r2 = (r1 * f.p) / f.q;
  const pic = pairPic(look, r1, r2, u);
  const a2 = [f.p * f.p, f.q * f.q] as const;
  if (R() < 0.55) {
    const A2 = kH(a2[0], a2[1]);
    const opts: Opt[] = [
      { t: `C × ${kTxt}, A × ${A2}`, ok: true, say: `Yes: lengths × ${kTxt}, the area × ${kTxt} × ${kTxt} = ${A2}.` },
      ...(f.p === f.q ? [] : [{ t: `C × ${kTxt}, A × ${kTxt}`, mc: MC.areaByK, say: `The area uses r twice: × ${kTxt} × ${kTxt} = ${A2}.` }]),
      ...(f.p === f.q ? [] : [{ t: `C × ${A2}, A × ${A2}`, mc: MC.areaToLen, say: `The circumference is a length: × ${kTxt}, like the radius.` }]),
      f.p < f.q
        ? { t: `C × ${kH(f.q, f.p)}, A × ${kH(f.q * f.q, f.p * f.p)}`, mc: MC.mulBigger, say: `× ${kTxt} makes things SMALLER: the new circle is smaller, so both shrink.` }
        : f.p === f.q ? { t: 'C × 2, A × 4', mc: MC.mulBigger, say: 'Multiplying by 1 changes nothing: the circle stays the same size.' }
          : { t: `C × ${kTxt}, A × 3`, mc: MC.powTimes, say: `(3/2)² means 3/2 × 3/2 = 9/4, not 3/2 × 2.` },
    ];
    return choice(R, {
      id: `scaleFrac-${n}`, family: 'scaleFrac', prompt: `A circle's radius is multiplied by ${kTxt} (from ${r1} ${u} to ${dec(r2)} ${u}). What happens to its circumference C and its area A? ${NOCALC}`,
      board: `r \\times ${dot5 ? '1.5' : f.q === 1 ? f.p : `\\tfrac{${f.p}}{${f.q}}`}`,
      solution: [`C = 2πr is a length: × ${kTxt}.`, `A = πr² uses r twice: × ${kTxt} × ${kTxt} = <b class="s">${A2}</b>${dot5 ? ' = 2.25' : ''}.`],
      pict: { pic, solve: { show: ['C', ...(pic.kind === 'pair' && f.p !== f.q ? ['quad'] : [])], tex: `A \\times ${a2[1] === 1 ? a2[0] : `\\tfrac{${a2[0]}}{${a2[1]}}`}` } },
    }, opts);
  }
  return numeric({
    id: `scaleFrac-${n}`, family: 'scaleFrac', prompt: `A circle's radius is multiplied by ${kTxt}. Its area is multiplied by what number? ${NOCALC}`, unit: '',
    board: `\\pi\\left(${dot5 ? '1.5' : f.q === 1 ? f.p : `\\tfrac{${f.p}}{${f.q}}`}\\, r\\right)^2`,
    solution: [`The area uses r twice: × ${kTxt} × ${kTxt}.`, `= × <b class="s">${kH(a2[0], a2[1])}</b>${a2[1] !== 1 ? ` (${dec(a2[0] / a2[1])})` : ''}${f.p < f.q ? ': smaller, since the factor is less than 1' : ''}.`],
    pict: { pic, solve: { show: f.p !== f.q ? ['quad'] : ['A'], tex: `\\times ${a2[1] === 1 ? a2[0] : `\\tfrac{${a2[0]}}{${a2[1]}}`}` } },
  }, {
    ans: a2[0] / a2[1], input: 'frac', frac: [a2[0], a2[1]], tol: 0.0011,
    right: `Yes: ${kTxt} × ${kTxt} = ${a2[1] === 1 ? a2[0] : `${a2[0]}/${a2[1]}`}.`,
    wrongs: [{ v: f.p / f.q, mc: MC.areaByK, say: `× ${kTxt} is for lengths. The area is × ${kTxt} × ${kTxt}.` },
      ...(f.p < f.q ? [{ v: (f.q * f.q) / (f.p * f.p), mc: MC.mulBigger, say: `× ${kTxt} makes the circle smaller, so its area shrinks: × ${kTxt} × ${kTxt}.` }] : []),
      ...(f.p > f.q ? [{ v: (2 * f.p) / f.q, mc: MC.powTimes, say: `Squared means × ${kTxt} × ${kTxt}, not × 2.` }] : [])],
    other: `Multiply ${kTxt} × ${kTxt}.`,
  });
};

// ===================================================================================================================
// 19 proportional-contrast
// ===================================================================================================================
const propCheck: Gen = (R, n) => {
  const s = pick(R, [1, 2, 3]), rs = [1, 2, 3, 4].map(i => i * s);
  const table = `<table class="tbl"><tr><th>r</th>${rs.map(r => `<td>${r}</td>`).join('')}</tr><tr><th class="b">C</th>${rs.map(r => `<td>${piH(2 * r)}</td>`).join('')}</tr><tr><th class="a">A</th>${rs.map(r => `<td>${piH(r * r)}</td>`).join('')}</tr></table>`;
  const v = pick(R, ['which', 'which', 'const', 'ratioA', 'other'] as const);
  const base = { id: `propCheck-${n}`, family: 'propCheck' as const, board: '\\tfrac{C}{r} \\qquad \\tfrac{A}{r}' };
  if (v === 'which') return choice(R, {
    ...base, prompt: `Look at the table. Which one is proportional to the radius r?${table}`,
    solution: ['Proportional: the ratio is the same in every row (and the graph is a straight line through the origin).', `C ÷ r = 2π every time. A ÷ r = ${rs.map(r => piH(r)).join(', ')}: it changes. So only <b class="b">C</b> is proportional to r.`],
  }, [
    { t: 'C only', ok: true, say: 'Yes: C ÷ r is always 2π. A ÷ r keeps growing, so A is not proportional to r.' },
    { t: 'C and A: both are 0 when r is 0', mc: MC.origin, say: 'Starting at 0 is not enough. The ratio must stay the same: A ÷ r keeps changing.' },
    { t: 'A only', say: 'Check the ratios: C ÷ r is always 2π, A ÷ r changes.' },
    { t: 'neither', say: 'C ÷ r is 2π in every row, so C is proportional to r.' },
  ]);
  if (v === 'const') return numeric({
    ...base, prompt: `Look at the table. C ÷ r is the same in every row. What is it, in terms of π?${table}`, unit: 'π',
    solution: [`${piH(2 * rs[0]!)} ÷ ${rs[0]} = 2π, ${piH(2 * rs[2]!)} ÷ ${rs[2]} = 2π.`, 'The constant of proportionality of C and r is <b class="s">2π</b> (for C and d it is π).'],
  }, {
    ans: 2, right: 'Yes: C = 2π × r, so the constant is 2π.',
    wrongs: [{ v: 1, say: 'π is the constant for C and the DIAMETER. For the radius it is 2π.' }],
    other: `Divide: ${piH(2 * rs[1]!)} ÷ ${rs[1]}.`,
  });
  if (v === 'ratioA') return choice(R, {
    ...base, prompt: `In the table, A ÷ r is ${rs.slice(0, 3).map(r => piH(r)).join(', ')}, … So the area A is…${table}`,
    solution: ['For a proportional relationship the ratio stays the same.', 'A ÷ r keeps changing, so A is <b>not</b> proportional to r (the graph curves). A is proportional to r², with constant π.'],
  }, [
    { t: 'not proportional to r: A ÷ r keeps changing', ok: true, say: 'Yes: the ratio changes, so it is not proportional. (A is proportional to r².)' },
    { t: 'proportional to r: A ÷ r grows steadily', mc: MC.allProp, say: 'Proportional means the ratio stays the SAME. Here it grows.' },
    { t: 'proportional to r: A is 0 when r is 0', mc: MC.origin, say: 'Starting at 0 is not enough: the ratio must stay the same, and A ÷ r changes.' },
  ]);
  return choice(R, {
    ...base, prompt: 'Which of these pairs is proportional?',
    solution: ['Proportional: one is always the same number times the other.', 'Perimeter = 4 × side, and C = 2π × r. Areas use the length twice, so they are not proportional to it.'],
  }, [
    { t: 'the perimeter of a square and its side', ok: true, say: 'Yes: perimeter = 4 × side, the same factor every time.' },
    { t: 'the area of a square and its side', mc: MC.allProp, say: 'Double the side and the area is 4 times as big: area ÷ side changes. Not proportional.' },
    { t: 'the area of a circle and its radius', mc: MC.allProp, say: 'A = πr²: double r and A is 4 times as big. A ÷ r changes, so it is not proportional.' },
  ]);
};

// ===================================================================================================================
// 20 context-compare, 21 area-factor-to-length
// ===================================================================================================================
const claimJudge: Gen = (R, n) => {
  const ctx = pick(R, CTX.filter(c => ['pizza', 'garden', 'rug', 'pool', 'table'].includes(c.id)));
  const name = pick(R, NAMES), k = pick(R, [2, 3, 2, 0.5]), u = ctx.u;
  const r1 = k === 0.5 ? 2 * int(R, 2, 5) : int(R, 2, 5), r2 = r1 * k;
  const kTxt = k === 0.5 ? fr(1, 2) : String(k), k2 = k === 0.5 ? fr(1, 4) : String(k * k);
  const aroundW = ctx.aroundW, coverW = ctx.coverW;
  if (ctx.id === 'pizza' && R() < 0.5 && k !== 0.5) {
    const d1 = 2 * r1, d2 = 2 * r2;
    return numeric({
      id: `claimJudge-${n}`, family: 'claimJudge', prompt: `How many ${d1}-inch pizzas have as much pizza (area) as one ${d2}-inch pizza?`, unit: 'pizzas',
      board: `d: ${d1} \\to ${d2}\\quad (\\times ${k})`,
      solution: [`Across is × ${k}, so the area is × ${k} × ${k} = ${k * k}.`, `One ${d2}-inch pizza = <b class="s">${k * k}</b> of the ${d1}-inch ones.`],
      pict: { pic: { kind: 'pair', look: 'pizza', r1: r2, r2: r1, tags: [`${d2}\\text{ in}`, `${d1}\\text{ in}`], seg: 'diameter' }, solve: { show: ['quad'], tex: `${k} \\times ${k} = ${k * k}` } },
    }, {
      ans: k * k, right: `Yes: × ${k} across means × ${k * k} in area.`,
      wrongs: [{ v: k, mc: MC.areaByK, say: `${k} small ones only reach across the big one. The area is × ${k} × ${k} = ${k * k}.` }],
      other: `The diameter is × ${k}; the area is × ${k} × ${k}.`,
    });
  }
  const bigger = k > 1;
  const opts: Opt[] = [
    { t: `Right about the ${aroundW}; the ${coverW} is × ${k2}`, ok: true, say: `Yes: the ${aroundW} is a length (× ${kTxt}), the ${coverW} is an area (× ${kTxt} × ${kTxt} = ${k2}).` },
    { t: `Right about both`, mc: MC.areaByK, say: `The ${coverW} covers an area, and area uses r twice: × ${kTxt} × ${kTxt} = ${k2}.` },
    { t: `Both are × ${k2}`, mc: MC.areaToLen, say: `The ${aroundW} is a length around the edge: × ${kTxt}, like the radius.` },
    { t: `The ${aroundW} is × ${k2}, the ${coverW} × ${kTxt}`, mc: MC.sameAttr, say: `Swapped: around the edge is a length (× ${kTxt}), covering the inside is an area (× ${k2}).` },
  ];
  return choice(R, {
    id: `claimJudge-${n}`, family: 'claimJudge',
    prompt: `${name} has two ${ctx.id === 'pizza' ? 'pizzas' : ctx.id === 'garden' ? 'round flower beds' : ctx.id === 'rug' ? 'round rugs' : ctx.id === 'pool' ? 'round pools' : 'round tabletops'}: radius ${r1} ${u} and ${dec(r2)} ${u}. ${name} says: “The ${bigger ? 'big' : 'small'} one has ${kTxt} times the radius, so it needs ${kTxt} times the ${aroundW} and ${kTxt} times the ${coverW}.”`,
    board: `r \\times ${k === 0.5 ? '\\tfrac{1}{2}' : k}`,
    solution: [`The ${aroundW} goes around: C = 2πr, × ${kTxt}.`, `The ${coverW} covers the inside: A = πr², × ${kTxt} × ${kTxt} = <b class="s">${k2}</b>.`],
    pict: { pic: { ...pairPic(ctx.look, r1, r2, u) }, solve: { show: ['C', 'quad'], tex: `C \\times ${k === 0.5 ? '\\tfrac{1}{2}' : k},\\ A \\times ${k === 0.5 ? '\\tfrac{1}{4}' : k * k}` } },
  }, opts);
};
const areaBack: Gen = (R, n) => {
  const f = pick(R, [{ a: 4, b: 1 }, { a: 9, b: 1 }, { a: 16, b: 1 }, { a: 25, b: 1 }, { a: 1, b: 4 }, { a: 1, b: 9 }, { a: 9, b: 4 }]);
  const ctx = pick(R, CTX.filter(c => ['pizza', 'garden', 'rug', 'pool', 'table', 'lid'].includes(c.id)));
  const k = [Math.sqrt(f.a), Math.sqrt(f.b)] as const, fa = f.b === 1 ? String(f.a) : fr(f.a, f.b), fk = k[1] === 1 ? String(k[0]) : fr(k[0], k[1]);
  const obj = ctx.id === 'pizza' ? 'pizza' : ctx.id === 'garden' ? 'flower bed' : ctx.id === 'rug' ? 'rug' : ctx.id === 'pool' ? 'pool' : ctx.id === 'lid' ? 'lid' : 'tabletop';
  return numeric({
    id: `areaBack-${n}`, family: 'areaBack', prompt: `A round ${obj} has ${fa} times the area of a smaller one${f.a < f.b ? ' (it is the smaller one)' : ''}. How many times the radius does it have? ${NOCALC}`, unit: '',
    board: `A \\times ${f.b === 1 ? f.a : `\\tfrac{${f.a}}{${f.b}}`} \\ \\Rightarrow\\ r \\times\\ ?`,
    solution: ['If the radius is × k, the area is × k × k.', `Which k times itself makes ${fa}? ${fk} × ${fk} = ${fa}, so the radius is × <b class="s">${fk}</b>.`],
  }, {
    ans: k[0] / k[1], input: f.b === 1 ? 'num' : 'frac', frac: f.b === 1 ? undefined : [k[0], k[1]],
    right: `Yes: radius × ${fk} gives area × ${fk} × ${fk} = ${fa}.`,
    wrongs: [{ v: f.a / f.b, mc: MC.areaToLen, say: `× ${fa} is the AREA factor. The radius factor k has k × k = ${fa}.` },
      { v: (f.a * f.a) / (f.b * f.b), mc: MC.areaToLen, say: `Go back, not further: k × k = ${fa}, so k is smaller than ${fa}.` },
      { v: f.a / f.b / 2, mc: MC.rootHalf, say: `Halving is not undoing a square. Which number times itself is ${fa}?` }],
    other: `Find k with k × k = ${fa}.`,
  });
};

// ===================================================================================================================
// 22 reverse-c, 23 reverse-a
// ===================================================================================================================
const reverseC: Gen = (R, n) => {
  const v = pick(R, ['exact', '314', '314', 'calc'] as const), u = pick(R, ['in', 'cm', 'ft', 'm']), look = pick(R, ['plain', 'lid', 'pool', 'garden'] as Look[]);
  const askR = R() < 0.5;
  if (v === 'exact') {
    const c = 2 * int(R, 2, 20), d = c, r = c / 2, ans = askR ? r : d;
    const { pic } = givenAsked(R, look, { kind: askR ? 'radius' : 'diameter', tag: '?', ans: unitTex(String(ans), u) }, null, { ctag: `C = ${piTex(c)}` });
    return numeric({
      id: `reverseC-${n}`, family: 'reverseC', prompt: `A circle's circumference is ${piH(c)} ${u}. What is its ${askR ? 'radius' : 'diameter'}? ${NOCALC}`, unit: u,
      board: askR ? `2\\pi r = ${piTex(c)}` : `\\pi d = ${piTex(c)}`,
      solution: askR ? [`C = 2πr, so 2πr = ${c}π.`, `Divide both sides by 2π: r = ${c} ÷ 2 = <b class="s">${r} ${u}</b>. Check: 2π × ${r} = ${c}π.`] : [`C = πd, so πd = ${c}π.`, `Divide both sides by π: d = <b class="s">${d} ${u}</b>. Check: π × ${d} = ${c}π.`],
      pict: { pic, solve: { show: ['seg0A'], tex: askR ? `r = ${c}\\pi \\div 2\\pi = ${r}` : `d = ${c}\\pi \\div \\pi = ${d}` } },
    }, {
      ans, right: askR ? `Yes: 2π × ${r} = ${c}π, so r = ${r} ${u}.` : `Yes: π × ${d} = ${c}π, so d = ${d} ${u}.`,
      wrongs: askR ? [{ v: d, mc: MC.dForR, say: `${d} is the diameter (πd = ${c}π). The radius is half of it.` }] : [{ v: r, mc: MC.rForD, say: `${r} is the radius (2πr = ${c}π). The diameter is twice it.` }],
      other: askR ? `Solve 2πr = ${c}π: divide by 2π.` : `Solve πd = ${c}π: divide by π.`,
    });
  }
  const calc = v === 'calc';
  const d = calc ? 0 : pick(R, [5, 10, 20, 15, 30, 12, 50, 100]);
  const C = calc ? pick(R, [50, 40, 75, 100, 30, 60, 90]) : roundTo(3.14 * d, 2);
  const piV = calc ? PI : 3.14;
  const ans = calc ? roundTo(askR ? C / (2 * PI) : C / PI, 1) : askR ? d / 2 : d;
  const tol = calc ? 0.051 : 1e-6;
  const { pic } = givenAsked(R, look, { kind: askR ? 'radius' : 'diameter', tag: '?', ans: unitTex(dec(ans), u) }, null, { ctag: `C = ${unitTex(dec(C), u)}` });
  return numeric({
    id: `reverseC-${n}`, family: 'reverseC',
    prompt: `A circle's circumference is ${dec(C)} ${u}. ${calc ? 'Use the π key' : 'Use π ≈ 3.14'} to find its ${askR ? 'radius' : 'diameter'}${calc ? ', to the nearest tenth' : ''}. ${calc ? CALC : NOCALC}`, unit: u,
    board: askR ? `2\\pi r = ${dec(C)}` : `\\pi d = ${dec(C)}`,
    solution: [askR ? `Write the equation: 2 × ${calc ? 'π' : '3.14'} × r = ${dec(C)}.` : `Write the equation: ${calc ? 'π' : '3.14'} × d = ${dec(C)}.`,
      askR ? `Divide by 2π (${calc ? 'about 6.28' : '6.28'}): r ${calc ? '≈' : '='} <b class="s">${dec(ans)} ${u}</b>.` : `Divide by ${calc ? 'π' : '3.14'}: d ${calc ? '≈' : '='} <b class="s">${dec(ans)} ${u}</b>.`,
      `Check: ${askR ? `2 × ${calc ? 'π' : '3.14'} × ${dec(ans)}` : `${calc ? 'π' : '3.14'} × ${dec(ans)}`} ${calc ? '≈' : '='} ${dec(roundTo(askR ? 2 * piV * ans : piV * ans, 1))}.`],
    pict: { pic, solve: { show: ['seg0A'], tex: askR ? `r = ${dec(C)} \\div 2\\pi ${calc ? '\\approx' : '='} ${dec(ans)}` : `d = ${dec(C)} \\div \\pi ${calc ? '\\approx' : '='} ${dec(ans)}` } },
  }, {
    ans, tol, right: `Yes: ${askR ? 'r' : 'd'} ${calc ? '≈' : '='} ${dec(ans)} ${u}. Check it by putting it back into the formula.`,
    wrongs: [{ v: roundTo(C / 2, calc ? 1 : 2), mc: MC.halveC, say: askR ? `Halving C does not give r: C = 2πr, so divide by 2π, not by 2.` : `C = πd: divide by π, not by 2.` },
      ...(askR ? [{ v: roundTo(C / piV, calc ? 1 : 2), mc: MC.dForR, say: `${dec(roundTo(C / piV, 1))} is the diameter (C ÷ π). The radius is half of it.` }] : [])],
    other: askR ? `Solve 2πr = ${dec(C)}: divide by 2π.` : `Solve πd = ${dec(C)}: divide by π.`,
  });
};
const reverseA: Gen = (R, n) => {
  const r = int(R, 3, 12), u = pick(R, ['cm', 'in', 'ft']), look = pick(R, ['plain', 'pizza', 'pool', 'rug'] as Look[]);
  const exact = R() < 0.6;
  const A = exact ? r * r : roundTo(3.14 * r * r, 2);
  const atag = exact ? `A = ${piTex(r * r)}` : `A = ${dec(A)}`;
  let pic: Pic = discPic(look, [{ kind: 'radius', a: 25, tag: '?', ans: `r = ${unitTex(String(r), u)}` }], { atag });
  if (!fits(pic)) pic = discPic(look, [{ kind: 'radius', a: 25, tag: '?' }], { atag });
  return numeric({
    id: `reverseA-${n}`, family: 'reverseA',
    prompt: `A circle's area is ${exact ? `${piH(r * r)} sq ${u}` : `${dec(A)} sq ${u} (use π ≈ 3.14)`}. What is its radius? ${NOCALC}`, unit: u,
    board: exact ? `\\pi r^2 = ${piTex(r * r)}` : `3.14\\, r^2 = ${dec(A)}`,
    solution: [exact ? `πr² = ${r * r}π, so r² = ${r * r}.` : `3.14 × r² = ${dec(A)}, so r² = ${dec(A)} ÷ 3.14 = ${r * r}.`, `r² = ${r * r}: which number times itself is ${r * r}? r = <b class="s">${r} ${u}</b>.`],
    pict: { pic, solve: { show: ['seg0A'], tex: `r^2 = ${r * r},\\ r = ${r}` } },
  }, {
    ans: r, right: `Yes: ${r} × ${r} = ${r * r}, so r = ${r} ${u}.`,
    wrongs: [{ v: r * r, mc: MC.noRoot, say: `${r * r} is r², not r. One more step: which number times itself is ${r * r}?` },
      { v: (r * r) / 2, mc: MC.rootHalf, say: `Halving does not undo a square. ${r * r} ÷ 2 × ${r * r} ÷ 2 is not ${r * r}.` }],
    other: `First r² = ${r * r}, then the number that times itself makes ${r * r}.`,
  });
};

export const GENS: Record<FamilyId, Gen> = {
  whichSeg, convertRD, aroundAcross, lengthOrArea, gridBound, piRatio, cFromD, cFromR, aFromR, aFromD, approx, chooseMeasure,
  wedgeRead, deriveArea, scaleC, scaleA, scaleFrac, propCheck, claimJudge, areaBack, reverseC, reverseA,
};
