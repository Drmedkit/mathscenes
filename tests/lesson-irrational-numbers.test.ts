// Rational and irrational numbers: every family x every sub-goal it serves x 300 seeds makes valid items (the answer
// passes, choices are unique with exactly one right, pictures can be drawn), the main misconceptions are classified,
// the exact maths (realMaths) and the models' maths hold, and every voiced line of the page has a spoken text.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { FAMILIES, GENERATORS, MC, alignedShift, rng, type IrItem } from '../src/lesson/topics/irrational-numbers/items';
import { PLAN } from '../src/lesson/topics/irrational-numbers/plan';
import {
  PI, cmpDec, cmpReal, decStr, digits, exactAt, floorScaled, frac, fracToRep, isRational, longDivision, repToFrac, roundTo, sqrt, fromTyped,
} from '../src/lesson/topics/irrational-numbers/realMaths';
import { computeZoom } from '../src/lesson/topics/irrational-numbers/ZoomLine';
import { computeTape } from '../src/lesson/topics/irrational-numbers/DigitTape';
import { computeSets, innermost } from '../src/lesson/topics/irrational-numbers/RealSets';
import { LINES } from '../src/lesson/topics/irrational-numbers/script';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-26-the-number-system-rational-and-irrational-numbers.json';
const gen = (f: string, seed: number, sg?: string): IrItem => GENERATORS[f as keyof typeof GENERATORS](rng(seed), seed, sg);

/** the picture of an item must be drawable: the model's maths accepts it */
function checkPic(it: IrItem): void {
  const p = it.pic;
  if (!p) return;
  if (p.kind === 'zoom') computeZoom(p.p);
  if (p.kind === 'tape') computeTape(p.p);
  if (p.kind === 'sets') computeSets(p.p);
  if (p.kind === 'calc') { expect(p.p.display.length).toBeLessThanOrEqual(13); expect(p.p.more).toMatch(/^\d{0,6}$/); }
}

describe('plan', () => {
  it('walks through all 21 sub-goals in topic JSON order, and every family it names exists and is used', () => {
    const ids = fs.existsSync(TOPIC) ? (JSON.parse(fs.readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string }[] }).subgoals.map(s => s.id) : null;
    if (ids) expect(PLAN.map(p => p.id)).toEqual(ids);
    expect(PLAN.length).toBe(21);
    for (const p of PLAN) { expect(p.families.length).toBeGreaterThan(0); for (const f of p.families) expect(GENERATORS[f], f).toBeDefined(); }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(FAMILIES.map(f => f.id)));
  });
});

describe('every family x every sub-goal it serves x 300 seeds', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const it = gen(f, s * 7 + 1, p.id);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        if (it.input === 'choice') {
          const ch = it.choices!;
          expect(new Set(ch).size, `${it.prompt} ${ch.join(' | ')}`).toBe(ch.length);
          expect(ch.length).toBeGreaterThanOrEqual(3);
          expect(ch.filter((_, i) => it.check({ kind: 'choice', i }).ok).length, it.prompt).toBe(1);
        }
        if (it.input === 'pair') {
          // a typed answer as the kid would type it (floats from the input) passes too
          const a = it.answer as { x: number; y: number };
          expect(it.check({ kind: 'pair', x: Number(String(a.x)), y: Number(String(a.y)) }).ok).toBe(true);
        }
        expect(() => checkPic(it), it.prompt).not.toThrow();
        expect(it.solution.length).toBeGreaterThan(0);
        expect(it.prompt).not.toMatch(/undefined|NaN|\[object/);
        expect(it.solution.join(' ')).not.toMatch(/undefined|NaN|\[object/);
        expect(it.board).not.toMatch(/undefined|NaN/);
        for (const t of it.solveTex) expect(t).not.toMatch(/undefined|NaN/);
        // TeX that lost a backslash (a tab from "\t" in a template string, or a bare "sqrt")
        const texs = [it.board, ...it.solveTex, ...(it.pic?.kind === 'zoom' ? [it.pic.p.name] : []), ...(it.pic?.kind === 'sets' ? it.pic.p.tokens.map(t => t.tex) : [])];
        for (const t of texs) expect(t, t).not.toMatch(/\t|(^|[^\\a-z])(sqrt|tfrac|dfrac|ldots|approx|overline|pi)(?![a-z])/);
        seen.add(it.prompt + it.board);
      }
      // some sub-goals have few possible numbers by nature (a fixed list of statements, cases, fractions)
      const MIN: Record<string, number> = {
        'real-number-sets/setStatement': 6, 'decimals-repeat/barNotation': 18, 'real-number-sets/innermost': 15, 'exact-vs-approx/exactOrNot': 12, 'define-irrational/rOrI': 12,
        'form-vs-value/rOrI': 15, 'root-of-fraction/rOrI': 20, 'root-of-fraction/rootFraction': 20, 'define-rational/asQuotient': 18,
      };
      expect(seen.size, 'distinct items').toBeGreaterThanOrEqual(MIN[`${p.id}/${f}`] ?? 25);
    });
  }
});

describe('exact maths', () => {
  it('square roots: digits, bounds, exactness', () => {
    expect(digits(sqrt(2), 9)).toBe('1.414213562');
    expect(floorScaled(sqrt(2), 2)).toBe(141n);
    expect(floorScaled(sqrt(20, 1, -1), 0)).toBe(-5n);
    expect(floorScaled(sqrt(20, 1, -1), 1)).toBe(-45n);
    expect(floorScaled(sqrt(16, 1, -1), 0)).toBe(-4n);
    expect(exactAt(sqrt(16), 0)).toBe(true);
    expect(exactAt(sqrt(2), 5)).toBe(false);
    expect(cmpDec(sqrt(2), 1414n, 3)).toBe(1);
    expect(cmpDec(sqrt(2), 1415n, 3)).toBe(-1);
    for (let n = 2; n < 225; n++) {
      const k = floorScaled(sqrt(n), 2);
      expect(k * k <= BigInt(n) * 10000n && (k + 1n) * (k + 1n) > BigInt(n) * 10000n).toBe(true);
    }
  });
  it('rational or not, by value', () => {
    expect(isRational(sqrt(49))).toBe(true);
    expect(isRational(sqrt(8, 18))).toBe(true);          // 8/18 = 4/9
    expect(isRational(sqrt(2, 9))).toBe(false);
    expect(isRational(sqrt(9, 100))).toBe(true);
    expect(isRational(sqrt(4, 10))).toBe(false);         // 0.4 = 2/5
    expect(isRational(PI)).toBe(false);
    expect(innermost(sqrt(25, 1, -1))).toBe('integer');
    expect(innermost(frac(12, 4))).toBe('natural');
    expect(innermost(frac(0))).toBe('whole');
    expect(innermost(sqrt(10))).toBe('irrational');
  });
  it('rounding, comparing, typed decimals', () => {
    expect(roundTo(frac(2, 3), 1)).toBe(7n);
    expect(roundTo(sqrt(50), 0)).toBe(7n);
    expect(roundTo(sqrt(57), 0)).toBe(8n);
    expect(roundTo(sqrt(20, 1, -1), 0)).toBe(-4n);
    expect(roundTo(PI, 2)).toBe(314n);
    expect(cmpReal(PI, frac(22, 7))).toBe(-1);
    expect(cmpReal(PI, frac(314, 100))).toBe(1);
    expect(cmpReal(sqrt(5), frac(23, 10))).toBe(-1);
    expect(cmpReal(sqrt(16), frac(4))).toBe(0);
    expect(fromTyped(3.16)).toEqual([316n, 2]);
    expect(fromTyped(0.1 + 0.2)).toEqual([3n, 1]);
    expect(decStr(-45n, 1)).toBe('-4.5');
    expect(decStr(140n, 2, true)).toBe('1.4');
  });
  it('repeating decimals: shift and subtract = long division', () => {
    expect(repToFrac({ int: 0, pre: '', rep: '27' })).toEqual([3, 11]);
    expect(repToFrac({ int: 0, pre: '1', rep: '6' })).toEqual([1, 6]);
    expect(repToFrac({ int: 1, pre: '2', rep: '3' })).toEqual([37, 30]);
    expect(repToFrac({ int: 0, pre: '', rep: '9' })).toEqual([1, 1]);
    for (let q = 2; q <= 40; q++) for (let p = 1; p < q; p++) {
      const r = fracToRep(p, q);
      if (r.terminates) continue;
      const [a, b] = repToFrac(r);
      expect(a * q).toBe(p * b);
      const d = longDivision(p, q);
      expect(d.pre + d.period).toBeLessThanOrEqual(q);   // at most q - 1 nonzero remainders before one repeats
    }
  });
});

describe('the models', () => {
  it('ZoomLine: every band holds x and blows up the band above it; it throws when it cannot draw', () => {
    const m = computeZoom({ x: sqrt(2), name: '\\sqrt{2}', levels: 3, squares: true });
    expect(m.levels.map(l => l.band)).toEqual([1n, 14n, 141n]);
    expect(computeZoom({ x: frac(1, 8), name: '', levels: 3 }).levels.map(l => l.band)).toEqual([0n, 1n, 12n]);
    expect(computeZoom({ x: frac(1, 4), name: '', levels: 3 }).levels[2]!.on).toBe(25n);    // 0.25 sits on a tick
    expect(computeZoom({ x: sqrt(20, 1, -1), name: '', levels: 2 }).levels.map(l => l.band)).toEqual([-5n, -45n]);
    expect(() => computeZoom({ x: sqrt(300), name: '', levels: 1 })).toThrow();
    expect(() => computeZoom({ x: frac(1, 2), name: '', levels: 3 })).toThrow(/blow up/);   // 0.5 is a tick at tenths: no band to zoom into
    expect(() => computeZoom({ x: frac(2, 3), name: '', squares: true })).toThrow(/square roots/);
  });
  it('DigitTape: the tails agree exactly when the difference is whole', () => {
    expect(computeTape({ r: { int: 0, pre: '', rep: '27' }, s1: 2, s2: 0 }).diff).toEqual([27, 1]);
    expect(computeTape({ r: { int: 0, pre: '', rep: '27' }, s1: 1, s2: 0 }).aligned).toBe(false);
    expect(computeTape({ r: { int: 0, pre: '1', rep: '6' }, s1: 2, s2: 1 }).diff).toEqual([15, 1]);
    expect(computeTape({ r: { int: 0, pre: '1', rep: '6' }, s1: 1, s2: 0 }).aligned).toBe(false);
    for (const r of [{ int: 0, pre: '', rep: '4' }, { int: 2, pre: '', rep: '45' }, { int: 0, pre: '0', rep: '45' }, { int: 0, pre: '58', rep: '3' }])
      for (let s1 = 1; s1 <= 4; s1++) for (let s2 = 0; s2 < s1; s2++) expect(computeTape({ r, s1, s2 }).aligned, `${JSON.stringify(r)} ${s1} ${s2}`).toBe(alignedShift(r, s1, s2));
  });
  it('RealSets: the value decides the region', () => {
    const s = computeSets({ tokens: [{ tex: '\\sqrt{16}', x: sqrt(16) }, { tex: '0', x: frac(0) }, { tex: '-\\sqrt{25}', x: sqrt(25, 1, -1) }, { tex: '\\tfrac{2}{3}', x: frac(2, 3) }, { tex: '\\pi', x: PI }] });
    expect(s.where).toEqual(['natural', 'whole', 'integer', 'rational', 'irrational']);
  });
});

const mcsOf = (f: string, sg: string, n = 300) => {
  const seen = new Set<string>();
  for (let s = 1; s <= n; s++) { const it = gen(f, s, sg); if (it.input === 'choice') it.choices!.forEach((_, i) => { const m = it.check({ kind: 'choice', i }).mc; if (m) seen.add(m); }); }
  return seen;
};
describe('misconceptions are classified', () => {
  it('choice families carry the topic misconceptions', () => {
    const want: [string, string, string[]][] = [
      ['notRational', 'define-rational', [MC.fracDisplay, MC.notNested, MC.negSize]],
      ['remainders', 'decimals-repeat', [MC.remNoRepeat]],
      ['barNotation', 'decimals-repeat', [MC.barBlock]],
      ['prefixWhere', 'decimal-address', [MC.prefix, MC.discrete, MC.noExact]],
      ['rOrI', 'define-irrational', [MC.pattern, MC.repIrr]],
      ['displayRead', 'display-not-proof', [MC.truncFull, MC.fullDisplay]],
      ['rOrI', 'form-vs-value', [MC.radical, MC.pi314, MC.approxInherits]],
      ['innermost', 'real-number-sets', [MC.byNotation, MC.misplaced, MC.zeroCounting]],
      ['setStatement', 'real-number-sets', [MC.notNested, MC.zeroCounting, MC.misplaced]],
      ['rOrI', 'perfect-square-test', [MC.plusMinus, MC.radical, MC.negRoot]],
      ['rOrI', 'root-of-fraction', [MC.rootFirst, MC.unreduced]],
      ['whichShift', 'convert-repeating-pure', [MC.unaligned]],
      ['generalMethod', 'convert-repeating-delayed', [MC.oneExample]],
      ['interpolate', 'refine-bounds', [MC.interp, MC.closeTrial]],
      ['settles', 'round-from-bounds', [MC.truncates, MC.notSettled]],
      ['locate', 'locate-number-line', [MC.roundedExact, MC.noExact]],
      ['compare', 'order-reals', [MC.equalRounded, MC.radicandVsDec, MC.pi314, MC.negMagnitude]],
      ['order', 'order-reals', [MC.radicandVsDec]],
      ['exactOrNot', 'exact-vs-approx', [MC.allDecInexact, MC.roundedExact, MC.noExact]],
      ['howClose', 'error-from-bounds', [MC.calcCertifies, MC.decLength]],
      ['boundRound', 'bound-expressions', [MC.roundedInputs, MC.notSettled]],
      ['notEqual', 'bound-expressions', [MC.centers, MC.addsRadicands]],
      ['decide', 'choose-precision', [MC.visualExact, MC.earlyRound, MC.roundedExact]],
    ];
    for (const [f, sg, mcs] of want) { const seen = mcsOf(f, sg); for (const m of mcs) expect(seen.has(m), `${f}: ${m}`).toBe(true); }
  });
  it('typed answers: bounds, roots, conversions', () => {
    for (let s = 1; s <= 200; s++) {
      const b = gen('bracket', s, 'bracket-root'); const a = b.answer as { x: number; y: number };
      if (a.x >= 0) expect(b.check({ kind: 'pair', x: a.x * a.x, y: a.y * a.y }).mc).toBe(MC.squaresAsBounds);
      else expect(b.check({ kind: 'pair', x: a.y, y: a.x }).mc).toBe(MC.negMagnitude);
      const r = gen('roundRoot', s, 'round-from-bounds'), v = (r.answer as { v: number }).v;
      const t = r.check({ kind: 'num', v: Math.round((v - (String(v).includes('.') ? 10 ** -(String(v).split('.')[1]!.length) : 1)) * 1e6) / 1e6 });
      if (!t.ok && t.mc) expect(t.mc).toBe(MC.truncates);
    }
    // 0.272727... cut off is 27/100; 0.1666... by "digits over nines" is 16/99
    let cut = 0, nines = 0;
    for (let s = 1; s <= 300; s++) {
      const it = gen('toFraction', s, 'convert-repeating-pure');
      if (/0\.<span class="ov">(\d\d)<\/span>/.test(it.prompt)) { const d = RegExp.$1; if (it.check({ kind: 'frac', w: 0, n: Number(d), d: 100 }).mc === MC.asApprox) cut++; }
      const jt = gen('toFraction', s, 'convert-repeating-delayed');
      const m = /^Write <b class="a">0\.(\d)<span class="ov">(\d)<\/span><\/b>/.exec(jt.prompt);
      if (m) { if (jt.check({ kind: 'frac', w: 0, n: Number(m[1]! + m[2]!), d: 99 }).mc === MC.wrongDen) nines++; }
    }
    expect(cut).toBeGreaterThan(5);
    expect(nines).toBeGreaterThan(5);
    // a root of a fraction with the root taken of the top only
    expect(gen('rootFraction', 3).check({ kind: 'frac', w: 0, n: 1, d: 1 }).ok).toBe(false);
  });
});

describe('voice', () => {
  it('every line the page shows has a spoken text, and every spoken text is used', () => {
    const page = fs.readFileSync('pages/lessons/irrational-numbers.ts', 'utf8');
    const lines = JSON.parse(fs.readFileSync('pages/lessons/irrational-numbers/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]?.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[√<>π…]|\d\/\d|\d\.\d|<|&/);       // written to be read aloud
    }
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|p\.c\d|t\.cb-)/.test(id);
      if (!dyn) expect(page.includes(`'${id}'`), `${id} is never shown`).toBe(true);
    }
  });
});
