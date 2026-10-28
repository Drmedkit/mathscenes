// CountPic: the counting pictures of the Statistics course (a candidate for src/lesson/kit/). One card in a Frame, of
// one of five kinds:
//   slots   a slot diagram: one box per choice, the number of choices inside, the role under it, × between the
//           boxes; several rows joined by + (disjoint cases); an optional division row under a long bar (÷ r! orders
//           of one group); optional sample tokens above the boxes (one filled outcome); hidden counts show "?" until
//           the replay ('rev')
//   tree    a uniform tree diagram, root on the left, one column per stage (stage names on top), the outcome of each
//           complete path at the right; `grow` = how many first-stage branches are drawn at first (the rest on 'rest')
//   grid    rows of chips (an organized list; one row per unordered group when the chips are its orders), a label per
//           row on the left
//   venn    two overlapping circles with their totals, the overlap count, and the "only" regions ('?' until 'rev')
//   tokens  a row (or two) of named discs (people, toppings), coloured by group, chosen ones lifted with a lime ring
// Steps: 'card' (the card and title), then per kind (see `stepsOf`). Focus: rings on `where` boxes, coloured rows /
// chips / tokens. Pure layout; throws BlockError when something would not fit at readable sizes (numbers >= 60 px,
// labels >= 44 px) or a count is out of range.
import { type Box, type Pt, box, clamp, lag } from '../../../core/math';
import { rectPts } from '../../../core/pts';
import { type Canvas, dot, withAlpha } from '../../../core/draw';
import { E } from '../../../core/easing';
import type { Progress } from '../../../core/clock';
import { type Paint, type Theme, paint } from '../../../core/theme';
import { type Frame, check } from '../../../blocks/block';
import { drawWords, wordsBox } from '../../words';
import { wash } from '../../wash';
import { DUSK } from '../../dusk';

const NAME = 'CountPic';
export interface Slot { role: string; n?: number; /** a count the student works out (drawn as "?" until 'rev'; hidden from oracles) */ reveal?: number; /** a sample choice shown above the box */ fill?: string; col?: Paint }
export interface SlotRow { slots: Slot[]; caption?: string }
export type CPic =
  | { kind: 'slots'; rows: SlotRow[]; div?: Slot[]; /** the sign between rows: + (disjoint cases, default), − (total minus the complement), '' (separate counts) */ op?: '+' | '−' | ''; title?: string }
  | { kind: 'tree'; levels: { name: string; opts: string[] }[]; grow?: number; leaves?: boolean; title?: string }
  | { kind: 'grid'; rows: { chips: string[]; label?: string }[]; title?: string }
  | { kind: 'venn'; a: { name: string; total: number }; b: { name: string; total: number }; both: number; reveal?: { onlyA: number; onlyB: number }; title?: string }
  | { kind: 'tokens'; names: string[]; groups?: number[]; on?: number[]; legend?: [string, string]; title?: string };
export interface CFocus {
  /** grid rows (indices) recoloured / ringed */ rows?: readonly { i: readonly number[]; col: Paint; k: number }[];
  /** grid chips: [row, col] coloured */ chips?: readonly { at: readonly [number, number][]; col: Paint; k: number }[];
  /** tokens chosen (lifted, ringed) with their colour; overrides `on` while k > 0 */ on?: { idx: readonly number[]; col: Paint; k: number };
  /** glow rings on where() boxes */ ring?: readonly { key: string; col: Paint; k: number }[];
}
export interface CountPicBlock {
  readonly kind: 'CountPic';
  readonly pic: CPic;
  readonly box: Box;
  readonly steps: readonly string[];
  where(key: string): Box;
  draw(c: Canvas, P: Progress<string>, f?: CFocus): void;
}

const NUM = 72, LAB = 44, TITLE = 46, CHIP = 44;
const CARD = '#262B57', INK = DUSK.cream, PLATE = '#1A1E44';
const textW = (t: string, size: number, weight = 650) => wordsBox(t, 0, 0, { size, weight }).w;

export function CountPic(pic: CPic, fr: Frame, th: Theme): CountPicBlock {
  const x0 = fr.x, y0 = fr.y, x1 = fr.x + fr.w, y1 = fr.y + fr.h;
  const col = (c: Paint) => paint(th, c, 'fill');
  const title = pic.title ? { t: pic.title, b: wordsBox(pic.title, (x0 + x1) / 2, y0 + 44, { size: TITLE, align: 'center', weight: 700 }) } : null;
  if (title) check(title.b.x0 >= x0 + 16 && title.b.x1 <= x1 - 16, NAME, `title "${pic.title}" is too wide`);
  const top = y0 + (title ? 92 : 24), bot = y1 - 24;
  const boxes = new Map<string, Box>();
  let steps: string[] = ['card'];
  let drawBody: (c: Canvas, P: Progress<string>, f: CFocus) => void = () => undefined;

  // ---------- shared painters ----------
  function stroke(c: Canvas, Q: readonly Pt[], cl: Paint | string, w: number, alpha = 1, dash?: number[]): void {
    if (Q.length < 2 || alpha <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(alpha); g.strokeStyle = cl.startsWith('#') || cl.startsWith('rgba') ? cl : col(cl as Paint);
    g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; if (dash) g.setLineDash(dash);
    g.beginPath(); g.moveTo(Q[0]![0], Q[0]![1]); for (const q of Q.slice(1)) g.lineTo(q[0], q[1]); g.stroke(); g.restore();
  }
  function plateBox(c: Canvas, B: Box, fill: string, edge: Paint | string, k: number, w = 3, r = 14): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.fillStyle = fill; g.strokeStyle = edge.startsWith('#') || edge.startsWith('rgba') ? edge : col(edge as Paint); g.lineWidth = w;
    g.beginPath(); g.roundRect(B.x0, B.y0, B.w, B.h, r); g.fill(); g.stroke(); g.restore();
  }
  function glowRing(c: Canvas, B: Box, cl: Paint, k: number): void {
    if (k <= 0) return;
    const { g } = c;
    g.save(); g.globalAlpha *= clamp(k); g.strokeStyle = col(cl); g.lineWidth = 5;
    g.shadowColor = col(cl); g.shadowBlur = 10 * th.glow * Math.hypot(g.getTransform().a, g.getTransform().b);
    g.beginPath(); g.roundRect(B.x0 - 9, B.y0 - 7, B.w + 18, B.h + 14, 14); g.stroke(); g.restore();
  }

  // ====================== slots ======================
  if (pic.kind === 'slots') {
    const rows = pic.rows;
    check(rows.length >= 1 && rows.length <= 3, NAME, '1 to 3 slot rows');
    const most = Math.max(...rows.map(r => r.slots.length), pic.div?.length ?? 0);
    // few slots: bigger boxes, numbers and labels (they fill the card); many slots: tighter
    const PLUS = 70;
    const sizes = (sc: number) => {
      const SN = Math.round(NUM * sc), SL = sc > 1 ? 48 : LAB, MINW = Math.round((most >= 6 ? 116 : 132) * sc), GAP = Math.round((most >= 5 ? 56 : 74) * sc);
      const slotW = (s: Slot) => {
        const v = s.n ?? s.reveal;
        check(v === undefined || (Number.isInteger(v) && v >= 0), NAME, `slot count ${v} is not a whole number`);
        const nw = v === undefined ? 0 : textW(v.toLocaleString('en-US'), SN, 700);
        return Math.max(MINW, textW(s.role, SL) + 22, nw + 44);
      };
      const widest = Math.max(...[...rows.map(r => r.slots), ...(pic.div ? [pic.div] : [])].map(sl => sl.reduce((a, s) => a + slotW(s), 0) + (sl.length - 1) * GAP)) + (rows.length > 1 ? PLUS : 0);
      return { sc, SN, SL, MINW, GAP, slotW, widest };
    };
    // the largest scale (up to 1.3 for few slots) at which every row fits
    const Z = [most <= 3 ? 1.3 : 1.15, 1.15, 1].map(sizes).find(z => z.widest <= fr.w - 60) ?? sizes(1);
    const { sc, SN, SL, GAP, slotW } = Z;
    const H = Math.round(128 * sc);
    const all: { slots: Slot[]; caption?: string; plus: boolean; div: boolean }[] = rows.map((r, i) => ({ ...r, plus: i > 0, div: false }));
    if (pic.div) all.push({ slots: pic.div, plus: false, div: true });
    const blockH = (r: (typeof all)[number]) => (r.caption ? 58 : 0) + (r.slots.some(s => s.fill) ? 84 : 0) + H + 70 + (r.div ? 40 : 0);
    const totalH = all.reduce((s, r) => s + blockH(r), 0) + (all.length - 1) * 26;
    check(totalH <= bot - top, NAME, 'the slot rows do not fit');
    let y = top + (bot - top - totalH) / 2;
    const geo = all.map((r, ri) => {
      check(r.slots.length >= 1 && r.slots.length <= 6, NAME, '1 to 6 slots per row');
      const ws = r.slots.map(slotW);
      const rowW = ws.reduce((s, w) => s + w, 0) + (r.slots.length - 1) * GAP;
      const lead = rows.length > 1 && !r.div && (pic.op ?? '+') !== '' ? PLUS : 0;
      check(rowW + lead <= fr.w - 60, NAME, `slot row ${ri} is too wide (${Math.round(rowW)} px)`);
      const yCap = y + 26;
      if (r.caption) { check(textW(r.caption, SL) <= fr.w - 80, NAME, 'caption too wide'); y += 58; }
      if (r.slots.some(s => s.fill)) y += 84;
      if (r.div) y += 40;
      let x = (x0 + x1 + lead) / 2 - rowW / 2;
      const bxs = ws.map(w => { const b = box(x, y, x + w, y + H); x += w + GAP; return b; });
      bxs.forEach((b, i) => boxes.set(r.div ? `div.${i}` : `slot.${ri}.${i}`, b));
      const rb = box(bxs[0]!.x0, y, bxs[bxs.length - 1]!.x1, y + H + 64);
      boxes.set(r.div ? 'div' : `row.${ri}`, rb);
      const cap = r.caption ? { t: r.caption, x: bxs[0]!.x0, y: yCap } : null;
      y += H + 70 + 26;
      return { r, ri, bxs, cap, lead };
    });
    const numRows = geo.filter(g => !g.r.div);
    const numBox = box(Math.min(...numRows.map(g => g.bxs[0]!.x0)), numRows[0]!.bxs[0]!.y0, Math.max(...numRows.map(g => g.bxs[g.bxs.length - 1]!.x1)), numRows[numRows.length - 1]!.bxs[0]!.y1 + 64);
    boxes.set('all', numBox);
    steps = ['card', ...numRows.map((_, i) => `r${i}`), ...numRows.map((_, i) => `n${i}`), 'x', ...(pic.div ? ['div'] : []), ...(all.some(r => r.slots.some(s => s.fill)) ? ['fill'] : []), ...(all.some(r => r.slots.some(s => s.reveal !== undefined)) ? ['rev'] : [])];
    drawBody = (c, P) => {
      for (const g of geo) {
        const kRow = g.r.div ? P.k('div') : P.k(`r${g.ri}`), kNum = g.r.div ? P.k('div') : P.k(`n${g.ri}`);
        if (g.r.div && kRow > 0) {
          const ya = g.bxs[0]!.y0 - 34, kk = E.inOut(clamp(kRow * 1.5));
          stroke(c, [[numBox.x0 - 20, ya], [numBox.x0 - 20 + (numBox.w + 40) * kk, ya]], INK, 5);
        }
        if (g.cap && kRow > 0) drawWords(c, g.cap.t, g.cap.x, g.cap.y, 'dim', clamp(kRow * 1.4), { size: SL, weight: 650 });
        if (g.lead && g.ri > 0) drawWords(c, pic.op ?? '+', g.bxs[0]!.x0 - g.lead / 2 - 8, g.bxs[0]!.cy, 'ink', P.k('x'), { size: SN, align: 'center', weight: 700 });
        g.bxs.forEach((b, i) => {
          const s = g.r.slots[i]!, ki = E.back(clamp(lag(kRow, i, g.bxs.length, 0.45)));
          if (ki <= 0) return;
          const lift = (1 - clamp(ki)) * 24;
          withAlpha(c, clamp(ki), () => {
            wash(c, rectPts(b.x0, b.y0 + lift, b.w, b.h, 16), s.col ?? (g.r.div ? 'second' : 'first'), { seed: 11 + i + g.ri * 7, rough: 1.0, ink: DUSK.ink, inkW: 3, alpha: 0.3, shade: 0.15 });
            plateBox(c, box(b.x0 + 8, b.y0 + 8 + lift, b.x1 - 8, b.y1 - 8 + lift), PLATE, s.col ?? (g.r.div ? 'second' : 'first'), 1, 3, 12);
            drawWords(c, s.role, b.cx, b.y1 + 38, 'dim', ki, { size: SL, align: 'center', weight: 650 });
          });
          const v = s.n ?? s.reveal;
          if (s.n !== undefined) drawWords(c, s.n.toLocaleString('en-US'), b.cx, b.cy + 2, 'ink', clamp(kNum * 1.3 - i * 0.12), { size: SN, align: 'center', weight: 700 });
          else if (s.reveal !== undefined) {
            const kr = P.k('rev');
            drawWords(c, '?', b.cx, b.cy + 2, 'pick', clamp(kNum) * (1 - kr), { size: SN, align: 'center', weight: 700 });
            if (kr > 0 && v !== undefined) drawWords(c, v.toLocaleString('en-US'), b.cx, b.cy + 2, 'link', clamp(lag(kr, i, g.bxs.length, 0.5)), { size: SN, align: 'center', weight: 700 });
          }
          if (s.fill) {
            const kf = clamp(lag(P.k('fill'), i, g.bxs.length, 0.5));
            if (kf > 0) {
              const tw = Math.max(70, textW(s.fill, CHIP) + 30), fb = box(b.cx - tw / 2, b.y0 - 74, b.cx + tw / 2, b.y0 - 14);
              const dy = (1 - E.back(kf)) * -26;
              withAlpha(c, kf, () => {
                wash(c, rectPts(fb.x0, fb.y0 + dy, fb.w, fb.h, 26), 'pick', { seed: 31 + i, rough: 0.9, ink: DUSK.ink, inkW: 3, shade: 0.2 });
                drawWords(c, s.fill!, fb.cx, fb.cy + dy, '#1A1430', 1, { size: CHIP, align: 'center', weight: 750 });
              });
            }
          }
          if (i < g.bxs.length - 1) drawWords(c, '×', b.x1 + GAP / 2, b.cy, 'ink', P.k('x'), { size: Math.round(64 * sc), align: 'center', weight: 600 });
        });
      }
    };
  }

  // ====================== tree ======================
  else if (pic.kind === 'tree') {
    const L = pic.levels;
    check(L.length >= 1 && L.length <= 3, NAME, '1 to 3 stages');
    for (const l of L) check(l.opts.length >= 1 && l.opts.length <= 6, NAME, 'each stage has 1 to 6 branches');
    const leaves = L.reduce((p, l) => p * l.opts.length, 1);
    check(leaves <= 16, NAME, `too many leaves (${leaves})`);
    const headY = top + 6, ty0 = top + 62, ty1 = bot - 6;
    const sp = (ty1 - ty0) / leaves;
    check(sp >= 50, NAME, `branches too close (${sp.toFixed(0)} px)`);
    const outcomes: string[] = [];
    const rec = (d: number, acc: string[]) => { if (d === L.length) { outcomes.push(acc.join(L.some(l => l.opts.some(o => o.length > 1)) ? ', ' : '')); return; } for (const o of L[d]!.opts) rec(d + 1, [...acc, o]); };
    rec(0, []);
    const leafW = pic.leaves === false ? 0 : Math.max(...outcomes.map(o => textW(o, LAB))) + 20;
    const optW = Math.max(...L.flatMap(l => l.opts.map(o => textW(o, LAB)))) + 28;
    const rootX = x0 + 56, xEnd = x1 - 36 - leafW;
    const colGap = (xEnd - rootX) / L.length;
    check(colGap >= optW + 50, NAME, 'stages too close for their labels');
    // node geometry: level d node j (in DFS order) with its children
    interface Node { d: number; x: number; y: number; label: string; parent: Node | null; first: number; leafIdx: number[] }
    const nodes: Node[] = [];
    const root: Node = { d: -1, x: rootX, y: (ty0 + ty1) / 2, label: '', parent: null, first: -1, leafIdx: [] };
    let leafNo = 0;
    const build = (parent: Node, d: number, first: number): Node[] => {
      if (d === L.length) { parent.leafIdx.push(leafNo++); return []; }
      return L[d]!.opts.map((o, j) => {
        const n: Node = { d, x: rootX + colGap * (d + 1) - optW / 2, y: 0, label: o, parent, first: d === 0 ? j : first, leafIdx: [] };
        nodes.push(n);
        const kids = build(n, d + 1, d === 0 ? j : first);
        n.leafIdx = d === L.length - 1 ? n.leafIdx : kids.flatMap(k => k.leafIdx);
        return n;
      });
    };
    build(root, 0, -1);
    for (const n of nodes) { const ls = n.leafIdx; n.y = ty0 + sp * ((ls[0]! + ls[ls.length - 1]!) / 2 + 0.5); }
    const grow = pic.grow ?? L[0]!.opts.length;
    const heads = L.map((l, d) => ({ t: l.name, x: rootX + colGap * (d + 1) - optW / 2 }));
    for (const h of heads) check(textW(h.t, LAB) <= colGap - 16, NAME, `stage name "${h.t}" is too wide`);
    nodes.forEach((n, i) => boxes.set(`node.${i}`, box(n.x - optW / 2, n.y - 26, n.x + optW / 2, n.y + 26)));
    outcomes.forEach((o, i) => boxes.set(`leaf.${i}`, wordsBox(o, xEnd + 26, ty0 + sp * (i + 0.5), { size: LAB })));
    boxes.set('leaves', box(xEnd + 16, ty0, x1 - 20, ty1));
    steps = ['card', ...L.map((_, d) => `L${d}`), ...(grow < L[0]!.opts.length ? ['rest'] : []), ...(pic.leaves === false ? [] : ['leaf'])];
    drawBody = (c, P) => {
      heads.forEach((h, d) => drawWords(c, h.t, h.x, headY + 20, 'dim', P.k(`L${d}`), { size: LAB, align: 'center', weight: 650 }));
      dot(c, root.x, root.y, 11, 'ink', clamp(P.k('card') * 2 - 0.5));
      const kOf = (n: Node) => (n.first < grow || n.d === 0 ? P.k(`L${n.d}`) : Math.min(P.k(`L${n.d}`), P.k('rest')));
      for (const n of nodes) {
        const k = kOf(n);
        if (k <= 0) continue;
        const p = n.parent!, px0 = p === root ? root.x + 12 : p.x + optW / 2 - 4, tx = n.x - optW / 2 + 4;
        const kk = E.inOut(clamp(k * 1.4));
        stroke(c, [[px0, p.y], [px0 + (tx - px0) * kk, p.y + (n.y - p.y) * kk]], INK, 3.5);
        const kl = clamp(k * 1.4 - 0.4);
        plateBox(c, box(n.x - optW / 2, n.y - 27, n.x + optW / 2, n.y + 27), PLATE, n.d === 0 ? 'first' : n.d === 1 ? 'second' : 'pick', kl, 3, 22);
        drawWords(c, n.label, n.x, n.y, 'ink', kl, { size: LAB, align: 'center', weight: 700 });
      }
      if (pic.leaves !== false) {
        const kL = P.k('leaf');
        outcomes.forEach((o, i) => {
          const owner = nodes.find(n => n.d === L.length - 1 && n.leafIdx.includes(i))!;
          const k = Math.min(kL, kOf(owner));
          if (k <= 0) return;
          stroke(c, [[owner.x + optW / 2 + 4, owner.y], [xEnd + 12, owner.y]], '#6A6FA2', 2, clamp(k), [5, 7]);
          drawWords(c, o, xEnd + 26, ty0 + sp * (i + 0.5), 'link', clamp(lag(k, i, outcomes.length, 0.5)), { size: LAB, weight: 700 });
        });
      }
    };
  }

  // ====================== grid ======================
  else if (pic.kind === 'grid') {
    const R = pic.rows;
    check(R.length >= 1 && R.length <= 12, NAME, '1 to 12 rows');
    const cols = Math.max(...R.map(r => r.chips.length));
    check(cols >= 1 && cols <= 8, NAME, '1 to 8 chips per row');
    const labW = R.some(r => r.label) ? Math.max(...R.map(r => (r.label ? textW(r.label, LAB) : 0))) + 34 : 0;
    const chipT = Math.max(...R.flatMap(r => r.chips.map(t => textW(t, CHIP, 700))));
    const gap = 14, avail = fr.w - 60 - labW;
    const cw = Math.min(200, (avail - (cols - 1) * gap) / cols);
    check(cw >= chipT + 18, NAME, `chips too narrow (${cw.toFixed(0)} px for ${chipT.toFixed(0)} px of text)`);
    const rowH = Math.min(96, (bot - top) / R.length), ch = Math.min(70, rowH - 12);
    check(ch >= 54, NAME, `rows too thin (${ch.toFixed(0)} px)`);
    const gridW = labW + cols * cw + (cols - 1) * gap, gx = (x0 + x1) / 2 - gridW / 2;
    const gy = top + (bot - top - rowH * R.length) / 2;
    const geo = R.map((r, i) => {
      const cy = gy + rowH * (i + 0.5);
      const chips = r.chips.map((t, j) => ({ t, b: box(gx + labW + j * (cw + gap), cy - ch / 2, gx + labW + j * (cw + gap) + cw, cy + ch / 2) }));
      chips.forEach((cp, j) => boxes.set(`chip.${i}.${j}`, cp.b));
      const rb = box(gx + labW - 6, cy - ch / 2 - 4, gx + labW + r.chips.length * (cw + gap) - gap + 6, cy + ch / 2 + 4);
      boxes.set(`row.${i}`, rb);
      return { r, cy, chips, rb };
    });
    boxes.set('all', box(gx, gy, gx + gridW, gy + rowH * R.length));
    steps = ['card', ...R.map((_, i) => `r${i}`), ...(labW ? ['lab'] : [])];
    drawBody = (c, P, f) => {
      geo.forEach((g, i) => {
        const k = P.k(`r${i}`);
        if (k <= 0) return;
        const rowCol = [...(f.rows ?? [])].reverse().find(q => q.i.includes(i) && q.k > 0);
        if (rowCol) withAlpha(c, clamp(rowCol.k) * 0.22, () => wash(c, rectPts(g.rb.x0 - 4, g.rb.y0 - 2, g.rb.w + 8, g.rb.h + 4, 18), rowCol.col, { seed: 50 + i, rough: 0.8, ink: null, shade: 0 }));
        g.chips.forEach((cp, j) => {
          const kj = E.back(clamp(lag(k, j, g.chips.length, 0.5)));
          if (kj <= 0) return;
          const cc = [...(f.chips ?? [])].reverse().find(q => q.k > 0 && q.at.some(([a, b]) => a === i && b === j));
          const edge: Paint = cc ? cc.col : rowCol ? rowCol.col : 'faint';
          plateBox(c, box(cp.b.x0, cp.b.y0 + (1 - clamp(kj)) * 16, cp.b.x1, cp.b.y1 + (1 - clamp(kj)) * 16), cc ? '#2E2A5E' : PLATE, edge, clamp(kj), cc || rowCol ? 4 : 2.5, 14);
          drawWords(c, cp.t, cp.b.cx, cp.b.cy + (1 - clamp(kj)) * 16, cc ? cc.col : 'ink', clamp(kj), { size: CHIP, align: 'center', weight: 700 });
        });
        if (g.r.label) drawWords(c, g.r.label, gx + labW - 30, g.cy, rowCol ? rowCol.col : 'dim', Math.min(clamp(k), P.k('lab')), { size: LAB, align: 'right', weight: 700 });
      });
    };
  }

  // ====================== venn ======================
  else if (pic.kind === 'venn') {
    const { a, b, both } = pic;
    check(both >= 0 && both <= a.total && both <= b.total, NAME, 'the overlap is larger than a set');
    const cy = (top + bot) / 2 + 24, r = Math.min(250, (bot - top - 120) / 2, (fr.w - 120) / 3.1);
    check(r >= 170, NAME, 'the circles are too small');
    const d = r * 1.1, cxA = (x0 + x1) / 2 - d / 2, cxB = (x0 + x1) / 2 + d / 2;
    const tA = `${a.name}: ${a.total}`, tB = `${b.name}: ${b.total}`;
    const hA = wordsBox(tA, cxA - r * 0.3, cy - r - 40, { size: LAB, align: 'center' }), hB = wordsBox(tB, cxB + r * 0.3, cy - r - 40, { size: LAB, align: 'center' });
    check(hA.x1 + 20 < hB.x0 && hA.x0 >= x0 + 10 && hB.x1 <= x1 - 10, NAME, 'set names collide');
    boxes.set('A', box(cxA - r, cy - r, cxA + r, cy + r)); boxes.set('B', box(cxB - r, cy - r, cxB + r, cy + r));
    const mid = (x0 + x1) / 2, onlyAx = (cxA - r + (cxB - r)) / 2, onlyBx = (cxA + r + (cxB + r)) / 2;
    boxes.set('both', box(mid - 50, cy - 44, mid + 50, cy + 44)); boxes.set('onlyA', box(onlyAx - 50, cy - 44, onlyAx + 50, cy + 44)); boxes.set('onlyB', box(onlyBx - 50, cy - 44, onlyBx + 50, cy + 44));
    steps = ['card', 'A', 'B', 'both', ...(pic.reveal ? ['rev'] : [])];
    const circle = (c: Canvas, cx: number, cl: Paint, k: number, seed: number) => {
      if (k <= 0) return;
      const pts: Pt[] = Array.from({ length: 72 }, (_, i) => [cx + r * Math.cos((i / 72) * Math.PI * 2), cy + r * Math.sin((i / 72) * Math.PI * 2)] as Pt);
      withAlpha(c, clamp(k) * 0.42, () => wash(c, pts, cl, { seed, rough: 1.2, ink: null, shade: 0.1 }));
      stroke(c, [...pts, pts[0]!], cl, 5, clamp(k));
    };
    drawBody = (c, P) => {
      circle(c, cxA, 'first', P.k('A'), 61); circle(c, cxB, 'second', P.k('B'), 62);
      drawWords(c, tA, hA.cx, cy - r - 40, 'first', P.k('A'), { size: LAB, align: 'center', weight: 700 });
      drawWords(c, tB, hB.cx, cy - r - 40, 'second', P.k('B'), { size: LAB, align: 'center', weight: 700 });
      drawWords(c, String(both), mid, cy, 'link', P.k('both'), { size: NUM, align: 'center', weight: 700 });
      drawWords(c, 'both', mid, cy + 58, 'dim', P.k('both'), { size: LAB, align: 'center', weight: 600 });
      if (pic.reveal) {
        const kr = P.k('rev');
        for (const [x, v] of [[onlyAx, pic.reveal.onlyA], [onlyBx, pic.reveal.onlyB]] as const) {
          drawWords(c, '?', x, cy, 'pick', Math.min(P.k('both'), 1 - kr), { size: NUM, align: 'center', weight: 700 });
          drawWords(c, String(v), x, cy, 'ink', kr, { size: NUM, align: 'center', weight: 700 });
        }
      }
    };
  }

  // ====================== tokens ======================
  else {
    const T = pic;
    const n = T.names.length;
    check(n >= 2 && n <= 16, NAME, '2 to 16 tokens');
    const perRow = n <= 8 ? n : Math.ceil(n / 2), nRows = n <= 8 ? 1 : 2;
    const tw = Math.max(...T.names.map(s => textW(s, CHIP, 750)));
    const legendH = T.legend ? 70 : 0;
    const rMax = n <= 3 ? 92 : n <= 5 ? 80 : 64;
    const r = Math.min(rMax, (fr.w - 80) / perRow / 2 - 10, (bot - top - legendH - 60) / nRows / 2 - 30);
    const TS = r >= 76 ? 52 : CHIP;
    check(r * 2 >= tw * (TS / CHIP) + 14 && r >= 34, NAME, `tokens too small for their names (r = ${r.toFixed(0)})`);
    const step = Math.min(r * 2 + 40, (fr.w - 80) / perRow);
    const rowsH = nRows * (r * 2 + 60), yA = top + (bot - top - legendH - rowsH) / 2 + 30 + r;
    const at = T.names.map((_, i) => {
      const row = Math.floor(i / perRow), j = i % perRow, cnt = row === 0 ? Math.min(perRow, n) : n - perRow;
      return [(x0 + x1) / 2 + (j - (cnt - 1) / 2) * step, yA + row * (r * 2 + 60)] as Pt;
    });
    at.forEach((p, i) => boxes.set(`tok.${i}`, box(p[0] - r, p[1] - r, p[0] + r, p[1] + r)));
    boxes.set('all', box(Math.min(...at.map(p => p[0])) - r, Math.min(...at.map(p => p[1])) - r, Math.max(...at.map(p => p[0])) + r, Math.max(...at.map(p => p[1])) + r));
    const legY = bot - 30;
    steps = ['card', 'tok', ...(T.on?.length ? ['on'] : [])];
    drawBody = (c, P, f) => {
      const k = P.k('tok');
      const fo = f.on && f.on.k > 0 ? f.on : null;
      const onK = (i: number) => (fo ? (fo.idx.includes(i) ? clamp(fo.k) : 0) : (T.on ?? []).includes(i) ? P.k('on') : 0);
      at.forEach((p, i) => {
        const ki = E.back(clamp(lag(k, i, n, 0.5)));
        if (ki <= 0) return;
        const o = onK(i), lift = E.inOut(o) * 26;
        const gcol: Paint = T.groups ? (T.groups[i] === 1 ? 'second' : 'first') : 'pick';
        const pts: Pt[] = Array.from({ length: 40 }, (_, q) => [p[0] + r * ki * Math.cos((q / 40) * Math.PI * 2), p[1] - lift + r * ki * Math.sin((q / 40) * Math.PI * 2)] as Pt);
        wash(c, pts, gcol, { seed: 80 + i, rough: 0.9, ink: DUSK.ink, inkW: 3, shade: 0.25, lift: 0.1 });
        if (o > 0) {
          const cl = fo ? fo.col : 'link';
          const ring: Pt[] = Array.from({ length: 41 }, (_, q) => [p[0] + r * 1.2 * ki * Math.cos((q / 40) * Math.PI * 2), p[1] - lift + r * 1.2 * ki * Math.sin((q / 40) * Math.PI * 2)] as Pt);
          withAlpha(c, o, () => stroke(c, ring, cl, 6));
        }
        drawWords(c, T.names[i]!, p[0], p[1] - lift, '#1A1430', clamp(ki), { size: TS, align: 'center', weight: 750 });
      });
      if (T.legend) {
        const [la, lb] = T.legend, wa = textW(la, LAB), wb = textW(lb, LAB), tot = 40 + wa + 60 + 40 + wb;
        let x = (x0 + x1) / 2 - tot / 2;
        dot(c, x + 14, legY, 14, 'first', k); drawWords(c, la, x + 40, legY, 'dim', k, { size: LAB, weight: 650 }); x += 40 + wa + 60;
        dot(c, x + 14, legY, 14, 'second', k); drawWords(c, lb, x + 40, legY, 'dim', k, { size: LAB, weight: 650 });
      }
    };
  }

  function where(key: string): Box {
    const b = boxes.get(key);
    check(b, NAME, `no box for "${key}"`);
    return b!;
  }
  function draw(c: Canvas, P: Progress<string>, f: CFocus = {}): void {
    const kc = P.k('card');
    if (kc > 0) {
      withAlpha(c, E.smooth(clamp(kc * 2)), () => wash(c, rectPts(x0, y0, fr.w, fr.h, 18), CARD, { seed: 43, rough: 1.3, ink: DUSK.ink, inkW: 3, shade: 0.25 }));
      if (title) drawWords(c, title.t, title.b.cx, y0 + 44, 'ink', clamp(kc * 2 - 0.6), { size: TITLE, align: 'center', weight: 700 });
    }
    drawBody(c, P, f);
    for (const r of f.ring ?? []) glowRing(c, where(r.key), r.col, r.k);
  }
  return { kind: 'CountPic', pic, box: box(x0, y0, x1, y1), steps, where, draw };
}
