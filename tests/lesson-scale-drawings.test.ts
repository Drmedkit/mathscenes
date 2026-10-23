// scale drawings: every family x every sub-goal it serves x 300 seeds gives a valid item (the answer passes, choices
// unique with exactly one right, misconception ids exist, the picture can be drawn and keeps its labels), the main
// misconceptions are classified, the plan covers every sub-goal of the topic JSON in order, the voice lines match the
// panel lines, and the maths of a scale (legend, same-unit ratio, both directions, area factor) holds.
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { rng, type Response } from '../src/lesson/runtime/item';
import { GENERATORS, FAMILY_NAMES, MC, type ScaleItem } from '../src/lesson/topics/scale-drawings/items';
import { PLAN } from '../src/lesson/topics/scale-drawings/plan';
import { areaFactor, convert, legend, perUnit, polyArea, ratioN, ratioText, toActual, toDrawing, vTex, vText, wholeLegend } from '../src/lesson/topics/scale-drawings/scaleMaths';
import { PlanSheet } from '../src/lesson/topics/scale-drawings/PlanSheet';
import { SCRIPT } from '../src/lesson/topics/scale-drawings/script';
import { LESSON_PLANS } from '../src/lesson/topics/scale-drawings/lessonPics';
import { frame } from '../src/blocks/block';
import { qNum, rat } from '../src/core/math';
import { texReady } from '../src/core/tex';

const TOPIC = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/topics/secondary-t5-20-scale-drawings-and-geometric-constructions.json';
const MCF = 'C:/Users/stelt/Claude code foler/math-curriculum-essentials/misconceptions.json';
const mcIds = existsSync(MCF) ? new Set((JSON.parse(readFileSync(MCF, 'utf8')) as { misconceptions: { id: string }[] }).misconceptions.map(m => m.id)) : null;
const MF = frame(60, 70, 940, 940);

// canvas words measure text with a 2D context; in node they fall back to an estimate (0.52 em per character)
beforeAll(async () => {
  (globalThis as unknown as { document: unknown }).document = { createElement: () => ({ getContext: () => null }) };
  await texReady();
});

const pairs = PLAN.flatMap(p => p.families.map(f => [f, p.id] as const));
const make = (f: string, sg: string, s: number): ScaleItem => GENERATORS[f as keyof typeof GENERATORS](rng(s * 7919 + f.length), s, sg);
const num = (v: number): Response => ({ kind: 'num', v });
const valOf = (r: Response) => (r.kind === 'num' ? r.v : r.kind === 'frac' ? r.w + r.n / r.d : NaN);

describe('scale maths', () => {
  it('legend, same-unit ratio and both directions', () => {
    const L = legend(1, 'in', 4, 'ft');
    expect(qNum(perUnit(L))).toBe(4);
    expect(qNum(ratioN(L))).toBe(48);
    expect(ratioText(L)).toBe('1 : 48');
    expect(qNum(toActual(L, 3.5))).toBe(14);
    expect(qNum(toDrawing(L, 30))).toBe(7.5);
    expect(qNum(areaFactor(L))).toBe(16);
    const F = legend(0.25, 'in', 1, 'ft');
    expect(qNum(perUnit(F))).toBe(4);
    expect(qNum(ratioN(F))).toBe(48);
    expect(qNum(wholeLegend(F).a)).toBe(4);
    expect(qNum(toDrawing(F, 30))).toBe(7.5);
    expect(ratioText(legend(1, 'cm', 3, 'm'))).toBe('1 : 300');
    expect(ratioText(legend(1, 'in', 1, 'yd'))).toBe('1 : 36');
    expect(ratioText(legend(5, 'cm', 1, 'mm'))).toBe('50 : 1');
    expect(qNum(convert(216, 'in', 'ft'))).toBe(18);
    expect(qNum(polyArea([[0, 0], [3, 0], [3, 2], [0, 2]]))).toBe(6);
    expect(qNum(polyArea([[0, 0], [5, 0], [5, 1], [2, 1], [2, 4], [0, 4]]))).toBe(11);
    expect(vTex(rat(7, 2), false)).toBe('3\\tfrac{1}{2}');
    expect(vTex(rat(9, 2), true)).toBe('4.5');
    expect(vText(rat(15, 4), false)).toBe('3¾');
    expect(() => legend(1, 'in', 2, 'm')).toThrow();
  });
  it('the lesson pictures build (labels on, nothing on a line)', () => {
    for (const [name, p] of Object.entries(LESSON_PLANS)) expect(() => PlanSheet(p, MF), name).not.toThrow();
  });
});

describe('plan', () => {
  it('covers every sub-goal of the topic JSON, in order, each with a family that exists', () => {
    if (existsSync(TOPIC)) {
      const t = JSON.parse(readFileSync(TOPIC, 'utf8')) as { subgoals: { id: string; order: number }[] };
      expect(PLAN.map(p => p.id)).toEqual([...t.subgoals].sort((a, b) => a.order - b.order).map(s => s.id));
    }
    for (const p of PLAN) {
      expect(p.families.length).toBeGreaterThan(0);
      for (const f of p.families) { expect(GENERATORS[f as keyof typeof GENERATORS], f).toBeTypeOf('function'); expect(FAMILY_NAMES[f], f).toBeTruthy(); }
    }
    expect(new Set(PLAN.flatMap(p => p.families))).toEqual(new Set(Object.keys(GENERATORS)));
  });
  it('every misconception id used exists in the catalogue', () => {
    if (mcIds) for (const id of Object.values(MC)) expect(mcIds.has(id), id).toBe(true);
  });
});

describe('voice', () => {
  it('every panel line of parts 1-4 has a spoken text, and every spoken text a panel line', () => {
    const lines = JSON.parse(readFileSync('pages/lessons/scale-drawings/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(SCRIPT).sort());
    for (const [id, l] of Object.entries(lines)) { expect(l.text.length, id).toBeGreaterThan(10); expect(l.text, id).not.toMatch(/\d\/\d|°|%|[½¼¾⅛]|<|\$/); }
    const page = readFileSync('pages/lessons/scale-drawings.ts', 'utf8');
    for (const m of page.matchAll(/(?:say|fbk|ctx\.say)\((?:false, |true, |o\.ok, |ok, )?'([a-z.0-9]+)'/g)) expect(SCRIPT[m[1]!], m[1]).toBeTruthy();
  });
});

describe('item families', () => {
  for (const [f, sg] of pairs) {
    it(`${f} for ${sg}: 300 seeds, the answer passes, choices unique with one right, the picture draws`, () => {
      const seen = new Set<string>();
      let pics = 0, labelled = 0;
      for (let s = 1; s <= 300; s++) {
        const it = make(f, sg, s);
        expect(it.family).toBe(f);
        expect(it.check(it.answer).ok, `${it.prompt} ${JSON.stringify(it.answer)}`).toBe(true);
        expect(it.solution.length).toBeGreaterThan(0);
        for (const t of [it.prompt, it.board, it.work ?? '', ...it.solution, ...(it.choices ?? [])]) expect(t).not.toMatch(/undefined|NaN|Infinity|\t|\[object/);
        if (it.choices) {
          expect(new Set(it.choices).size, it.choices.join(' | ')).toBe(it.choices.length);
          const verdicts = it.choices.map((_, i) => it.check({ kind: 'choice', i }));
          expect(verdicts.filter(v => v.ok).length).toBe(1);
          if (mcIds) for (const v of verdicts) if (v.mc) expect(mcIds.has(v.mc), v.mc).toBe(true);
        } else {
          // a number answer: a wrong value is never classified as right
          expect(it.check(num(valOf(it.answer) + 0.37)).ok).toBe(false);
        }
        const p = it.picture;
        if (p) {
          pics++;
          try { PlanSheet(p.plan, MF); labelled++; } catch (e) {
            // the page falls back to the picture without side labels; that one must always build
            PlanSheet({ ...p.plan, figs: p.plan.figs.map(g => ({ ...g, labels: undefined, labels2: undefined, name: undefined })) }, MF);
            if (s < 4) console.log(f, String(e));
          }
        }
        seen.add(it.prompt + it.board + (it.choices ?? []).join() + JSON.stringify(it.picture ?? ''));
      }
      if (pics) expect(labelled / pics, `${labelled} of ${pics} pictures keep their labels`).toBeGreaterThanOrEqual(0.97);
      expect(seen.size).toBeGreaterThan(20);
    });
  }
});

describe('misconceptions are diagnosed', () => {
  const each = (f: string, sg: string, test: (it: ScaleItem) => void) => { for (let s = 1; s <= 300; s++) test(make(f, sg, s)); };
  const mcsOf = (f: string, sg: string) => {
    const m = new Set<string>();
    each(f, sg, it => it.choices?.forEach((_, i) => { const v = it.check({ kind: 'choice', i }); if (v.mc) m.add(v.mc); }));
    return m;
  };
  it('drawing to actual: dividing by the scale, adding, the drawing length as real', () => {
    let hit = 0;
    each('toActual', 'drawing-to-actual', it => {
      const m = /cssId\{d\}\{([\d.]+|\d*\\tfrac\{\d+\}\{\d+\})/.exec(it.board);
      const k = /\\times (\d+)/.exec(it.work ?? '');
      if (!m || !k || it.board.includes('?\\text{ m}') && it.prompt.includes(': ')) return;
      const ans = valOf(it.answer), K = +k[1]!, d = ans / K;
      if (it.prompt.includes('1 : ')) return;
      hit++;
      expect(it.check(num(d / K)).mc).toBe(MC.divRate);
      if (d !== ans) expect(it.check(num(d)).mc).toBe(MC.drawAsActual);
      if (d + K - 1 !== ans) expect(it.check(num(d + K - 1)).mc).toBe(MC.additive);
    });
    expect(hit).toBeGreaterThan(100);
  });
  it('a unit conversion left out', () => {
    let hit = 0;
    each('toActual', 'drawing-to-actual', it => {
      const m = /^(\d+)\\text\{ (in|cm)\} = /.exec(it.work ?? '');
      if (!m) return;
      hit++;
      expect(it.check(num(+m[1]!)).mc).toBe(MC.wrongUnit);
    });
    expect(hit).toBeGreaterThan(30);
  });
  it('actual to drawing: multiplying instead of dividing', () => {
    each('toDrawing', 'actual-to-drawing', it => {
      const m = /^([\d.]+) \\div (\d+)/.exec(it.work!)!;
      expect(it.check(num(+m[1]! * +m[2]!)).mc).toBe(MC.wrongOp);
    });
  });
  it('a fraction legend: multiplying by the fraction (or dividing by it)', () => {
    each('fracLegend', 'unit-fraction-legend', it => {
      const ans = valOf(it.answer);
      const den = +(/\\times (\d+) =/.exec(it.work!) ?? /tfrac\{1\}\{(\d+)\} =/.exec(it.work!))![1]!;
      if (it.unit === 'ft') expect(it.check(num(ans / den / den)).mc).toBe(MC.wrongOp);
      else expect(it.check(num(ans * den * den)).mc).toBe(MC.wrongOp);
    });
  });
  it('area: scaled by the length factor only', () => {
    each('area', 'area-from-drawing', it => {
      const k = /\\times (\d+)\^2/.exec(it.work!);
      const Ad = +/cssId\{d\}\{([\d.]+)/.exec(it.board)![1]!;
      if (k) expect(it.check(num(Ad * +k[1]!)).mc).toBe(MC.areaK);
      else expect(it.check(num(Ad / 2)).mc).toBe(MC.areaK);
      expect(it.check(num(Ad)).mc).toBe(MC.drawAsActual);
    });
  });
  it('the choice families carry their misconceptions', () => {
    const want: Record<string, [string, string[]]> = {
      copy: ['scale-copy-factor', [MC.additive, MC.sameName, MC.ratiosOnly]],
      legend: ['scale-legend', [MC.mixed, MC.reverse]],
      fracRewrite: ['unit-fraction-legend', [MC.wrongOp, MC.reverse, MC.mixed]],
      ruler: ['draw-computed-length', [MC.points, MC.rulerEnd]],
      makePlan: ['make-scale-drawing', [MC.someLengths, MC.wrongOp]],
      audit: ['check-scale-drawing', [MC.oneSide, MC.ratiosOnly]],
      fit: ['choose-scale', [MC.oneDim]],
      areaWhy: ['area-factor-justify', [MC.areaK, MC.examples]],
    };
    for (const [f, [sg, mcs]] of Object.entries(want)) { const got = mcsOf(f, sg); for (const m of mcs) expect(got.has(m), `${f}: ${m}`).toBe(true); }
  });
  it('number families: copy additive, angle scaled, legend unconverted, rescale through the drawing, cost from the plan', () => {
    let add = 0, ang = 0;
    each('copyLen', 'scale-copy-factor', it => {
      if (it.unit === '°') { ang++; const a = valOf(it.answer); expect(it.check(num(a * 2)).mc ?? it.check(num(a * 3)).mc ?? it.check(num(a / 2)).mc).toBe(MC.angles); return; }
      const m = /^(\d+) \\to ([\d.]+),\\quad (\d+)/.exec(it.board)!; const w = +m[1]!, W = +m[2]!, h = +m[3]!;
      if (h + W - w !== valOf(it.answer)) { add++; expect(it.check(num(h + W - w)).mc).toBe(MC.additive); }
    });
    expect(add).toBeGreaterThan(100); expect(ang).toBeGreaterThan(30);
    each('legendNum', 'scale-legend', it => {
      const a = +/cssId\{a\}\{([\d.]+)/.exec(it.board)![1]!, d = +/cssId\{d\}\{([\d.]+)/.exec(it.board)![1]!;
      if (a / d !== valOf(it.answer)) expect(it.check(num(a / d)).mc).toBe(MC.mixed);
    });
    each('rescale', 'rescale-drawing', it => {
      // work: "d x k1 = real, real / k2 = answer": the old drawing length read as a real one gives d / k2
      const m = /\\times (\d+) = ([\d.]+),\\ [\d.]+ \\div (\d+)/.exec(it.work!)!;
      const k1 = +m[1]!, real = +m[2]!, k2 = +m[3]!, d = real / k1;
      if (d / k2 !== valOf(it.answer)) expect(it.check(num(d / k2)).mc).toBe(MC.drawAsActual);
      if (real !== valOf(it.answer)) expect(it.check(num(real)).mc).toBe(MC.wrongUnit);
    });
    let fence = 0, floor = 0;
    each('cost', 'scale-context-application', it => {
      const ans = valOf(it.answer);
      if (it.prompt.includes('fence')) {
        fence++;
        const per = +/ ([\d.]+)\\text\{ ft\}/.exec(it.work!)![1]!, price = ans / per;
        const L = it.picture!.plan.figs[0]!, w = L.pts[1]![0], h = L.pts[2]![1];
        expect(it.check(num(2 * (w + h) * price)).mc).toBe(MC.drawAsActual);
      } else {
        floor++;
        const Ar = +/ ([\d.]+)\\text\{ sq/.exec(it.work!)![1]!, price = ans / Ar;
        const L = it.picture!.plan.figs[0]!, w = L.pts[1]![0], h = L.pts[2]![1], kk = Math.sqrt(Ar / (w * h));
        expect(it.check(num(w * h * kk * price)).mc, `${it.prompt} ${it.work} ${w} ${h} ${kk}`).toBe(MC.areaK);
        expect(it.check(num(w * h * price)).mc).toBe(MC.drawAsActual);
      }
    });
    expect(fence).toBeGreaterThan(40); expect(floor).toBeGreaterThan(40);
  });
});

describe('scale-drawings: oracle findings (phase 2)', () => {
  it('every side of an audited plan is drawn at its labelled length (the slanted plan too: only its corners are wrong)', () => {
    const G = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => ScaleItem>;
    let slants = 0;
    for (let s = 1; s <= 400; s++) {
      const it = G.audit!(rng(s * 7 + 1), s, 'check-scale-drawing');
      const fig = (it.picture as unknown as { plan: { figs: { pts: [number, number][]; labels: (string | null)[] }[] } }).plan.figs[0]!;
      fig.labels.forEach((lab, i) => {
        if (!lab) return;
        const a = fig.pts[i]!, b = fig.pts[(i + 1) % fig.pts.length]!;
        const m = /^(\d*)(?:\\tfrac\{(\d+)\}\{(\d+)\})?/.exec(lab)!;
        const want = Number(m[1] || 0) + (m[2] ? Number(m[2]) / Number(m[3]) : 0);
        expect(Math.hypot(b[0] - a[0], b[1] - a[1]), `${lab} ${JSON.stringify(fig.pts)}`).toBeCloseTo(want, 6);
      });
      if (fig.pts[0]![0] !== 0) slants++;
    }
    expect(slants).toBeGreaterThan(50);
  });
});
