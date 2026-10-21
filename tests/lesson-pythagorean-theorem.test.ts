// lesson-pythagorean-theorem: the generic checks (every family x every sub-goal it serves x 300 seeds). Add topic checks below.
import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { rng } from '../src/lesson/runtime/item';
import { GENERATORS } from '../src/lesson/topics/pythagorean-theorem/items';
import { PLAN } from '../src/lesson/topics/pythagorean-theorem/plan';

const TOPIC = JSON.parse(fs.readFileSync('../math-curriculum-essentials/topics/secondary-t5-38-pythagorean-theorem.json', 'utf8'));
const CATALOG = new Set<string>(JSON.parse(fs.readFileSync('../math-curriculum-essentials/misconceptions.json', 'utf8')).misconceptions.map((m: { id: string }) => m.id));
const GEN = GENERATORS as Record<string, (R: () => number, n: number, sg?: string) => import('../src/lesson/runtime/item').Item>;

describe('pythagorean-theorem: plan', () => {
  it('walks through every sub-goal of the topic JSON, in order, each with a family', () => {
    expect(PLAN.map(p => p.id)).toEqual(TOPIC.subgoals.map((s: { id: string }) => s.id));
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThan(0); for (const f of p.families) expect(GEN[f], f).toBeDefined(); }
  });
});

describe('pythagorean-theorem: families', () => {
  for (const p of PLAN) for (const f of p.families) {
    it(`${p.id} / ${f}: 300 seeds`, () => {
      const seen = new Set<string>();
      for (let s = 1; s <= 300; s++) {
        const item = GEN[f]!(rng(s * 31 + 7), s, p.id);
        expect(item.check(item.answer).ok, `${item.prompt} ${JSON.stringify(item.answer)}`).toBe(true);
        if (item.choices) {
          expect(new Set(item.choices).size, item.prompt).toBe(item.choices.length);
          expect(item.choices.filter((_, i) => item.check({ kind: 'choice', i }).ok).length, item.prompt).toBe(1);
          item.choices.forEach((_, i) => { const mc = item.check({ kind: 'choice', i }).mc; if (mc) expect(CATALOG.has(mc), mc).toBe(true); });
        }
        seen.add(item.prompt + '|' + item.board);
      }
      expect(seen.size, 'distinct items').toBeGreaterThan(12);
    });
  }
});

// ===================== topic checks =====================
import { tex, texReady, texWidth } from '../src/core/tex';
import { FAMILIES, MC, type PtItem } from '../src/lesson/topics/pythagorean-theorem/items';
import { buildPic, picError } from '../src/lesson/topics/pythagorean-theorem/pictures';
import {
  MIDWAY_BOXES, WHOLE_BOXES, baseDiag2, converseFigure, dist2, kind3, moveAt, roundMid, round1, spaceDiag2, sssPts, trunc1, wholeCellsInside,
} from '../src/lesson/topics/pythagorean-theorem/theoremMaths';
import { LINES } from '../src/lesson/topics/pythagorean-theorem/script';

beforeAll(async () => { await texReady(); });
const items = (f: string, sg: string, n = 120): PtItem[] => Array.from({ length: n }, (_, s) => GEN[f]!(rng(s * 13 + 5), s, sg) as PtItem);
const ALL = (n = 60): PtItem[] => PLAN.flatMap(p => p.families.flatMap(f => items(f, p.id, n)));
/** every string an item carries (prompt, board, choices, solution, steps, picture labels), recursively */
function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(y => strings(y, out));
  else if (x && typeof x === 'object') Object.values(x as Record<string, unknown>).forEach(y => strings(y, out));
  return out;
}

describe('pythagorean-theorem: strings and TeX', () => {
  it('no control characters (a tab from an unescaped "\\times" in a template string) in any board, label, choice or solution', () => {
    for (const it of ALL(80)) {
      const all = strings({ p: it.prompt, b: it.board, c: it.choices, s: it.solution, st: it.steps, pic: it.picture, u: it.unit, pl: it.pairLead, po: it.pairOp, pt: it.pairTail });
      for (const s of all) expect(s, `${it.family}: ${JSON.stringify(s)}`).not.toMatch(/[\u0000-\u001f\u007f]/);
    }
    // the spoken and panel lines of parts 1-4 too
    for (const [id, l] of Object.entries(LINES)) for (const s of [l.html, l.say]) expect(s, id).not.toMatch(/[\u0000-\u001f\u007f]/);
  });
  it('no undefined / NaN / Infinity / double signs in any text', () => {
    for (const it of ALL(80)) {
      const text = [it.prompt, it.board, ...(it.choices ?? []), ...it.solution, ...(it.steps ?? [])].join(' ');
      expect(text, `${it.family}: ${text}`).not.toMatch(/undefined|NaN|Infinity|\+ -|- -|\+ −|null/);
    }
  });
  it('every board line and worked step is valid TeX', () => {
    for (const it of ALL(40)) {
      for (const s of [it.board, ...(it.steps ?? [])]) expect(() => tex(s), `${it.family}: ${s}`).not.toThrow();
    }
  });
  it('every board line and worked step fits the wide notation slate at 60 px (numbers never smaller)', () => {
    const bad = new Set<string>();
    for (const it of ALL(40)) for (const s of [it.board, ...(it.steps ?? [])]) if (texWidth(tex(s), 60) > 910 - 108) bad.add(`${it.family}: ${s} @${Math.round(texWidth(tex(s), 60))}`);
    const fams = new Map<string, string>(); for (const b of bad) { const f = b.split(':')[0]!; if (!fams.has(f) || Number(b.split('@')[1]) > Number(fams.get(f)!.split('@')[1])) fams.set(f, b); }
    expect([...fams.values()]).toEqual([]);
  });
  it('every family is in the plan, every sub-goal has 2-3 families, the topic lands near 35-40 families', () => {
    const used = new Set(PLAN.flatMap(p => p.families));
    for (const f of FAMILIES) expect(used.has(f.id), f.id).toBe(true);
    expect(FAMILIES.length).toBeGreaterThanOrEqual(30);
    expect(FAMILIES.length).toBeLessThanOrEqual(42);
    for (const p of PLAN) { expect(p.families.length, p.id).toBeGreaterThanOrEqual(2); expect(p.families.length, p.id).toBeLessThanOrEqual(3); }
  });
  it('every misconception id in the MC table is in the catalog', () => {
    for (const id of Object.values(MC)) expect(CATALOG.has(id), id).toBe(true);
  });
});

describe('pythagorean-theorem: pictures', () => {
  it('almost every item has a picture, and the picture builds in the model frame', () => {
    let all = 0, pics = 0;
    const bad: string[] = [];
    for (const it of ALL(30)) {
      all++;
      const pic = it.picture?.pic;
      if (!pic) continue;
      pics++;
      const err = picError(pic);
      if (err) bad.push(`${it.family}: ${err}`);
    }
    expect(bad.slice(0, 12), [...new Set(bad)].join('\n')).toEqual([]);
    expect(pics / all).toBeGreaterThan(0.95);
  });
  it('triangle pictures keep their squares when the item has them (most of the time)', () => {
    let n = 0, sq = 0;
    for (const f of ['hyp', 'leg', 'missingSq']) for (const it of items(f, 'find-hypotenuse', 60)) {
      const b = buildPic(it.picture?.pic);
      if (b?.kind === 'tri') { n++; if (b.squares) sq++; }
    }
    expect(sq / n).toBeGreaterThan(0.6);
  });
});

describe('pythagorean-theorem: maths', () => {
  it('kind3 decides right / acute / obtuse from the squares, exactly, also for decimals', () => {
    expect(kind3([5, 13, 12])).toBe('right');
    expect(kind3([0.6, 1, 0.8])).toBe('right');
    expect(kind3([4, 5, 6])).toBe('acute');
    expect(kind3([6, 8, 11])).toBe('obtuse');
    expect(kind3([20, 21, 29])).toBe('right');
  });
  it('sssPts draws a triangle true to its three lengths, the longest across from R', () => {
    for (const s of [[3, 4, 5], [4, 5, 6], [6, 8, 11], [7, 24, 25]] as [number, number, number][]) {
      const [R, A, B] = sssPts(s);
      const d = (p: number[], q: number[]) => Math.hypot(q[0]! - p[0]!, q[1]! - p[1]!);
      expect([d(R, A), d(R, B), d(A, B)].map(x => Math.round(x * 1e6) / 1e6)).toEqual([...s].sort((x, y) => x - y));
    }
  });
  it('the converse figure: the motion carries the constructed triangle exactly onto the given one', () => {
    const f = converseFigure(5, 12, 0.36, [0.6, -7.6]);
    const r9 = (p: readonly number[]) => p.map(v => Math.round(v * 1e9) / 1e9);
    const at1 = (p: [number, number]) => r9(moveAt(p, f.Z, f.rot, f.dx, f.dy, 1));
    expect(at1(f.Z)).toEqual(r9(f.R));
    expect(at1(f.X)).toEqual(r9(f.P));
    expect(at1(f.Y)).toEqual(r9(f.Q));
    expect(Math.round(Math.hypot(f.P[0] - f.Q[0], f.P[1] - f.Q[1]) * 1e9) / 1e9).toBe(13);
  });
  it('distance: the squared distance is run² + rise², across the axes too', () => {
    expect(dist2([3, 4], [9, 12])).toBe(100);
    expect(dist2([-3, 2], [5, -4])).toBe(100);
  });
  it('boxes: base and space diagonals; the whole-diagonal boxes are right; rounding mid-way really changes the tenth', () => {
    expect(baseDiag2(3, 4)).toBe(25);
    expect(spaceDiag2(3, 4, 12)).toBe(169);
    for (const [l, w, h, d] of WHOLE_BOXES) expect(l * l + w * w + h * h).toBe(d * d);
    expect(MIDWAY_BOXES.length).toBeGreaterThan(12);
    for (const [l, w, h] of MIDWAY_BOXES) expect(roundMid(l, w, h)).not.toBe(round1(Math.sqrt(l * l + w * w + h * h)));
  });
  it('tilted squares: whole grid cells inside leave out the cut ones', () => {
    expect(wholeCellsInside(1, 2)).toBe(1);
    expect(wholeCellsInside(3, 4)).toBeLessThan(25);
    expect(trunc1(7.0710678)).toBe(7);
  });
});

describe('pythagorean-theorem: misconception probes', () => {
  const num = (it: PtItem, v: number) => it.check({ kind: 'num', v });
  const lab = (s: string) => Number(s.replace(/\\text.*/, ''));
  it('hypotenuse: adding the legs, stopping at c²', () => {
    for (const it of items('hyp', 'find-hypotenuse', 60)) {
      const L = (it.picture!.pic as { labels: Record<string, string> }).labels;
      const a = lab(L.a!), b = lab(L.b!);
      expect(num(it, a + b).mc).toBe(MC.addLengths);
      expect(num(it, a * a + b * b).mc).toBe(MC.rSquared);
    }
  });
  it('leg: adding the squares is the missing-leg slip', () => {
    for (const it of items('leg', 'find-leg', 60)) {
      const L = (it.picture!.pic as { labels: Record<string, string> }).labels;
      const k = lab(L.a!), c = lab(L.c!);
      expect(num(it, Math.round(Math.sqrt(k * k + c * c) * 100) / 100).mc).toBe(MC.legAdds);
    }
  });
  it("distance: B's coordinates as legs are diagnosed", () => {
    let seen = 0;
    for (const it of items('distLegs', 'coordinate-distance', 80)) {
      const pic = it.picture!.pic as { A: [number, number]; B: [number, number] };
      const v = it.check({ kind: 'pair', x: Math.abs(pic.B[0]), y: Math.abs(pic.B[1]) });
      if (v.mc) { expect(v.mc).toBe(MC.coordLen); seen++; }
    }
    expect(seen).toBeGreaterThan(40);
  });
  it('converse: the longest side listed first, tested as if last, is the last-listed slip', () => {
    let seen = 0;
    for (const it of items('isRight', 'converse-test', 200)) {
      const yes = it.choices!.findIndex(c => c.startsWith('Yes')), no = it.choices!.findIndex(c => c.startsWith('No'));
      if (it.check({ kind: 'choice', i: yes }).ok) { const v = it.check({ kind: 'choice', i: no }); if (v.mc) { expect(v.mc).toBe(MC.lastListed); seen++; } }
    }
    expect(seen).toBeGreaterThan(10);
  });
  it('space diagonal: the floor diagonal is the face-diagonal slip', () => {
    for (const it of items('spaceDiag', 'chain-3d', 60)) {
      const B2 = Number(it.steps![0]!.split('= ').pop());
      expect(num(it, Math.round(Math.sqrt(B2) * 100) / 100).mc).toBe(MC.faceDiag);
    }
  });
  it('rounding: cutting off is truncation; rounding the floor diagonal first is premature rounding', () => {
    for (const it of items('tenthRt', 'approximate-root', 80)) {
      const v = Number(it.prompt.match(/= ([\d.]+)…/)![1]);
      if (trunc1(v) !== round1(v)) expect(num(it, trunc1(v)).mc).toBe(MC.trunc);
    }
    for (const it of items('keepExact', 'chain-3d', 60)) {
      const [l, w, h] = it.prompt.match(/\d+/g)!.slice(0, 3).map(Number) as [number, number, number];
      expect(num(it, roundMid(l, w, h)).mc).toBe(MC.midRound);
    }
  });
  it('situations: making the ladder a leg is the role swap', () => {
    let seen = 0;
    for (const it of items('story', 'model-2d-context', 200)) {
      const m = it.board.match(/^([\d.]+)\^2 \+ h\^2 = ([\d.]+)\^2$/);
      if (!m || !/ladder/.test(it.prompt)) continue;
      const f = Number(m[1]), c = Number(m[2]);
      expect(num(it, Math.round(Math.sqrt(c * c + f * f) * 100) / 100).mc).toBe(MC.roleSwap);
      seen++;
    }
    expect(seen).toBeGreaterThan(10);
  });
});

describe('pythagorean-theorem: voice', () => {
  it('lines.json holds the spoken text of every script line, written to be read aloud', () => {
    const lines = JSON.parse(fs.readFileSync('pages/lessons/pythagorean-theorem/voice/lines.json', 'utf8')) as Record<string, { text: string }>;
    expect(Object.keys(lines).sort()).toEqual(Object.keys(LINES).sort());
    for (const [id, l] of Object.entries(LINES)) {
      expect(lines[id]?.text, id).toBe(l.say);
      expect(l.say, id).not.toMatch(/[0-9√²<>=+×−]/);
    }
  });
  it('every voiced id the page uses exists, and every line is used', () => {
    const page = fs.readFileSync('pages/lessons/pythagorean-theorem.ts', 'utf8');
    const named = new Set([...page.matchAll(/['`]([qetp]\.[a-z0-9-]+)['`]/g)].map(m => m[1]!));
    for (const id of named) expect(LINES[id], id).toBeDefined();
    for (const id of Object.keys(LINES)) {
      const dyn = /^(e\.s\d|p\.c\d|t\.cb-|p\.no-)/.test(id);
      if (!dyn) expect(page.includes(`'${id}'`), `${id} is never shown`).toBe(true);
    }
  });
});
