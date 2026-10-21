// pictures.ts: the pictures of this topic as plain data (Pic), and pure builders that turn them into Construction
// drawings inside a frame. Items carry a Pic; the page draws it; the tests build every Pic in node, so a practice item
// that the model cannot draw readably is never generated.
import type { Paint } from '../../../core/theme';
import { type Frame, frame, tryBlock } from '../../../blocks/block';
import { type Box, box } from '../../../core/math';
import { Construction, type ConstructionBlock, type Drawing, type Mark, Sticks, type SticksBlock } from './Construction';
import { type P2, type Unit, circleMeet, existsSSS, len, solveASA, solveSAS, solveSSS } from './triangleMaths';

export type V = 'A' | 'B' | 'C';
export type Side = 'AB' | 'AC' | 'BC';
/** one labelled triangle (a sketch or a drawing) */
export interface TriPic {
  unit: Unit;
  A: P2; B: P2; C: P2;
  /** the letters shown for A, B, C */
  names: [string, string, string];
  sides?: Partial<Record<Side, { text: string; role?: Paint }>>;
  angles?: Partial<Record<V, { text: string; role?: Paint }>>;
  right?: V;
  ticks?: Partial<Record<Side, number>>;
  rot?: number; mirror?: boolean; freehand?: boolean;
  /** extra rays (ASA sketches): from a vertex at a figure angle, with an angle mark against a reference point */
  rays?: { from: V; deg: number; len: number; mark?: { ref: P2; text: string } }[];
  /** draw the third corner and the sides to it (default true) */
  closed?: boolean;
  size?: number;
  /** a fixed scale (px per unit), so two drawings show their true sizes */
  scale?: number;
}
export type ConstructSpec =
  | { kind: 'sss'; unit: Unit; AB: number; AC: number; BC: number; names: [string, string, string]; rot?: number; cands?: [string, string, string] }
  | { kind: 'sas'; unit: Unit; AB: number; AC: number; angA: number; names: [string, string, string]; rot?: number }
  | { kind: 'asa'; unit: Unit; AB: number; angA: number; angB: number; names: [string, string, string]; rot?: number; cands?: [string, string, string] };
export type Pic =
  | { kind: 'tri'; t: TriPic }
  | { kind: 'tris'; ts: TriPic[] }
  | { kind: 'construct'; c: ConstructSpec; upto?: ConstructStep }
  | { kind: 'ruler'; unit: Unit; deg: number; inset: number; len: number; seg?: [number | 'edge', number]; start?: number; names: [string, string] }
  | { kind: 'protractor'; x: number; bRight: boolean; dots: { name: string; deg: number }[]; names: [string, string] }
  | { kind: 'compassRuler'; unit: Unit; s: number; e: number; len: number }
  | { kind: 'copy'; unit: Unit; L: number; names: [string, string, string]; rayDeg: number; segDeg: number }
  | { kind: 'sticks'; unit: Unit; lens: number[]; texts?: string[] };

export const CONSTRUCT_STEPS = ['base', 'ruler', 'rulerOff', 'tool1', 'one', 'tool1Off', 'tool2', 'two', 'tool2Off', 'C', 'sides'] as const;
export type ConstructStep = (typeof CONSTRUCT_STEPS)[number];

// ---------- triangles ----------
const SIDES: Side[] = ['AB', 'AC', 'BC'];
const OTHER: Record<Side, V> = { AB: 'C', AC: 'B', BC: 'A' };
export function triDrawing(t: TriPic, step = 'all'): Drawing {
  const pts: Record<string, P2> = { A: t.A, B: t.B, C: t.C };
  const marks: Mark[] = [];
  const closed = t.closed !== false;
  const size = t.size;
  for (const sd of SIDES) {
    if (!closed && sd !== 'AB') continue;
    const L = t.sides?.[sd];
    marks.push({ kind: 'seg', id: sd, a: sd[0]!, b: sd[1]!, role: L?.role ?? (t.freehand ? 'ink' : 'first'), step, w: t.freehand ? 4 : 5, away: OTHER[sd], ticks: t.ticks?.[sd], label: L ? { text: L.text, role: L.role ?? 'first', size } : undefined });
  }
  const nb: Record<V, [V, V]> = { A: ['B', 'C'], B: ['A', 'C'], C: ['A', 'B'] };
  for (const v of ['A', 'B', 'C'] as V[]) {
    if (!closed && v === 'C') continue;
    const L = t.angles?.[v];
    if (t.right === v) marks.push({ kind: 'angle', id: 'ang' + v, at: v, p: nb[v][0], q: nb[v][1], right: true, role: 'second', step });
    if (L) marks.push({ kind: 'angle', id: 'ang' + v, at: v, p: nb[v][0], q: nb[v][1], role: L.role ?? 'second', step, label: { text: L.text, role: L.role ?? 'second', size } });
  }
  (t.rays ?? []).forEach((r, i) => {
    marks.push({ kind: 'ray', id: 'ray' + i, from: r.from, deg: r.deg, len: r.len, role: 'second', step });
    if (r.mark) {
      const end: P2 = [pts[r.from]![0] + Math.cos((r.deg * Math.PI) / 180) * r.len, pts[r.from]![1] + Math.sin((r.deg * Math.PI) / 180) * r.len];
      pts['r' + i] = end; pts['m' + i] = r.mark.ref;
      // a reference direction that is not along the base is drawn as a dashed guide (the line the angle is measured from)
      const other = r.from === 'A' ? t.B : t.A, from = pts[r.from]!;
      const onBase = Math.abs(Math.hypot(r.mark.ref[0] - from[0], r.mark.ref[1] - from[1]) + Math.hypot(other[0] - r.mark.ref[0], other[1] - r.mark.ref[1]) - Math.hypot(other[0] - from[0], other[1] - from[1])) < 1e-6;
      if (!onBase) marks.push({ kind: 'seg', id: 'guide' + i, a: r.from, b: r.mark.ref, role: 'dim', step, w: 3, dash: true });
      marks.push({ kind: 'angle', id: 'rayAng' + i, at: r.from, p: 'r' + i, q: 'm' + i, role: 'second', step, label: { text: r.mark.text, role: 'second', size } });
    }
  });
  (['A', 'B', 'C'] as V[]).forEach((v, i) => { if (closed || v !== 'C') marks.push({ kind: 'vertex', id: 'v' + v, at: v, name: t.names[i]!, role: 'ink', step, dot: !t.freehand, size: size ? Math.max(44, size) : undefined }); });
  return { unit: t.unit, pts, marks, rot: t.rot, mirror: t.mirror, freehand: t.freehand, scale: t.scale };
}

// ---------- constructions ----------
/** a construction, step by step: base (with the ruler), the first and second condition (arcs or rays with their
 *  instrument), the found corner C, the sides to C. Named steps are CONSTRUCT_STEPS. */
export function constructDrawing(cs: ConstructSpec): Drawing {
  const [nA, nB, nC] = cs.names, u = cs.unit;
  const marks: Mark[] = [];
  const AB = cs.AB;
  const pts: Record<string, P2> = { A: [0, 0], B: [AB, 0] };
  let C: P2 | null = null;
  marks.push({ kind: 'ruler', id: 'ruler', at: 'A', deg: 0, start: 0, len: Math.ceil(AB + 0.4), inset: u === 'in' ? 0.2 : 0.5, step: 'ruler', hide: 'rulerOff' });
  marks.push({ kind: 'seg', id: 'AB', a: 'A', b: 'B', role: 'first', step: 'base', w: 5, away: [AB / 2, 5], label: { text: `${len(AB, u)} ${u}`, role: 'first', step: 'rulerOff' } });
  if (cs.kind === 'sss') {
    const meet = circleMeet([0, 0], cs.AC, [AB, 0], cs.BC);
    const e = existsSSS(AB, cs.AC, cs.BC);
    if (e === 'yes') { const t = solveSSS(AB, cs.AC, cs.BC); C = t.C; }
    // arcs: centred on the crossing (or on the base direction when the arcs miss)
    const target = meet[0] ?? [cs.AC <= AB ? cs.AC : AB, 0];
    const aA = (Math.atan2(target[1], target[0]) * 180) / Math.PI, aB = (Math.atan2(target[1], target[0] - AB) * 180) / Math.PI;
    const wide = cs.cands ? 1.7 : 1;   // with candidate points the arcs run longer, so a point on one arc only is visibly on it
    const spanA = Math.min(80, wide * (Math.max(0.9, AB * 0.32) / cs.AC) * 180 / Math.PI), spanB = Math.min(80, wide * (Math.max(0.9, AB * 0.32) / cs.BC) * 180 / Math.PI);
    const a0 = e === 'yes' ? aA - spanA / 2 : -spanA / 2, a1 = e === 'yes' ? aA + spanA / 2 : spanA / 2;
    const b0 = e === 'yes' ? aB - spanB / 2 : 180 - spanB / 2, b1 = e === 'yes' ? aB + spanB / 2 : 180 + spanB / 2;
    marks.push({ kind: 'compass', id: 'comp1', c: 'A', r: cs.AC, from: a0, to: a1, sweep: 'one', step: 'tool1', hide: 'tool1Off' });
    marks.push({ kind: 'arc', id: 'arcA', c: 'A', r: cs.AC, from: a0, to: a1, role: 'first', step: 'one', w: 4 });
    marks.push({ kind: 'compass', id: 'comp2', c: 'B', r: cs.BC, from: b1, to: b0, sweep: 'two', step: 'tool2', hide: 'tool2Off' });
    marks.push({ kind: 'arc', id: 'arcB', c: 'B', r: cs.BC, from: b1, to: b0, role: 'first', step: 'two', w: 4 });
    if (cs.cands && C) {
      // P = the crossing, Q on arc A only, R on arc B only (letters shuffled by the caller)
      const qa = ((aA + spanA * 0.4) * Math.PI) / 180, rb = ((aB - spanB * 0.4) * Math.PI) / 180;
      pts.P = C; pts.Q = [cs.AC * Math.cos(qa), cs.AC * Math.sin(qa)]; pts.R = [AB + cs.BC * Math.cos(rb), cs.BC * Math.sin(rb)];
      marks.push({ kind: 'cand', id: 'candP', at: 'P', name: cs.cands[0], role: 'pick', step: 'C' });
      marks.push({ kind: 'cand', id: 'candQ', at: 'Q', name: cs.cands[1], role: 'pick', step: 'C' });
      marks.push({ kind: 'cand', id: 'candR', at: 'R', name: cs.cands[2], role: 'pick', step: 'C' });
    }
    if (C) {
      pts.C = C;
      marks.push({ kind: 'seg', id: 'AC', a: 'A', b: 'C', role: 'first', step: 'sides', w: 5, away: 'B', label: { text: `${len(cs.AC, u)} ${u}`, role: 'first' } });
      marks.push({ kind: 'seg', id: 'BC', a: 'B', b: 'C', role: 'first', step: 'sides', w: 5, away: 'A', label: { text: `${len(cs.BC, u)} ${u}`, role: 'first' } });
      if (!cs.cands) marks.push({ kind: 'vertex', id: 'vC', at: 'C', name: nC, role: 'link', step: 'C', away: [AB / 2, 0] });
    }
  } else if (cs.kind === 'sas') {
    const t = solveSAS(AB, cs.AC, cs.angA); C = t.C; pts.C = C;
    pts.R = [Math.cos((cs.angA * Math.PI) / 180) * (cs.AC + 0.9), Math.sin((cs.angA * Math.PI) / 180) * (cs.AC + 0.9)];
    marks.push({ kind: 'protractor', id: 'prot1', at: 'A', deg: 0, step: 'tool1', hide: 'tool1Off' });
    marks.push({ kind: 'ray', id: 'rayA', from: 'A', deg: cs.angA, len: cs.AC + 0.9, role: 'second', step: 'one', w: 3 });
    marks.push({ kind: 'angle', id: 'angA', at: 'A', p: 'B', q: 'R', role: 'second', step: 'one', label: { text: `${cs.angA}°`, role: 'second', step: 'tool1Off' } });
    marks.push({ kind: 'ruler', id: 'ruler2', at: 'A', deg: cs.angA, start: 0, len: Math.ceil(cs.AC + 0.4), inset: u === 'in' ? 0.2 : 0.5, step: 'tool2', hide: 'tool2Off', side: -1 });
    marks.push({ kind: 'seg', id: 'AC', a: 'A', b: 'C', role: 'first', step: 'two', w: 5, away: 'B', label: { text: `${len(cs.AC, u)} ${u}`, role: 'first', step: 'tool2Off' } });
    marks.push({ kind: 'seg', id: 'BC', a: 'B', b: 'C', role: 'link', step: 'sides', w: 5, away: 'A' });
    marks.push({ kind: 'vertex', id: 'vC', at: 'C', name: nC, role: 'link', step: 'two', away: [AB / 2, 0] });
  } else {
    const t = solveASA(AB, cs.angA, cs.angB); C = t.C;
    const LA = t.AC + 1.0, LB = t.BC + 1.0;
    pts.RA = [Math.cos((cs.angA * Math.PI) / 180) * LA, Math.sin((cs.angA * Math.PI) / 180) * LA];
    pts.RB = [AB + Math.cos(((180 - cs.angB) * Math.PI) / 180) * LB, Math.sin(((180 - cs.angB) * Math.PI) / 180) * LB];
    marks.push({ kind: 'protractor', id: 'prot1', at: 'A', deg: 0, step: 'tool1', hide: 'tool1Off' });
    marks.push({ kind: 'ray', id: 'rayA', from: 'A', deg: cs.angA, len: LA, role: 'second', step: 'one', w: 3 });
    marks.push({ kind: 'angle', id: 'angA', at: 'A', p: 'B', q: 'RA', role: 'second', step: 'one', label: { text: `${cs.angA}°`, role: 'second', step: 'tool1Off' } });
    marks.push({ kind: 'protractor', id: 'prot2', at: 'B', deg: 0, step: 'tool2', hide: 'tool2Off' });
    marks.push({ kind: 'ray', id: 'rayB', from: 'B', deg: 180 - cs.angB, len: LB, role: 'second', step: 'two', w: 3 });
    marks.push({ kind: 'angle', id: 'angB', at: 'B', p: 'A', q: 'RB', role: 'second', step: 'two', label: { text: `${cs.angB}°`, role: 'second', step: 'tool2Off' } });
    if (cs.cands) {
      const qa = (cs.angA * Math.PI) / 180, rb = ((180 - cs.angB) * Math.PI) / 180;
      pts.P = C; pts.Q = [Math.cos(qa) * (t.AC * 0.62), Math.sin(qa) * (t.AC * 0.62)]; pts.R = [AB + Math.cos(rb) * (t.BC * 0.62), Math.sin(rb) * (t.BC * 0.62)];
      marks.push({ kind: 'cand', id: 'candP', at: 'P', name: cs.cands[0], role: 'pick', step: 'C' });
      marks.push({ kind: 'cand', id: 'candQ', at: 'Q', name: cs.cands[1], role: 'pick', step: 'C' });
      marks.push({ kind: 'cand', id: 'candR', at: 'R', name: cs.cands[2], role: 'pick', step: 'C' });
    } else marks.push({ kind: 'vertex', id: 'vC', at: 'C', name: nC, role: 'link', step: 'C', away: [AB / 2, 0] });
    pts.C = C;
    marks.push({ kind: 'seg', id: 'AC', a: 'A', b: 'C', role: 'link', step: 'sides', w: 5, away: 'B' });
    marks.push({ kind: 'seg', id: 'BC', a: 'B', b: 'C', role: 'link', step: 'sides', w: 5, away: 'A' });
  }
  marks.push({ kind: 'vertex', id: 'vA', at: 'A', name: nA, role: 'ink', step: 'base', lstep: 'rulerOff', away: C ?? [AB / 2, 1] });
  marks.push({ kind: 'vertex', id: 'vB', at: 'B', name: nB, role: 'ink', step: 'base', lstep: 'rulerOff', away: C ?? [AB / 2, 1] });
  return { unit: u, pts, marks, rot: cs.rot };
}

// ---------- rulers, protractors, compasses ----------
export function rulerDrawing(p: Extract<Pic, { kind: 'ruler' }>): Drawing {
  const marks: Mark[] = [];
  const pts: Record<string, P2> = { O: [0, 0] };
  const u = p.unit;
  // the ruler's zero sits at O; readings go along deg
  const at = (r: number): P2 => [Math.cos((p.deg * Math.PI) / 180) * r, Math.sin((p.deg * Math.PI) / 180) * r];
  marks.push({ kind: 'ruler', id: 'ruler', at: 'O', deg: p.deg, start: 0, len: p.len, inset: p.inset, step: 'all', side: 1 });
  if (p.seg) {
    const r0 = p.seg[0] === 'edge' ? -p.inset : p.seg[0];
    pts.S = at(r0); pts.E = at(p.seg[1]);
    marks.push({ kind: 'seg', id: 'seg', a: 'S', b: 'E', role: 'first', step: 'all', w: 6, away: at((r0 + p.seg[1]) / 2).map((v, i) => v + [0, -1][i]! * 0) as P2 });
    marks.push({ kind: 'vertex', id: 'vS', at: 'S', name: p.names[0], role: 'ink', step: 'all', away: at(p.seg[1] + 5) });
    marks.push({ kind: 'vertex', id: 'vE', at: 'E', name: p.names[1], role: 'ink', step: 'all', away: at(r0 - 5) });
  } else if (p.start !== undefined) {
    pts.S = at(p.start);
    marks.push({ kind: 'vertex', id: 'vS', at: 'S', name: p.names[0], role: 'ink', step: 'all', away: at(p.start + 5) });
  }
  // the segment / points sit just above the ruler's edge: nudge them off the ticks by a hair in figure units
  return { unit: u, pts, marks, maxScale: u === 'in' ? 150 : 62, margin: 60 };
}
export function protractorDrawing(p: Extract<Pic, { kind: 'protractor' }>): Drawing {
  const baseLen = 3.2;
  const pts: Record<string, P2> = { A: [0, 0], B: p.bRight ? [baseLen, 0] : [-baseLen, 0] };
  const marks: Mark[] = [
    { kind: 'protractor', id: 'prot', at: 'A', deg: 0, step: 'all', dots: p.dots.map(d => ({ deg: d.deg, name: d.name, role: 'pick' as Paint })) },
    { kind: 'seg', id: 'AB', a: 'A', b: 'B', role: 'first', step: 'all', w: 5 },
    { kind: 'vertex', id: 'vA', at: 'A', name: p.names[0], role: 'ink', step: 'all', away: [p.bRight ? 1 : -1, 1] },
    { kind: 'vertex', id: 'vB', at: 'B', name: p.names[1], role: 'ink', step: 'all', away: [p.bRight ? baseLen - 1 : -baseLen + 1, 1] },
  ];
  return { unit: 'in', pts, marks, scale: 120 };
}
export function compassRulerDrawing(p: Extract<Pic, { kind: 'compassRuler' }>): Drawing {
  const pts: Record<string, P2> = { O: [0, 0] };
  return {
    unit: p.unit, pts, maxScale: p.unit === 'in' ? 140 : 58, margin: 70,
    marks: [
      { kind: 'ruler', id: 'ruler', at: 'O', deg: 0, start: 0, len: p.len, inset: p.unit === 'in' ? 0.2 : 0.5, step: 'all', side: 1 },
      { kind: 'compass', id: 'comp', c: [p.s, 0], r: p.e - p.s, from: 0, to: 0, sweep: 'all', step: 'all' },
    ],
  };
}
export function copyDrawing(p: Extract<Pic, { kind: 'copy' }>): Drawing {
  const sd = (p.segDeg * Math.PI) / 180, rd = (p.rayDeg * Math.PI) / 180;
  const P: P2 = [0, 0], Q: P2 = [Math.cos(sd) * p.L, Math.sin(sd) * p.L];
  const A: P2 = [p.L * 0.2, -2.6], D: P2 = [A[0] + Math.cos(rd) * p.L, A[1] + Math.sin(rd) * p.L];
  return {
    unit: p.unit, pts: { P, Q, A, D },
    marks: [
      { kind: 'seg', id: 'PQ', a: 'P', b: 'Q', role: 'first', step: 'all', w: 6, away: [p.L / 2, -3] },
      { kind: 'vertex', id: 'vP', at: 'P', name: p.names[0], role: 'ink', step: 'all', away: Q },
      { kind: 'vertex', id: 'vQ', at: 'Q', name: p.names[1], role: 'ink', step: 'all', away: P },
      { kind: 'ray', id: 'ray', from: 'A', deg: p.rayDeg, len: p.L * 1.5, role: 'dim', step: 'all', w: 3 },
      { kind: 'vertex', id: 'vA', at: 'A', name: p.names[2], role: 'ink', step: 'all', away: [A[0] + Math.cos(rd), A[1] + Math.sin(rd)] },
      { kind: 'arc', id: 'arc', c: 'A', r: p.L, from: p.rayDeg - 14, to: p.rayDeg + 14, role: 'first', step: 'solve' },
      { kind: 'vertex', id: 'vD', at: 'D', name: 'D', role: 'link', step: 'solve', away: [A[0] + Math.cos(rd + 1.2), A[1] + Math.sin(rd + 1.2)] },
    ],
  };
}

// ---------- the proof picture: same angles (40, 60, 80) on a 3 in and a 5 in base, nested at A ----------
export const PROOF_F: Frame = frame(100, 130, 1040, 840);
export function proofDrawing(): Drawing {
  const t1 = solveASA(3, 40, 60), t2 = solveASA(5, 40, 60);
  const pts: Record<string, P2> = { A: t1.A, B: t1.B, C: t1.C, B2: t2.B, C2: t2.C };
  return {
    unit: 'in', pts,
    marks: [
      { kind: 'seg', id: 'AB', a: 'A', b: 'B', role: 'first', step: 'one', w: 5, away: 'C', label: { text: '3 in', role: 'first', size: 52 } },
      { kind: 'seg', id: 'BB2', a: 'B', b: 'B2', role: 'first', step: 'two', w: 5 },
      { kind: 'seg', id: 'dim5', a: [0, -0.85], b: [5, -0.85], role: 'dim', step: 'two', w: 3, away: [2.5, 0], label: { text: '5 in', role: 'first', size: 52 } },
      { kind: 'seg', id: 'dim5a', a: [0, -0.7], b: [0, -1.0], role: 'dim', step: 'two', w: 3 },
      { kind: 'seg', id: 'dim5b', a: [5, -0.7], b: [5, -1.0], role: 'dim', step: 'two', w: 3 },
      { kind: 'seg', id: 'AC2', a: 'A', b: 'C2', role: 'second', step: 'two', w: 3.5 },
      { kind: 'seg', id: 'AC', a: 'A', b: 'C', role: 'link', step: 'one', w: 5 },
      { kind: 'seg', id: 'BC', a: 'B', b: 'C', role: 'link', step: 'one', w: 5 },
      { kind: 'seg', id: 'B2C2', a: 'B2', b: 'C2', role: 'link', step: 'two', w: 5 },
      { kind: 'angle', id: 'angA', at: 'A', p: 'B', q: 'C', role: 'second', step: 'one', label: { text: '40°', size: 56 } },
      { kind: 'angle', id: 'angB', at: 'B', p: 'A', q: 'C', role: 'second', step: 'one', label: { text: '60°', size: 56 } },
      { kind: 'angle', id: 'angC', at: 'C', p: 'A', q: 'B', role: 'second', step: 'c1', label: { text: '80°', size: 56 } },
      { kind: 'angle', id: 'angB2', at: 'B2', p: 'A', q: 'C2', role: 'second', step: 'two', label: { text: '60°', size: 56 } },
      { kind: 'angle', id: 'angC2', at: 'C2', p: 'A', q: 'B2', role: 'second', step: 'c2', label: { text: '80°', size: 56 } },
      { kind: 'vertex', id: 'vA', at: 'A', name: 'A', role: 'ink', step: 'one', away: [3, 2] },
      { kind: 'vertex', id: 'vB', at: 'B', name: 'B', role: 'ink', step: 'one', away: 'C' },
      { kind: 'vertex', id: 'vC', at: 'C', name: 'C', role: 'ink', step: 'one', away: 'B' },
      { kind: 'vertex', id: 'vB2', at: 'B2', name: 'B′', role: 'ink', step: 'two', away: 'C' },
      { kind: 'vertex', id: 'vC2', at: 'C2', name: 'C′', role: 'ink', step: 'two', away: 'B' },
    ],
  };
}

// ---------- the practice sheet ----------
export const SHEET: Box = box(80, 90, 1160, 990);
export const PIC_FRAME: Frame = frame(100, 110, 1040, 860);
export interface BuiltPic { blocks: { b: ConstructionBlock; cap?: { text: string; x: number; y: number } }[]; sticks?: SticksBlock }
/** lay a picture out on the practice sheet (throws when it cannot be read) */
export function buildPic(p: Pic, f: Frame = PIC_FRAME): BuiltPic {
  switch (p.kind) {
    case 'tri': return { blocks: [{ b: Construction(triDrawing(p.t), f) }] };
    case 'tris': {
      // two side by side; three as two on top and one centred below (each big enough for its labels)
      const n = p.ts.length, capH = 70;
      const cells = n === 3
        ? [frame(f.x, f.y, f.w / 2, f.h / 2), frame(f.x + f.w / 2, f.y, f.w / 2, f.h / 2), frame(f.x + f.w / 4, f.y + f.h / 2, f.w / 2, f.h / 2)]
        : p.ts.map((_, i) => frame(f.x + (i * f.w) / n, f.y, f.w / n, f.h));
      return {
        blocks: p.ts.map((t, i) => {
          const cl = cells[i]!, fr = frame(cl.x + 8, cl.y, cl.w - 16, cl.h - capH);
          return { b: Construction(triDrawing({ ...t, size: t.size ?? (n === 3 ? 48 : 52) }), fr), cap: { text: String(i + 1), x: fr.x + fr.w / 2, y: cl.y + cl.h - capH / 2 - 4 } };
        }),
      };
    }
    case 'construct': return { blocks: [{ b: Construction(constructDrawing(p.c), f) }] };
    case 'ruler': return { blocks: [{ b: Construction(rulerDrawing(p), f) }] };
    case 'protractor': return { blocks: [{ b: Construction(protractorDrawing(p), f) }] };
    case 'compassRuler': return { blocks: [{ b: Construction(compassRulerDrawing(p), f) }] };
    case 'copy': return { blocks: [{ b: Construction(copyDrawing(p), f) }] };
    case 'sticks': return { blocks: [], sticks: Sticks(p.lens, p.unit, f, i => p.texts?.[i] ?? `${len(p.lens[i]!, p.unit)} ${p.unit}`) };
  }
}
export const picFits = (p: Pic): boolean => tryBlock(() => buildPic(p)).ok;
