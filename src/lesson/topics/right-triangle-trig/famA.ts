// famA.ts: stage 1 of "Right triangle trigonometry": sides named from an angle, ratio invariance (AA), sine, cosine,
// tangent, bounds, covariation, co-functions. No calculator in this stage.
import type { Fig, MarkCol } from '../geometry-foundations/geo';
import { galleryFrames } from '../geometry-foundations/geo';
import { type GFItem, type Gen, AN, MC, S, aN, angN, choice, fitted, fracR, numX, pick, q, r, segN } from './common';
import { type Fn, FNS, TRIPLES, TURNS, cosD, fail, fmt, fnD, letters, rtFig, sideId, sinD, tanD } from './trig';
import { figOf } from '../similarity/sim';

void galleryFrames;
type Side = 'a' | 'b' | 'c';
/** roles relative to the angle at A ('A') or at B ('B') */
export const roleOf = (at: 'A' | 'B') => (at === 'A' ? { opp: 'a' as Side, adj: 'b' as Side, hyp: 'c' as Side } : { opp: 'b' as Side, adj: 'a' as Side, hyp: 'c' as Side });
const ROLE_WORD = { opp: 'opposite leg', adj: 'adjacent leg', hyp: 'hypotenuse' } as const;
/** a triple scaled by k with the legs in random order: a (opposite A), b, c */
export function tripleTri(R: () => number, ks: number[] = [1, 2, 3]): { a: number; b: number; c: number } {
  const t = pick(R, TRIPLES), k = pick(R, ks), sw = R() < 0.5;
  return { a: (sw ? t[0] : t[1]) * k, b: (sw ? t[1] : t[0]) * k, c: t[2] * k };
}
/** the colour of each side by its role from the angle (opp amber, adj teal, hyp lavender) */
export function roleCols(names: string, at: 'A' | 'B'): Record<string, MarkCol> {
  const ro = roleOf(at);
  return { [sideId(names, ro.opp)]: 'first', [sideId(names, ro.adj)]: 'second', [sideId(names, ro.hyp)]: 'pick' };
}
const vx = (names: string, at: 'A' | 'B') => (at === 'A' ? names[0]! : names[1]!);
const turn = (R: () => number) => ({ rot: pick(R, TURNS), flip: R() < 0.5 });

// ---------- label-sides ----------
export const nameSide: Gen = (R, n) => fitted('nameSide', () => {
  const nm = letters(R), at: 'A' | 'B' = R() < 0.5 ? 'A' : 'B', V = vx(nm, at), ro = roleOf(at);
  const role = pick(R, ['opp', 'adj', 'hyp'] as const), labelled = R() < 0.5;
  const T = labelled ? tripleTri(R, [1, 2, 3, 4]) : { a: r(R, 3, 9), b: r(R, 3, 9), c: 0 };
  if (!labelled && Math.max(T.a, T.b) / Math.min(T.a, T.b) > 2.6) fail();
  const lab = labelled ? { a: { text: fmt(T.a) }, b: { text: fmt(T.b) }, c: { text: fmt(T.c) } } : undefined;
  const fig = rtFig({ names: nm, a: T.a, b: T.b, ...turn(R), lab, angA: at === 'A' ? {} : null, angB: at === 'B' ? {} : null });
  const id = (k: Side) => sideId(nm, k);
  const want = ro[role];
  const opts = (['opp', 'adj', 'hyp'] as const).map(k => ({
    t: segN(id(ro[k])), ok: k === role,
    mc: k === role ? undefined : role === 'adj' && k === 'hyp' ? MC.hypAdj : role !== 'hyp' && k !== 'hyp' ? MC.byPos : undefined,
    say: k === role ? `Right: ${segN(id(want))} is the ${ROLE_WORD[role]} for ${angN(V)}.`
      : k === 'hyp' ? `${segN(id(ro.hyp))} touches ${angN(V)}, but it is across from the right angle: it is the hypotenuse, never a leg.`
        : role === 'hyp' ? 'The hypotenuse is across from the right angle (the box), whatever angle you stand at.'
          : `Stand at ${angN(V)}: the ${role === 'opp' ? 'opposite leg is the one it does not touch' : 'adjacent leg touches it and is not the hypotenuse'}. Where it is drawn does not matter.`,
  }));
  return choice(R, {
    id: `nameSide-${n}`, family: 'nameSide',
    prompt: `In right triangle ${nm} (right angle at ${nm[2]}), which side is the <b>${ROLE_WORD[role]}</b> relative to ${angN(V)}?`,
    board: `\\text{${ROLE_WORD[role]} of } \\angle ${V}`,
    solution: [`The hypotenuse is across from the right angle at ${nm[2]}: ${segN(id(ro.hyp))}.`, `From ${angN(V)}: the adjacent leg touches ${V} (${segN(id(ro.adj))}), the opposite leg does not (${segN(id(ro.opp))}).`],
    picture: { fig, reveal: { col: roleCols(nm, at), glow: [id(want)] } },
  }, opts);
});
export const swapAngle: Gen = (R, n) => fitted('swapAngle', () => {
  const nm = letters(R), T = tripleTri(R, [1, 2, 3]);
  const k = pick(R, ['a', 'b', 'a', 'b', 'c'] as Side[]), id = sideId(nm, k);
  const [from, to] = R() < 0.5 ? (['A', 'B'] as const) : (['B', 'A'] as const);
  const roleIn = (at: 'A' | 'B') => (k === 'c' ? 'hyp' : (roleOf(at).opp === k ? 'opp' : 'adj')) as 'opp' | 'adj' | 'hyp';
  const r1 = roleIn(from), r2 = roleIn(to);
  const fig = rtFig({ names: nm, a: T.a, b: T.b, ...turn(R), lab: { a: { text: fmt(T.a) }, b: { text: fmt(T.b) }, c: { text: fmt(T.c) } }, angA: {}, angB: {} });
  const opts = (['opp', 'adj', 'hyp'] as const).map(x => ({
    t: `the ${ROLE_WORD[x]}`, ok: x === r2,
    mc: x === r2 ? undefined : x === r1 ? MC.byPos : undefined,
    say: x === r2 ? (k === 'c' ? 'Right: the hypotenuse stays the hypotenuse from both acute angles.' : `Right: from ${angN(vx(nm, to))} the legs swap names.`)
      : x === r1 ? `That is its name from ${angN(vx(nm, from))}. Opposite and adjacent depend on the angle you stand at.` : 'Only the side across from the right angle is the hypotenuse.',
  }));
  return choice(R, {
    id: `swapAngle-${n}`, family: 'swapAngle',
    prompt: `Relative to ${angN(vx(nm, from))}, ${segN(id)} is the ${ROLE_WORD[r1]}. What is ${segN(id)} relative to ${angN(vx(nm, to))}?`,
    board: `\\overline{${id}} \\text{ from } \\angle ${vx(nm, to)}`,
    solution: [`From ${angN(vx(nm, to))}: ${k === 'c' ? `${segN(id)} is across from the right angle, so it is still the hypotenuse.` : `${segN(id)} ${r2 === 'adj' ? 'touches' : 'does not touch'} ${vx(nm, to)}, so it is the ${ROLE_WORD[r2]}.`}`],
    picture: { fig, reveal: { col: roleCols(nm, to), glow: [id] } },
  }, opts, true);
});
/** a rectangle PQRS with the diagonal PR: the right triangle PQR or PSR inside it */
export const compositeSide: Gen = (R, n) => fitted('compositeSide', () => {
  const L4 = (() => { const s = letters(R) + letters(R); const u = [...new Set(s)]; if (u.length < 4) fail(); return u.slice(0, 4).sort().join(''); })();
  const [P, Q, Rr, Sx] = [...L4] as [string, string, string, string];
  const w = r(R, 5, 12), hh = r(R, 3, 8);
  if (Math.abs(w - hh) < 2) fail();
  const u = 420 / Math.hypot(w, hh);
  const pts: Record<string, [number, number]> = { [P]: [0, 0], [Q]: [w * u, 0], [Rr]: [w * u, hh * u], [Sx]: [0, hh * u] };
  // the triangle: P, R and the right-angle corner (Q or S); the marked angle at P or at R
  const corner = R() < 0.5 ? Q : Sx, other = corner === Q ? Sx : Q, atP = R() < 0.5;
  const V = atP ? P : Rr, far = atP ? Rr : P;   // the marked vertex and the other acute vertex
  const role = pick(R, ['opp', 'adj', 'hyp'] as const);
  const seg = (a: string, b: string) => [a, b].sort().join('');
  const sides = { opp: seg(far, corner), adj: seg(V, corner), hyp: seg(P, Rr) };
  // the decoy: the rectangle side parallel to the adjacent leg, in the other triangle
  const decoy = seg(other, far);
  const segs = [seg(P, Q), seg(Q, Rr), seg(Rr, Sx), seg(Sx, P), seg(P, Rr)];
  const ang = V === P ? corner + P + Rr : corner + Rr + P;
  const fig: Fig = figOf(pts, segs, { marks: [{ ang: P + corner + Rr, box: true }, { ang, n: 1 }], fills: [[P, corner, Rr].join('')] });
  const opts = [
    ...(['opp', 'adj', 'hyp'] as const).map(x => ({ t: segN(sides[x]), ok: x === role, mc: x === role ? undefined : role === 'adj' && x === 'hyp' ? MC.hypAdj : x !== 'hyp' && role !== 'hyp' ? MC.byPos : undefined, say: x === role ? 'Right.' : x === 'hyp' ? `${segN(sides.hyp)} is across from the right angle at ${corner}: the hypotenuse.` : `From ${angN(V)}: adjacent touches ${V}, opposite does not.` })),
    { t: segN(decoy), ok: false, mc: MC.byPos, say: `${segN(decoy)} is a side of the rectangle, but not of △${[P, corner, Rr].join('')}.` },
  ];
  return choice(R, {
    id: `compositeSide-${n}`, family: 'compositeSide',
    prompt: `${P}${Q}${Rr}${Sx} is a rectangle with the diagonal ${segN(P + Rr)}. In right triangle ${[P, corner, Rr].join('')}, which side is the <b>${ROLE_WORD[role]}</b> relative to the marked angle ${angN(ang)}?`,
    board: `\\triangle ${[P, corner, Rr].join('')}`,
    solution: [`Only the sides of △${[P, corner, Rr].join('')} count. The right angle is at ${corner}, so the hypotenuse is ${segN(sides.hyp)}.`, `From ${angN(V)}: adjacent ${segN(sides.adj)} (touches ${V}), opposite ${segN(sides.opp)}.`],
    picture: { fig, reveal: { col: { [sides.opp]: 'first', [sides.adj]: 'second', [sides.hyp]: 'pick' }, glow: [sides[role]] } },
  }, opts);
});

// ---------- ratio-invariance ----------
const KPAIRS: [number, number][] = [[1, 2], [1, 3], [2, 3], [1, 1.5], [1, 2.5], [2, 5], [4, 5], [2, 4.5]];   // k = 2, 3, 1.5, 2.5, 1.25, 2.25
/** two similar right triangles side by side at ONE scale: n1 with legs a1 (opposite A), b1; n2 = k times it */
export function pairFig(n1: string, n2: string, a1: number, b1: number, k: number, labs1: Partial<Record<'a' | 'b' | 'c', string>>): Fig {
  const c2 = Math.hypot(a1, b1) * k, u = 420 / c2, gap = 150;
  const dx = b1 * u + gap;
  const P: Record<string, [number, number]> = {
    [n1[0]!]: [b1 * u, 0], [n1[1]!]: [0, a1 * u], [n1[2]!]: [0, 0],
    [n2[0]!]: [dx + b1 * k * u, 0], [n2[1]!]: [dx, a1 * k * u], [n2[2]!]: [dx, 0],
  };
  const segs = [n1[1]! + n1[2]!, n1[0]! + n1[2]!, n1[0]! + n1[1]!, n2[1]! + n2[2]!, n2[0]! + n2[2]!, n2[0]! + n2[1]!];
  const labs = (['a', 'b', 'c'] as const).filter(x => labs1[x]).map(x => ({ seg: segs[x === 'a' ? 0 : x === 'b' ? 1 : 2]!, text: labs1[x]! }));
  return figOf(P, segs, { labs, marks: [{ ang: n1[0]! + n1[2]! + n1[1]!, box: true }, { ang: n2[0]! + n2[2]! + n2[1]!, box: true }, { ang: n1[1]! + n1[0]! + n1[2]!, n: 1, r: 66 }, { ang: n2[1]! + n2[0]! + n2[2]!, n: 1, r: 66 }], fills: [n1, n2] });
}
export const scaleRatio: Gen = (R, n) => fitted('scaleRatio', () => {
  const t = pick(R, TRIPLES.slice(0, 4)), [k1, k2] = pick(R, KPAIRS);
  const sw = R() < 0.5, a0 = sw ? t[0] : t[1], b0 = sw ? t[1] : t[0];
  const [n1, n2] = (() => { const s = letters(R) + letters(R); const u = [...new Set(s)]; if (u.length < 6) fail(); return [u.slice(0, 3).join(''), u.slice(3, 6).join('')]; })();
  const fn = pick(R, FNS);
  const val = fn === 'sin' ? [a0, t[2]] : fn === 'cos' ? [b0, t[2]] : [a0, b0];
  const k = k2 / k1;
  const fig = pairFig(n1, n2, a0 * k1, b0 * k1, k, { a: fmt(a0 * k1), b: fmt(b0 * k1), c: fmt(t[2] * k1) });
  const V1 = n1[0]!, V2 = n2[0]!;
  return fracR({
    id: `scaleRatio-${n}`, family: 'scaleRatio',
    prompt: `Right triangles ${n1} and ${n2} (right angles at ${n1[2]} and ${n2[2]}) have ${angN(V1)} ≅ ${angN(V2)}. Every side of ${n2} is ${fmt(k)} times the matching side of ${n1}. What is ${fn} ${V2}? Write a fraction.`,
    board: `\\${fn} ${V2} = \\,?`,
    solution: [`The triangles are similar (AA: the right angles and ${angN(V1)} ≅ ${angN(V2)}), so both sides of the ratio grow by ${fmt(k)}.`, `${fn} ${V2} = ${fn} ${V1} = ${fmt(val[0]! * k1)}/${fmt(val[1]! * k1)} = ${S(`${val[0]}/${val[1]}`)}.`],
    picture: { fig },
  }, val[0]!, val[1]!, [
    { v: (val[0]! * k) / val[1]!, mc: MC.size, say: `Both sides of the ratio grow by ${fmt(k)}, so the factor cancels: the ratio stays the same.` },
    { v: val[1]! / val[0]!, mc: MC.inverted, say: `${fn} is ${fn === 'sin' ? 'opposite over hypotenuse' : fn === 'cos' ? 'adjacent over hypotenuse' : 'opposite over adjacent'}: that one is upside down.` },
  ], 'Right: the ratio belongs to the angle, not to the size.', `Similar triangles: the same angle gives the same ${fn}. Read it from ${n1}.`);
});
export const invClaim: Gen = (R, n) => {
  const who = pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah']), v = r(R, 0, 2);
  const A0 = r(R, 22, 68), big = r(R, 2, 9), fn = pick(R, FNS);
  if (v === 0) return choice(R, {
    id: `invClaim-${n}`, family: 'invClaim',
    prompt: `${who} says: ${q(`A right triangle with ${aN(A0)}° angle and every side ${big} times longer has a bigger ${fn} ${A0}°, because its sides are longer.`)} Is that right?`,
    board: `\\${fn} ${A0}^\\circ`,
    solution: [`The two triangles share a right angle and the ${A0}° angle, so they are similar (AA).`, `Both sides of the ratio are ${big} times longer: ${big}x/${big}y = x/y. The ${fn} does not change.`],
  }, [
    { t: `No: the triangles are similar (AA), both sides of the ratio grow by ${big}, so the ratio stays the same`, ok: true, say: 'Right: the ratio belongs to the angle.' },
    { t: `Yes: the opposite and adjacent legs are ${big} times longer, so the ratio is ${big} times bigger`, ok: false, mc: MC.size, say: `The top AND the bottom of the ratio grow by ${big}, so the factor cancels.` },
    { t: `Only if the hypotenuse stays the same`, ok: false, mc: MC.size, say: 'Every side grows by the same factor; the ratio does not change at all.' },
  ]);
  if (v === 1) {
    const t = pick(R, TRIPLES.slice(0, 4)), ks = [1, 2, 3];
    return choice(R, {
      id: `invClaim-${n}`, family: 'invClaim',
      prompt: `${who} measured three right triangles with ${aN(t[0])}-${t[1]}-${t[2]} shape (sides × ${ks.join(', ')}) and found the same tangent each time, ${t[0]}/${t[1]}. ${who} says this proves every right triangle with that angle has tangent ${t[0]}/${t[1]}. Is the reasoning complete?`,
      board: `\\tan A = \\frac{${t[0]}}{${t[1]}}`,
      solution: ['Three examples cannot cover every triangle.', 'The proof: any two right triangles with the same acute angle are similar (AA), so every side is k times longer, and k cancels in the ratio.'],
    }, [
      { t: 'No: examples are not a proof; AA makes every such triangle similar, so k cancels in every ratio', ok: true, say: 'Right: the AA argument covers every size at once.' },
      { t: 'Yes: three matching examples prove it', ok: false, mc: MC.examples, say: 'Examples can show a pattern, but only the AA argument covers every triangle.' },
      { t: 'No: a bigger triangle would have a bigger tangent', ok: false, mc: MC.size, say: 'Similar triangles have equal ratios: the scale factor cancels.' },
    ]);
  }
  // symbolic pair: o, a, h and ko, ka, kh
  const ff = pick(R, FNS), top = ff === 'cos' ? 'a' : 'o', bot = ff === 'tan' ? 'a' : 'h';
  return choice(R, {
    id: `invClaim-${n}`, family: 'invClaim',
    prompt: `A right triangle has legs o (opposite ∠A) and a (adjacent to ∠A) and hypotenuse h. A similar copy has sides ko, ka and kh (k > 0). What is ${ff} A in the copy?`,
    board: `\\${ff} A = \\frac{k${top}}{k${bot}}`,
    solution: [`In the copy: ${ff} A = k${top}/k${bot}.`, `k is a common factor of the top and the bottom: k${top}/k${bot} = ${top}/${bot}, the same as in the first triangle.`],
  }, [
    { t: `${top}/${bot}`, ok: true, say: 'Right: k cancels.' },
    { t: `k${top}/${bot}`, ok: false, mc: MC.size, say: 'The bottom grows by k too: k cancels.' },
    { t: `${top}/(k${bot})`, ok: false, mc: MC.size, say: 'The top grows by k too: k cancels.' },
    { t: `${bot}/${top}`, ok: false, mc: MC.inverted, say: 'That is upside down.' },
  ]);
};
export const sameAngle: Gen = (R, n) => {
  const i = r(R, 0, 3), t0 = TRIPLES[i]!, k0 = pick(R, [1, 1, 2, 3]), t = t0.map(x => x * k0) as [number, number, number], k = pick(R, [2, 3, 1.5, 2.5, 0.5]), d = r(R, 1, 4);
  const o = TRIPLES[(i + 1 + r(R, 0, 2)) % 4]!;
  const L = (x: number[]) => `legs ${fmt(x[0]!)} and ${fmt(x[1]!)}, hypotenuse ${fmt(x[2]!)}`;
  return choice(R, {
    id: `sameAngle-${n}`, family: 'sameAngle',
    prompt: `${pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah'])}'s right triangle has legs ${t[0]} and ${t[1]} and hypotenuse ${t[2]}; its smallest angle has tangent ${t[0]}/${t[1]}. Which triangle has a smallest angle with the same tangent?`,
    board: `\\tan = \\frac{${t[0]}}{${t[1]}}`,
    solution: ['The same angle means a similar triangle: every side times one factor.', `${fmt(t[0] * k)}/${fmt(t[1] * k)} = ${t[0]}/${t[1]}, and ${fmt(t[0] * k)}² + ${fmt(t[1] * k)}² = ${fmt(t[2] * k)}².`],
  }, [
    { t: L(t.map(x => x * k)), ok: true, v: t[0] / t[1], say: `Right: every side × ${fmt(k)}.` },
    { t: L(t.map(x => x + d)), ok: false, mc: MC.additive, v: (t[0] + d) / (t[1] + d), say: `Adding ${d} to every side changes the shape (it is not even a right triangle): ${t[0] + d}/${t[1] + d} ≠ ${t[0]}/${t[1]}.` },
    { t: L(o.map(x => x * Math.max(1, Math.round((t[2] * k) / o[2])))), ok: false, v: o[0] / o[1], say: `That is ${aN(o[0])}-${o[1]}-${o[2]} shape: tangent ${o[0]}/${o[1]}, a different angle.` },
  ]);
};

// ---------- sine, cosine, tangent from a labelled triangle ----------
const RATIO_WORD: Record<Fn, string> = { sin: 'opposite / hypotenuse', cos: 'adjacent / hypotenuse', tan: 'opposite / adjacent' };
function writeRatio(fam: string, fn: Fn): Gen {
  return (R, n) => fitted(fam, () => {
    const nm = letters(R), at: 'A' | 'B' = R() < 0.5 ? 'A' : 'B', V = vx(nm, at), ro = roleOf(at);
    let T = tripleTri(R, [1, 2, 3, 4]);
    const iso = fn === 'tan' && R() < 0.2;
    if (iso) { const k = r(R, 2, 9); T = { a: k, b: k, c: k * Math.SQRT2 }; }
    const len = (s: Side) => T[s];
    const lab = { a: { text: fmt(T.a) }, b: { text: fmt(T.b) }, c: { text: iso ? `${fmt(T.a)}√2` : fmt(T.c) } };
    const fig = rtFig({ names: nm, a: T.a, b: T.b, ...turn(R), lab, angA: at === 'A' ? {} : null, angB: at === 'B' ? {} : null });
    const top = fn === 'cos' ? ro.adj : ro.opp, bot = fn === 'tan' ? ro.adj : ro.hyp;
    const N = len(top), D = len(bot);
    const opp = len(ro.opp), adj = len(ro.adj), hyp = len(ro.hyp);
    const wrong = [
      { v: D / N, mc: MC.inverted, say: `${fn} is ${RATIO_WORD[fn]}: that one is upside down.` },
      ...(fn !== 'sin' ? [{ v: opp / hyp, mc: MC.byPos, say: `That is opposite / hypotenuse (sine). From ${angN(V)}, which leg touches it?` }] : []),
      ...(fn !== 'cos' ? [{ v: adj / hyp, mc: MC.byPos, say: `That is adjacent / hypotenuse (cosine). The opposite leg is the one ${angN(V)} does not touch.` }] : []),
      ...(fn !== 'tan' ? [{ v: opp / adj, mc: MC.habit, say: 'That is opposite / adjacent (tangent).' }] : []),
      ...(fn === 'cos' ? [{ v: hyp / adj, mc: MC.hypAdj, say: 'The hypotenuse is never a leg, and it goes in the denominator of cosine.' }] : []),
    ];
    if (iso) return fracR({
      id: `${fam}-${n}`, family: fam,
      prompt: `What is tan ${V}? Write a fraction (or a whole number).`, board: `\\tan ${V} = \\,?`,
      solution: [`From ${angN(V)}: opposite ${fmt(opp)}, adjacent ${fmt(adj)}.`, `tan ${V} = ${fmt(opp)}/${fmt(adj)} = ${S('1')}: the legs are equal, so the angle is 45°.`],
      picture: { fig, reveal: { col: roleCols(nm, at) } },
    }, 1, 1, wrong.filter(w => Math.abs(w.v - 1) > 1e-9), 'Right: equal legs, tan 45° = 1.', 'Tangent is opposite / adjacent.');
    return fracR({
      id: `${fam}-${n}`, family: fam,
      prompt: `What is ${fn} ${V}? Write it as a fraction.`, board: `\\${fn} ${V} = \\,?`,
      solution: [`From ${angN(V)}: opposite ${fmt(opp)}, adjacent ${fmt(adj)}, hypotenuse ${fmt(hyp)}.`, `${fn} ${V} = ${RATIO_WORD[fn]} = ${S(`${fmt(N)}/${fmt(D)}`)}.`],
      picture: { fig, reveal: { col: roleCols(nm, at), glow: [sideId(nm, top), sideId(nm, bot)] } },
    }, N, D, wrong, `Right: ${RATIO_WORD[fn]}.`, `${fn} is ${RATIO_WORD[fn]}, named from ${angN(V)}.`);
  });
}
export const writeSin = writeRatio('writeSin', 'sin');
export const writeCos = writeRatio('writeCos', 'cos');
export const writeTan = writeRatio('writeTan', 'tan');
export const sinVar: Gen = (R, n) => fitted('sinVar', () => {
  const nm = letters(R), at: 'A' | 'B' = R() < 0.5 ? 'A' : 'B', V = vx(nm, at), ro = roleOf(at);
  const vs = pick(R, [['p', 'q', 'r'], ['x', 'y', 'z'], ['m', 'n', 'k'], ['d', 'e', 'f'], ['s', 't', 'w']]).slice();
  for (let i = 2; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [vs[i], vs[j]] = [vs[j]!, vs[i]!]; }
  const name: Record<Side, string> = { a: vs[0]!, b: vs[1]!, c: vs[2]! };
  const legA = r(R, 3, 8), legB = r(R, 3, 8);
  if (Math.abs(legA - legB) < 1 || Math.max(legA, legB) / Math.min(legA, legB) > 2.4) fail();
  const fn = pick(R, FNS);
  const fig = rtFig({ names: nm, a: legA, b: legB, ...turn(R), lab: { a: { text: name.a }, b: { text: name.b }, c: { text: name.c } }, angA: at === 'A' ? {} : null, angB: at === 'B' ? {} : null });
  const o = name[ro.opp], a = name[ro.adj], h = name[ro.hyp];
  const right = fn === 'sin' ? `${o}/${h}` : fn === 'cos' ? `${a}/${h}` : `${o}/${a}`;
  const all = [
    { t: `${o}/${h}`, f: 'sin' as Fn }, { t: `${a}/${h}`, f: 'cos' as Fn }, { t: `${o}/${a}`, f: 'tan' as Fn },
    { t: fn === 'tan' ? `${a}/${o}` : fn === 'sin' ? `${h}/${o}` : `${h}/${a}`, f: null },
  ];
  return choice(R, {
    id: `sinVar-${n}`, family: 'sinVar',
    prompt: `The sides are ${name.a}, ${name.b} and ${name.c}. Which ratio is ${fn} ${V}?`, board: `\\${fn} ${V} = \\,?`,
    solution: [`From ${angN(V)}: opposite ${o}, adjacent ${a}, hypotenuse ${h}.`, `${fn} = ${RATIO_WORD[fn]} = ${right}.`],
    picture: { fig, reveal: { col: roleCols(nm, at) } },
  }, all.map(x => ({ t: x.t, ok: x.t === right, mc: x.t === right ? undefined : x.f === null ? MC.inverted : (fn === 'tan' || x.f === 'tan') ? MC.habit : MC.byPos, say: x.t === right ? 'Right.' : x.f ? `${x.t} is ${x.f} ${V}.` : 'That one is upside down.' })));
});
/** decimal sides with a terminating cosine (3-4-5 and 7-24-25 shapes) */
export const cosDec: Gen = (R, n) => fitted('cosDec', () => {
  const nm = letters(R), at: 'A' | 'B' = R() < 0.5 ? 'A' : 'B', V = vx(nm, at), ro = roleOf(at);
  const t = pick(R, [[3, 4, 5], [7, 24, 25]] as const), k = pick(R, [0.5, 1.5, 2.5, 0.4, 1.2, 0.6]);
  const sw = R() < 0.5, T = { a: (sw ? t[0] : t[1]) * k, b: (sw ? t[1] : t[0]) * k, c: t[2] * k };
  const fig = rtFig({ names: nm, a: T.a, b: T.b, ...turn(R), lab: { a: { text: fmt(T.a) }, b: { text: fmt(T.b) }, c: { text: fmt(T.c) } }, angA: at === 'A' ? {} : null, angB: at === 'B' ? {} : null });
  const adj = T[ro.adj], opp = T[ro.opp], hyp = T[ro.hyp], v = Math.round((adj / hyp) * 1e6) / 1e6;
  return numX({
    id: `cosDec-${n}`, family: 'cosDec',
    prompt: `What is cos ${V}? Write it as a decimal.`, board: `\\cos ${V} = \\,?`,
    solution: [`From ${angN(V)}: adjacent ${fmt(adj)}, hypotenuse ${fmt(hyp)}.`, `cos ${V} = ${fmt(adj)} ÷ ${fmt(hyp)} = ${S(String(v))}.`],
    picture: { fig, reveal: { col: roleCols(nm, at), glow: [sideId(nm, ro.adj), sideId(nm, ro.hyp)] } },
  }, v, [
    { v: opp / hyp, mc: MC.byPos, say: `That is the opposite leg over the hypotenuse. The adjacent leg touches ${angN(V)}.` },
    { v: hyp / adj, mc: MC.inverted, say: 'Upside down: a cosine is never more than 1.' },
    { v: opp / adj, mc: MC.habit, say: 'That is opposite / adjacent (tangent).' },
  ], 'Right: adjacent / hypotenuse.', `cos = adjacent / hypotenuse, named from ${angN(V)}.`);
});
/** which of the six ratios of the triangle has this value */
export const sohMix: Gen = (R, n) => fitted('sohMix', () => {
  const nm = letters(R), T = tripleTri(R, [1, 2]);
  const fig = rtFig({ names: nm, a: T.a, b: T.b, ...turn(R), lab: { a: { text: fmt(T.a) }, b: { text: fmt(T.b) }, c: { text: fmt(T.c) } }, angA: {}, angB: {} });
  const val = (f: Fn, at: 'A' | 'B') => { const ro = roleOf(at); const o = T[ro.opp], a = T[ro.adj], h = T[ro.hyp]; return f === 'sin' ? [o, h] : f === 'cos' ? [a, h] : [o, a]; };
  const all = (['A', 'B'] as const).flatMap(at => FNS.map(f => ({ f, at, q: val(f, at) })));
  const right = pick(R, all);
  const rv = right.q[0]! / right.q[1]!;
  return choice(R, {
    id: `sohMix-${n}`, family: 'sohMix',
    prompt: `Which ratio equals ${fmt(right.q[0]!)}/${fmt(right.q[1]!)}?`, board: `\\frac{${fmt(right.q[0]!)}}{${fmt(right.q[1]!)}}`,
    solution: [`${fmt(right.q[0]!)} and ${fmt(right.q[1]!)}: find the angle for which these sides are ${right.f === 'sin' ? 'opposite and hypotenuse' : right.f === 'cos' ? 'adjacent and hypotenuse' : 'opposite and adjacent'}.`, `That is ${right.f} ${vx(nm, right.at)}.`],
    picture: { fig, reveal: { col: roleCols(nm, right.at) } },
  }, all.map(x => ({ t: `${x.f} ${vx(nm, x.at)}`, ok: x === right, v: x.q[0]! / x.q[1]!, mc: x === right ? undefined : Math.abs(x.q[1]! / x.q[0]! - rv) < 1e-9 ? MC.inverted : MC.byPos, say: x === right ? 'Right.' : `${x.f} ${vx(nm, x.at)} = ${fmt(x.q[0]!)}/${fmt(x.q[1]!)}.` })));
});

// ---------- ratio-bounds ----------
export const possible: Gen = (R, n) => {
  const who = pick(R, ['Lena', 'Omar', 'Priya', 'Kai', 'Sofia', 'Mateo', 'Ava', 'Noah', 'Jada', 'Eli']), v = r(R, 0, 4);
  const fn = pick(R, ['sin', 'cos'] as const);
  const base = { id: `possible-${n}`, family: 'possible', board: '0^\\circ < A < 90^\\circ' };
  const IMP = `Impossible: the hypotenuse is the longest side, so ${fn} A is less than 1`;
  if (v === 0) { const x = (r(R, 105, 190) / 100); return choice(R, { ...base, prompt: `${who} reports ${fn} A = ${fmt(x)} for an acute angle A of a right triangle. Possible?`, solution: [`${fn} A = ${fn === 'sin' ? 'opposite' : 'adjacent'} / hypotenuse, and a leg is always shorter than the hypotenuse.`, `So 0 < ${fn} A < 1, and ${fmt(x)} is impossible.`] }, [
    { t: IMP, ok: true, say: 'Right: a leg over the longest side is less than 1.' },
    { t: 'Possible, in a big enough triangle', ok: false, mc: MC.size, say: 'Size never changes a ratio, and the hypotenuse is always the longest side.' },
    { t: 'Possible, if A is close to 90°', ok: false, say: 'Even close to 90° the leg is shorter than the hypotenuse.' },
  ]); }
  if (v === 1) { const x = r(R, 12, 60) / 10; return choice(R, { ...base, prompt: `${who} reports tan A = ${fmt(x)} for an acute angle A of a right triangle. Possible?`, solution: ['tan A = opposite / adjacent: two legs, and either can be longer.', `A tall triangle has tan A above 1, so ${fmt(x)} is possible (A is above 45°).`] }, [
    { t: 'Possible: the opposite leg can be longer than the adjacent leg', ok: true, say: 'Right: tangent has no upper limit.' },
    { t: 'Impossible: like sine, a tangent is at most 1', ok: false, mc: MC.tanBounded, say: 'Tangent divides a leg by a leg, not by the hypotenuse; it can be any positive number.' },
    { t: 'Impossible: only a big triangle has a tangent above 1', ok: false, mc: MC.size, say: 'Size does not matter; the angle does.' },
  ]); }
  if (v === 2) { const x = r(R, 12, 92) / 100; return choice(R, { ...base, prompt: `${who} reports ${fn} A = ${fmt(x)} for an acute angle A of a right triangle. Possible?`, solution: [`${fn} A is a leg over the hypotenuse: between 0 and 1.`, `${fmt(x)} is between 0 and 1, so it is possible.`] }, [
    { t: 'Possible: it is between 0 and 1', ok: true, say: 'Right.' },
    { t: 'Impossible: a ratio of an acute angle must be above 1', ok: false, mc: MC.size, say: 'A leg over the hypotenuse is always below 1.' },
    { t: `Impossible: ${fn} of an acute angle is a whole number`, ok: false, mc: MC.units, say: 'A ratio of two lengths can be any fraction.' },
  ]); }
  if (v === 3) return choice(R, { ...base, prompt: `${who} reports tan A = 1 for an acute angle A of a right triangle. Possible?`, solution: ['tan A = 1: opposite = adjacent, so the legs are equal.', 'That is the 45-45-90 triangle: possible, A = 45°.'] }, [
    { t: 'Possible: the legs are equal and A = 45°', ok: true, say: 'Right.' },
    { t: 'Impossible: only sin 90° equals 1', ok: false, mc: MC.tanBounded, say: 'Tangent compares the two legs; equal legs give 1.' },
    { t: 'Impossible: a right triangle cannot have two equal legs', ok: false, say: 'Two equal legs are fine: the isosceles right triangle.' },
  ]);
  return choice(R, { ...base, prompt: `${who} reports ${fn} A = 1 for an acute angle A of a right triangle. Possible?`, solution: [`${fn} A = 1 would need a leg as long as the hypotenuse.`, 'The hypotenuse is always the longest side, so it is impossible for an acute angle.'] }, [
    { t: `Impossible: a leg would be as long as the hypotenuse`, ok: true, say: 'Right.' },
    { t: 'Possible: the legs are equal', ok: false, mc: MC.tanBounded, say: `Equal legs give tan = 1, not ${fn} = 1.` },
    { t: 'Possible, in a large enough triangle', ok: false, mc: MC.size, say: 'Size never changes a ratio.' },
  ]);
};
export const whichPossible: Gen = (R, n) => {
  const fn = pick(R, FNS), V = letters(R)[0]!;
  if (fn === 'tan') {
    const x = r(R, 11, 59) / 10;
    return choice(R, { id: `whichPossible-${n}`, family: 'whichPossible', prompt: `${V} is an acute angle of a right triangle. Which value could be tan ${V}?`, board: `\\tan ${V} = \\,?`, solution: ['tan A = opposite / adjacent: positive, and with no upper limit.', `So ${fmt(x)} works; 0 and negative numbers do not.`] }, [
      { t: fmt(x), ok: true, say: 'Right: a tall triangle.' },
      { t: `−${fmt(r(R, 2, 9) / 10)}`, ok: false, say: 'Lengths are positive, so the ratio is positive.' },
      { t: '0', ok: false, say: 'The opposite leg would have length 0.' },
      { t: 'None: tan A is at most 1', ok: false, mc: MC.tanBounded, say: 'Tangent can exceed 1: the opposite leg can be the longer leg.' },
    ], true);
  }
  const x = r(R, 15, 95) / 100, big = r(R, 105, 180) / 100;
  return choice(R, { id: `whichPossible-${n}`, family: 'whichPossible', prompt: `${V} is an acute angle of a right triangle. Which value could be ${fn} ${V}?`, board: `\\${fn} ${V} = \\,?`, solution: [`${fn} A = leg / hypotenuse, and a leg is shorter than the hypotenuse.`, `So 0 < ${fn} A < 1: only ${fmt(x)} works.`] }, [
    { t: fmt(x), ok: true, say: 'Right.' },
    { t: fmt(big), ok: false, mc: MC.size, say: 'A leg over the hypotenuse is always below 1.' },
    { t: '1', ok: false, say: 'A leg would be as long as the hypotenuse.' },
    { t: `−${fmt(r(R, 2, 9) / 10)}`, ok: false, say: 'Lengths are positive.' },
  ]);
};

// ---------- ratio-covariation ----------
export const compareRatio: Gen = (R, n) => fitted('compareRatio', () => compareRatio0(R, n));
const compareRatio0: Gen = (R, n) => {
  const x = r(R, 1, 7) * 10 + pick(R, [0, 0, 5]), y = r(R, 1, 8) * 10;
  if (Math.abs(x - y) < 10 || y > 85 || x > 85) return compareRatio0(R, n);
  const lo = Math.min(x, y), hi = Math.max(x, y), fn = pick(R, FNS);
  const big = fn === 'cos' ? lo : hi;
  const nm = (letters(R) + letters(R)).split('').filter((c, i, a) => a.indexOf(c) === i);
  if (nm.length < 6 || (fn === 'tan' && hi > 72)) return compareRatio0(R, n);
  const tri = (d: number) => (fn === 'tan' ? { a: tanD(d), b: 1 } : { a: sinD(d), b: cosD(d) });
  const t1 = tri(x), t2 = tri(y), n1 = nm.slice(0, 3).join(''), n2 = nm.slice(3, 6).join('');
  const sc = 420 / Math.max(Math.hypot(t1.a, t1.b), Math.hypot(t2.a, t2.b)), dx = t1.b * sc + 170;
  const P: Record<string, [number, number]> = { [n1[0]!]: [t1.b * sc, 0], [n1[1]!]: [0, t1.a * sc], [n1[2]!]: [0, 0], [n2[0]!]: [dx + t2.b * sc, 0], [n2[1]!]: [dx, t2.a * sc], [n2[2]!]: [dx, 0] };
  const segs = [n1[1]! + n1[2]!, n1[0]! + n1[2]!, n1[0]! + n1[1]!, n2[1]! + n2[2]!, n2[0]! + n2[2]!, n2[0]! + n2[1]!];
  const same = fn === 'tan' ? '1' : '1';
  const fig = figOf(P, segs, { labs: fn === 'tan' ? [{ seg: segs[1]!, text: same }, { seg: segs[4]!, text: same }] : [{ seg: segs[2]!, text: same }, { seg: segs[5]!, text: same }],
    marks: [{ ang: n1[0]! + n1[2]! + n1[1]!, box: true }, { ang: n2[0]! + n2[2]! + n2[1]!, box: true }, { ang: n1[1]! + n1[0]! + n1[2]!, n: 1, text: `${x}°`, lone: true }, { ang: n2[1]! + n2[0]! + n2[2]!, n: 2, text: `${y}°`, lone: true }], fills: [n1, n2] });
  const why = fn === 'sin' ? 'With the hypotenuse fixed, the opposite leg grows as the angle grows: sine increases.'
    : fn === 'cos' ? 'With the hypotenuse fixed, the adjacent leg shrinks as the angle grows: cosine decreases.'
      : 'With the adjacent leg fixed, the opposite leg grows (without limit) as the angle grows: tangent increases.';
  return choice(R, {
    id: `compareRatio-${n}`, family: 'compareRatio',
    prompt: `Without a calculator: which is greater, ${fn} ${x}° or ${fn} ${y}°?`, board: `\\${fn} ${x}^\\circ \\ \\text{or}\\ \\${fn} ${y}^\\circ`,
    solution: [why, `So ${fn} ${big}° is greater.`],
    picture: { fig, reveal: { glow: fn === 'cos' ? [segs[1]!, segs[4]!] : [segs[0]!, segs[3]!] } },
  }, [
    { t: `${fn} ${x}°`, ok: big === x, mc: big === x ? undefined : fn === 'tan' ? MC.tanLikeCos : undefined, say: big === x ? 'Right.' : why },
    { t: `${fn} ${y}°`, ok: big === y, mc: big === y ? undefined : fn === 'tan' ? MC.tanLikeCos : undefined, say: big === y ? 'Right.' : why },
    { t: 'They are equal', ok: false, say: 'Different acute angles give different ratios.' },
  ], true);
};
export const doubleClaim: Gen = (R, n) => {
  const fn = pick(R, FNS), x = pick(R, [10, 15, 20, 25, 30, 35, 40]), who = pick(R, ['Kai', 'Mia', 'Ravi', 'Zoe', 'Theo', 'Nia']);
  const v1 = fnD[fn](x), v2 = fnD[fn](2 * x), dbl = 2 * v1;
  const rel = v2 < dbl - 1e-9 ? 'less' : 'more';
  return choice(R, {
    id: `doubleClaim-${n}`, family: 'doubleClaim',
    prompt: `${who} says doubling the angle doubles its ${fn === 'sin' ? 'sine' : fn === 'cos' ? 'cosine' : 'tangent'}. Use the values: ${fn} ${x}° ≈ ${v1.toFixed(4)} and ${fn} ${2 * x}° ≈ ${v2.toFixed(4)}.`,
    board: `\\${fn} ${2 * x}^\\circ \\ \\text{vs}\\ 2 \\cdot \\${fn} ${x}^\\circ`,
    solution: [`2 × ${fn} ${x}° ≈ ${dbl.toFixed(4)}, but ${fn} ${2 * x}° ≈ ${v2.toFixed(4)}.`, `The ratio is not proportional to the angle: here it is ${rel} than double.`],
    picture: { card: { lines: [`${fn} ${x}° ≈ ${v1.toFixed(4)}`, `${fn} ${2 * x}° ≈ ${v2.toFixed(4)}`, `${who}: “double the angle, double the ${fn}”`] } },
  }, [
    { t: `Yes: ${fn} ${2 * x}° is exactly double`, ok: false, mc: MC.pullOut, say: `2 × ${v1.toFixed(4)} = ${dbl.toFixed(4)}, not ${v2.toFixed(4)}.` },
    { t: `No: ${fn} ${2 * x}° is less than double`, ok: rel === 'less', say: rel === 'less' ? 'Right.' : `Compare ${v2.toFixed(4)} with ${dbl.toFixed(4)}.` },
    { t: `No: ${fn} ${2 * x}° is more than double`, ok: rel === 'more', say: rel === 'more' ? 'Right.' : `Compare ${v2.toFixed(4)} with ${dbl.toFixed(4)}.` },
  ], true);
};

// ---------- cofunction ----------
export const cofMissing: Gen = (R, n) => {
  const y = r(R, 12, 78);
  if (y === 45) return cofMissing(R, n);
  const [f1, f2] = R() < 0.5 ? ['sin', 'cos'] : ['cos', 'sin'];
  return numX({
    id: `cofMissing-${n}`, family: 'cofMissing',
    prompt: `x is an acute angle and ${f1} x = ${f2} ${y}°. Find x in degrees.`, board: `\\${f1} x = \\${f2} ${y}^\\circ`, unit: '°',
    solution: [`In a right triangle the two acute angles add to 90°, and the side opposite one is adjacent to the other: ${f1} x = ${f2}(90° − x).`, `So x = 90° − ${y}° = ${S(90 - y)}°.`],
    picture: { card: { lines: [`${f1} x = ${f2} ${y}°`, 'x is acute'] } },
  }, 90 - y, [
    { v: y, mc: MC.cofMisuse, say: `${f1} and ${f2} of the SAME angle are equal only at 45°. They match for complementary angles.` },
    { v: 180 - y, mc: MC.cofNoComp, say: 'The angles must add to 90° (complementary), not 180°.' },
  ], 'Right: complementary angles.', 'The two angles must add to 90°.');
};
export const cofMatch: Gen = (R, n) => {
  const x = r(R, 12, 78);
  if (x === 45 || x % 5 === 0 && R() < 0.3) return cofMatch(R, n);
  const f = pick(R, ['sin', 'cos'] as const), g = f === 'sin' ? 'cos' : 'sin';
  const val = (h: Fn, d: number) => fnD[h](d);
  return choice(R, {
    id: `cofMatch-${n}`, family: 'cofMatch',
    prompt: `Without a calculator: which equals ${f} ${x}°?`, board: `\\${f} ${x}^\\circ`,
    solution: [`${f} of an angle = ${g} of its complement.`, `90° − ${x}° = ${90 - x}°, so ${f} ${x}° = ${g} ${90 - x}°.`],
  }, [
    { t: `${g} ${90 - x}°`, ok: true, v: val(g, 90 - x), say: 'Right: complementary angles.' },
    { t: `${g} ${x}°`, ok: false, v: val(g, x), mc: MC.cofMisuse, say: `${f} and ${g} of the same angle are equal only at 45°.` },
    { t: `${f} ${90 - x}°`, ok: false, v: val(f, 90 - x), mc: MC.cofNoComp, say: `The complement goes with the OTHER function: ${g}.` },
    { t: `tan ${90 - x}°`, ok: false, v: val('tan', 90 - x), mc: MC.cofNoComp, say: 'The co-function of sine is cosine, not tangent.' },
  ]);
};
export const cofTri: Gen = (R, n) => {
  const nm = letters(R), v = r(R, 12, 96) / 100;
  if (Math.abs(v - Math.SQRT1_2) < 0.02) return cofTri(R, n);
  const f = pick(R, ['sin', 'cos'] as const), g = f === 'sin' ? 'cos' : 'sin';
  const A = nm[0]!, Bv = nm[1]!;
  return numX({
    id: `cofTri-${n}`, family: 'cofTri',
    prompt: `In right triangle ${nm}, the right angle is at ${nm[2]}. ${f} ${A} = ${fmt(v)}. What is ${g} ${Bv}?`, board: `\\${f} ${A} = ${fmt(v)},\\ \\${g} ${Bv} = \\,?`,
    solution: [`The side opposite ${angN(A)} is the side adjacent to ${angN(Bv)}, and both use the same hypotenuse.`, `So ${g} ${Bv} = ${f} ${A} = ${S(fmt(v))}.`],
    picture: { card: { lines: [`right angle at ${nm[2]}`, `${f} ${A} = ${fmt(v)}`, `${g} ${Bv} = ?`] } },
  }, v, [
    { v: Math.sqrt(1 - v * v), mc: MC.cofNoComp, say: `That would be ${g} ${A}. ${angN(A)} and ${angN(Bv)} are complementary, so ${g} ${Bv} = ${f} ${A}.` },
    { v: 1 / v, mc: MC.inverted, say: 'A sine or cosine is never above 1.' },
    { v: 1 - v, mc: MC.cofMisuse, say: 'The two ratios are equal, they do not add to 1.' },
  ], 'Right: same side over the same hypotenuse.', `The side opposite ${A} is adjacent to ${Bv}.`);
};

void cosD; void sinD; void tanD;
export type { GFItem };
