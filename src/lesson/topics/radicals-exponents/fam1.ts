// fam1.ts: stage 1 and the exponent laws. Roots, a^(1/n), a^(m/n), negative rational exponents, notation, and the
// product / quotient / power rules with rational exponents. Pure: no DOM.
import { fr, int, pick } from '../../runtime/item';
import { ans } from '../../runtime/explain';
import { type Base, type Gen, type LadderPic, MC, type Opt, choiceItem, fracItem, near, numItem, pairItem, uniq } from './common';
import { expH, expT, gcd, iH, iT, ipow, powQ, q, qH, qT, red, rootH, rootT, sameFrac, V, varH, varT } from './rad';

const WORD: Record<number, string> = { 2: 'square', 3: 'cube', 4: 'fourth power', 5: 'fifth power', 6: 'sixth power' };
const ROOTWORD: Record<number, string> = { 2: 'square root', 3: 'cube root', 4: 'fourth root', 5: 'fifth root', 6: 'sixth root' };
/** an integer power written in HTML: (−3)<sup>3</sup> */
const ipH = (b: number, e: number) => `${b < 0 ? `(${iH(b)})` : iH(b)}<sup>${e}</sup>`;
const ipT = (b: number, e: number) => `${b < 0 ? `(${iT(b)})` : iT(b)}^{${e}}`;
/** a^(k/n) for every tick of a ladder whose value is a rational number (TeX) */
function ladderValues(a: number, n: number, lo: number, hi: number): { k: number; tex: string }[] {
  const out: { k: number; tex: string }[] = [];
  for (let k = lo; k <= hi; k++) { const v = powQ(q(a), k, n); if (v.kind === 'value') out.push({ k, tex: qT(v.v) }); }
  return out;
}
/** the hop factor a^(1/n) as TeX when it is rational */
function hopFactor(a: number, n: number): string | undefined { const v = powQ(q(a), 1, n); return v.kind === 'value' ? `\\times ${qT(v.v)}` : undefined; }
export function ladder(a: number, n: number, lo: number, hi: number, ask: number | undefined, extra: Partial<LadderPic> = {}): LadderPic | undefined {
  if (hi - lo + 1 > 9 || hi - lo < 1) return undefined;
  const known = [{ k: 0, tex: '1' }, { k: n, tex: iT(a) }].filter(t => t.k >= lo && t.k <= hi && t.k !== ask);
  return { base: iT(a), n, lo, hi, known, ask, ...extra, reveal: { values: ladderValues(a, n, lo, hi), factor: hopFactor(a, n) } };
}

// ===================== nth-roots =====================
const ROOTS: Record<number, number[]> = { 2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3: [2, 3, 4, 5], 4: [2, 3], 5: [2, 3] };
export const rootEval: Gen = (R, n) => {
  const idx = pick(R, [2, 2, 3, 3, 4, 5]);
  let r = pick(R, ROOTS[idx]!);
  if (R() < 0.1) r = pick(R, [0, 1]);
  const neg = idx % 2 === 1 && r > 1 && R() < 0.5;
  const root = neg ? -r : r, a = ipow(root, idx);
  const base: Base = {
    id: `rootEval-${n}`, family: 'rootEval',
    prompt: `Find the exact value of ${rootH(idx, iH(a))}, without a calculator.${idx % 2 === 0 ? ' The root sign means the principal root: the one that is not negative.' : ''}`,
    board: `${rootT(idx, iT(a))} = \\,?`,
    solution: [`Which number has ${WORD[idx]} ${iH(a)}? ${ipH(root, idx)} = ${iH(a)}.`, `So ${rootH(idx, iH(a))} = ${ans(iH(root))}.`],
    picture: a >= 2 ? { ladder: ladder(a, idx, 0, idx, 1) } : undefined,
  };
  return numItem(base, root, v => {
    if (v === root) return { ok: true, say: `Yes: ${ipH(root, idx)} = ${iH(a)}.` };
    if (idx % 2 === 0 && v === -root && root > 0) return { ok: false, mc: MC.everyPM, say: `${ipH(-root, idx)} is ${iH(a)} too, but the root sign names one number: the principal root, which is not negative. ${rootH(idx, iH(a))} = ${root}.` };
    if (idx % 2 === 1 && v === -root && root !== 0) return { ok: false, mc: MC.dropsSign, say: `Check the sign: ${ipH(v, idx)} = ${iH(-a)}, not ${iH(a)}. An odd power keeps the sign, so an odd root does too.` };
    if (a !== 0 && (v === a * idx)) return { ok: false, mc: MC.indexMult, say: `The small ${idx} is the index, not a factor: ${rootH(idx, iH(a))} asks which number has ${WORD[idx]} ${iH(a)}.` };
    if (a !== 0 && near(v, a / idx, 0.01)) return { ok: false, mc: MC.divIndex, say: `A root is not a division by the index. Which number, used ${idx} times as a factor, gives ${iH(a)}?` };
    return { ok: false, say: `Which number, used ${idx} times as a factor, gives ${iH(a)}? Try small numbers: ${ipH(r || 2, idx)} = ${iH(ipow(r || 2, idx))}.` };
  });
};

export const rootReal: Gen = (R, n) => {
  const kind = pick(R, ['evenNeg', 'evenNeg', 'oddNeg', 'oddNeg', 'small'] as const);
  const NR = 'not a real number';
  if (kind === 'small') {
    const idx = pick(R, [2, 3, 4, 5]), a = pick(R, [0, 1]);
    const base: Base = { id: `rootReal-${n}`, family: 'rootReal', prompt: `What is ${rootH(idx, a)}?`, board: `${rootT(idx, a)} = \\,?`, solution: [`The ${ROOTWORD[idx]} of ${a}: which number has ${WORD[idx]} ${a}?`, `${a}<sup>${idx}</sup> = ${a}, so ${rootH(idx, a)} = ${ans(a)}.`] };
    return choiceItem(R, base, uniq([
      { t: String(a), ok: true, say: `Yes: ${a}<sup>${idx}</sup> = ${a}.` },
      { t: String(1 - a), say: `${1 - a}<sup>${idx}</sup> = ${1 - a}, not ${a}.` },
      { t: NR, say: `${a}<sup>${idx}</sup> = ${a}: the root is a real number, ${a}.` },
      { t: String(idx * a || idx), mc: a ? MC.indexMult : undefined, say: `The index ${idx} is not a factor. Which number has ${WORD[idx]} ${a}?` },
    ]));
  }
  const idx = kind === 'evenNeg' ? pick(R, [2, 2, 2, 4]) : pick(R, [3, 3, 3, 5]);
  const r = pick(R, ROOTS[idx]!.filter(x => x > 1)), a = -ipow(r, idx);
  const base: Base = {
    id: `rootReal-${n}`, family: 'rootReal', prompt: `What is ${rootH(idx, iH(a))}? Pick the exact value, or say that it is not a real number.`, board: `${rootT(idx, iT(a))} = \\,?`,
    solution: kind === 'evenNeg'
      ? [`An even power is never negative: ${ipH(r, idx)} = ${ipow(r, idx)} and ${ipH(-r, idx)} = ${ipow(r, idx)}.`, `No real number has ${WORD[idx]} ${iH(a)}: ${ans(NR)}.`]
      : [`An odd power keeps the sign: ${ipH(-r, idx)} = ${iH(a)}.`, `So ${rootH(idx, iH(a))} = ${ans(iH(-r))}.`],
  };
  const opts: Opt[] = kind === 'evenNeg' ? [
    { t: NR, ok: true, say: `Right: every real number to an even power is 0 or positive, so nothing has ${WORD[idx]} ${iH(a)}.` },
    { t: iH(-r), mc: MC.sqrtNegNeg, say: `${ipH(-r, idx)} = ${ipow(r, idx)}, not ${iH(a)}: an even power of a negative number is positive.` },
    { t: String(r), say: `${ipH(r, idx)} = ${ipow(r, idx)}, not ${iH(a)}.` },
    { t: `±${r}`, mc: MC.everyPM, say: `Both ${r} and ${iH(-r)} have ${WORD[idx]} ${ipow(r, idx)}, not ${iH(a)}. No real number works.` },
  ] : [
    { t: iH(-r), ok: true, say: `Yes: ${ipH(-r, idx)} = ${iH(a)}. An odd root of a negative number is a real, negative number.` },
    { t: String(r), mc: MC.dropsSign, say: `${ipH(r, idx)} = ${ipow(r, idx)}, not ${iH(a)}. The sign stays: ${iH(-r)}.` },
    { t: NR, mc: MC.oddNegUndef, say: `An odd power keeps the sign, so ${ipH(-r, idx)} = ${iH(a)}: the root exists.` },
    { t: `±${r}`, mc: MC.pmOdd, say: `${ipH(r, idx)} is positive, so only ${iH(-r)} works. An odd root has exactly one real value.` },
  ];
  return choiceItem(R, base, opts);
};

// ===================== unit-fraction-exponent =====================
const UNIT: Record<number, number[]> = { 2: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3: [2, 3, 4, 5, 6], 4: [2, 3, 4], 5: [2, 3] };
export const unitEval: Gen = (R, n) => {
  const k = pick(R, [2, 3, 3, 4, 5]), r = pick(R, UNIT[k]!), a = ipow(r, k);
  const base: Base = {
    id: `unitEval-${n}`, family: 'unitEval', prompt: `Evaluate ${a}<sup>1/${k}</sup> exactly, without a calculator.`, board: `${a}^{\\frac{1}{${k}}} = \\,?`,
    solution: [`${a}<sup>1/${k}</sup> is the ${ROOTWORD[k]} of ${a}: the number whose ${WORD[k]} is ${a}.`, `${r}<sup>${k}</sup> = ${a}, so ${a}<sup>1/${k}</sup> = ${ans(r)}.`],
    picture: { ladder: ladder(a, k, 0, k, 1) },
  };
  return numItem(base, r, v => {
    if (v === r) return { ok: true, say: `Yes: ${r}<sup>${k}</sup> = ${a}, so ${a}<sup>1/${k}</sup> = ${rootH(k, a)} = ${r}.` };
    if (near(v, a / k, 0.01)) return { ok: false, mc: MC.baseTimesExp, say: `${a}<sup>1/${k}</sup> is not ${a} × ${fr(1, k)}. ${k} equal hops of the exponent make one whole step (× ${a}), so each hop is the ${ROOTWORD[k]} of ${a}.` };
    if (v === -r) return { ok: false, mc: MC.negMakesNeg, say: `The exponent ${fr(1, k)} is positive; the value is the positive ${ROOTWORD[k]}.` };
    return { ok: false, say: `(${a}<sup>1/${k}</sup>)<sup>${k}</sup> = ${a}<sup>1</sup> = ${a}. Which number has ${WORD[k]} ${a}?` };
  });
};

export const unitForm: Gen = (R, n) => {
  const k = pick(R, [2, 3, 3, 4, 5]), a = pick(R, [2, 3, 5, 6, 7, 10, 11].filter(x => x !== k));
  const base: Base = {
    id: `unitForm-${n}`, family: 'unitForm', prompt: `Which root is ${a}<sup>1/${k}</sup>?`, board: `${a}^{\\frac{1}{${k}}}`,
    solution: [`(${a}<sup>1/${k}</sup>)<sup>${k}</sup> = ${a}<sup>1</sup> = ${a}: it is the number whose ${WORD[k]} is ${a}.`, `That is the ${ROOTWORD[k]} of ${a}: ${ans(rootH(k, a))}.`],
  };
  return choiceItem(R, base, uniq([
    { t: rootH(k, a), ok: true, say: `Yes: raised to the ${k}, it gives ${a}<sup>1</sup> = ${a}.` },
    { t: fr(a, k), mc: MC.baseTimesExp, say: `An exponent does not multiply the base. (${fr(a, k)})<sup>${k}</sup> is not ${a}; the ${ROOTWORD[k]} of ${a} is.` },
    { t: rootH(a, k), mc: MC.swapsBaseExp, say: `The base and the exponent swapped places. ${a} is under the root; the denominator ${k} is the index.` },
    { t: `${a}<sup>${k}</sup>`, say: `${a}<sup>${k}</sup> is ${a} used ${k} times. The exponent ${fr(1, k)} undoes that: it is the ${ROOTWORD[k]}.` },
  ]));
};

export const unitWhy: Gen = (R, n) => {
  const k = pick(R, [2, 3, 3, 4, 5]), a = pick(R, [2, 3, 5, 6, 7, 10].filter(x => x !== k));
  const p = `${a}<sup>1/${k}</sup>`;
  const base: Base = {
    id: `unitWhy-${n}`, family: 'unitWhy', prompt: `Why must ${p} be ${rootH(k, a)} (the positive number whose ${WORD[k]} is ${a})?`, board: `${a}^{\\frac{1}{${k}}} = ${rootT(k, a)}`,
    solution: [`Use the power-of-a-power rule: (${p})<sup>${k}</sup> = ${a}<sup>(1/${k})·${k}</sup> = ${a}<sup>1</sup> = ${a}.`, `So ${p} is a positive number whose ${WORD[k]} is ${a}, and that is ${rootH(k, a)}.`],
  };
  return choiceItem(R, base, [
    { t: `(${p})<sup>${k}</sup> = ${a}<sup>(1/${k})·${k}</sup> = ${a}<sup>1</sup> = ${a}, so its ${WORD[k]} is ${a}.`, ok: true, say: 'Yes: the power-of-a-power rule forces it. Any other value would break the rule.' },
    { t: `(${p})<sup>${k}</sup> = ${a}<sup>1/${k} + ${k}</sup>: the exponents add up to the root.`, mc: MC.powAdd, say: `A power of a power MULTIPLIES the exponents: (1/${k}) · ${k} = 1, so the result is ${a}<sup>1</sup>.` },
    { t: `${p} means ${a} · ${fr(1, k)}, which is the ${ROOTWORD[k]}.`, mc: MC.baseTimesExp, say: `${a} · ${fr(1, k)} = ${fr(a, k)}, and (${fr(a, k)})<sup>${k}</sup> is not ${a}. An exponent counts factors; it does not multiply the base.` },
    { t: `A calculator shows the same digits for both, so they are equal.`, mc: 'mc.reasoning-language.examples-as-proof', say: 'Matching digits on a screen check one case to a few decimals. The power-of-a-power rule shows it exactly, for every positive base.' },
  ]);
};

// ===================== rational-exponent-m-over-n =====================
const MN_BASES: Record<number, number[]> = { 2: [4, 9, 16, 25, 36, 49, 64, 81], 3: [8, 27, 64, 125], 4: [16, 81], 5: [32] };
const UNREDUCED: [number, number, number][] = [[16, 2, 4], [81, 2, 4], [64, 2, 6], [8, 2, 6], [27, 2, 6], [100, 2, 4], [64, 4, 6], [16, 6, 8]];
export const mnEval: Gen = (R, n) => {
  for (;;) {
    let a: number, m: number, k: number;
    if (R() < 0.2) [a, m, k] = pick(R, UNREDUCED);
    else { k = pick(R, [2, 3, 3, 4, 5]); a = pick(R, MN_BASES[k]!); m = int(R, 2, 6); if (m % k === 0) continue; }
    const v = powQ(q(a), m, k);
    if (v.kind !== 'value' || v.v[1] !== 1 || v.v[0] > 1000) continue;
    const val = v.v[0];
    const [rm, rk] = red(m, k), root = powQ(q(a), 1, rk);
    const rootV = root.kind === 'value' ? root.v[0] : 0;
    const base: Base = {
      id: `mnEval-${n}`, family: 'mnEval', prompt: `Evaluate ${a}<sup>${m}/${k}</sup> exactly, without a calculator.`, board: `${a}^{\\frac{${m}}{${k}}} = \\,?`,
      solution: [
        ...(rm !== m ? [`${m}/${k} = ${rm}/${rk} in lowest terms, so ${a}<sup>${m}/${k}</sup> = ${a}<sup>${rm}/${rk}</sup>.`] : []),
        `Root first: ${rootH(rk, a)} = ${rootV}.`, `Then the power: ${rootV}<sup>${rm}</sup> = ${ans(val)}.`],
      picture: { ladder: ladder(a, k, 0, Math.max(m, k), m) },
    };
    const sw = powQ(q(a), k, m);
    return numItem(base, val, x => {
      if (x === val) return { ok: true, say: `Yes: (${rootH(rk, a)})<sup>${rm}</sup> = ${rootV}<sup>${rm}</sup> = ${val}.` };
      if (near(x, (a * m) / k, 0.01)) return { ok: false, mc: MC.baseTimesExp, say: `The exponent is not a factor: ${a} × ${fr(m, k)} is not ${a}<sup>${m}/${k}</sup>. The denominator is a root, the numerator a power.` };
      if (sw.kind === 'value' && sw.v[1] === 1 && x === sw.v[0]) return { ok: false, mc: MC.swapped, say: `Root and power swapped: the denominator ${k} is the root, the numerator ${m} is the power. (${rootH(rk, a)})<sup>${rm}</sup>.` };
      if (x === rootV * rm) return { ok: false, mc: MC.baseTimesExp, say: `${rootV}<sup>${rm}</sup> means ${rm} factors of ${rootV}, not ${rootV} × ${rm}.` };
      return { ok: false, say: `Take the ${ROOTWORD[rk]} first (${rootH(rk, a)} = ${rootV}), then raise it to the ${rm}.` };
    });
  }
};

export const mnForm: Gen = (R, n) => {
  for (;;) {
    const m = int(R, 2, 5), k = int(R, 2, 5);
    if (m === k || gcd(m, k) !== 1) continue;
    const useX = R() < 0.6, B = useX ? 'x' : String(pick(R, [2, 3, 5, 6, 7])), BH = useX ? V('x') : B;
    if (!useX && Number(B) === m) continue;
    const toRad = R() < 0.5;
    const cond = useX ? `<i>x</i> &gt; 0. ` : '';
    if (toRad) {
      const base: Base = {
        id: `mnForm-${n}`, family: 'mnForm', prompt: `${cond}Which radical form equals ${BH}<sup>${m}/${k}</sup>?`, board: `${B}^{\\frac{${m}}{${k}}}`,
        solution: [`The denominator ${k} is the root, the numerator ${m} the power.`, `${BH}<sup>${m}/${k}</sup> = ${ans(`(${rootH(k, BH)})<sup>${m}</sup>`)}.`],
      };
      return choiceItem(R, base, [
        { t: `(${rootH(k, BH)})<sup>${m}</sup>`, ok: true, say: `Yes: the ${ROOTWORD[k]}, raised to the ${m}.` },
        { t: `(${rootH(m, BH)})<sup>${k}</sup>`, mc: MC.swapped, say: `Root and power swapped. The denominator (${k}) is the index of the root.` },
        { t: `${m}${rootH(k, BH)}`, mc: MC.baseTimesExp, say: `The numerator ${m} is a power, not a factor in front.` },
        { t: rootH(k, useX ? `${m}${BH}` : `${m} · ${BH}`), mc: MC.baseTimesExp, say: `${m}${BH} multiplies by ${m}. The numerator raises to the ${m}th power: ${rootH(k, `${BH}<sup>${m}</sup>`)}.` },
      ]);
    }
    const base: Base = {
      id: `mnForm-${n}`, family: 'mnForm', prompt: `${cond}Which power equals ${rootH(k, `${BH}<sup>${m}</sup>`)}?`, board: rootT(k, `${B}^{${m}}`),
      solution: [`The index ${k} becomes the denominator, the power ${m} the numerator.`, `${rootH(k, `${BH}<sup>${m}</sup>`)} = ${ans(`${BH}<sup>${m}/${k}</sup>`)}.`],
    };
    return choiceItem(R, base, [
      { t: `${BH}<sup>${m}/${k}</sup>`, ok: true, say: `Yes: (${BH}<sup>${m}</sup>)<sup>1/${k}</sup> = ${BH}<sup>${m}/${k}</sup>.` },
      { t: `${BH}<sup>${k}/${m}</sup>`, mc: MC.swapped, say: `Swapped: the index of the root goes in the denominator.` },
      { t: `${BH}<sup>${m * k}</sup>`, mc: MC.indexMult, say: `A root is not a multiplication by its index: the ${ROOTWORD[k]} divides the exponent, ${m}/${k}.` },
      { t: `${BH}<sup>${m - k < 0 ? '−' : ''}${Math.abs(m - k)}</sup>`, say: `Nothing is subtracted. (${BH}<sup>${m}</sup>)<sup>1/${k}</sup> = ${BH}<sup>${m}·(1/${k})</sup>.` },
    ].filter((o, i, a) => a.findIndex(y => y.t === o.t) === i));
  }
};

// ===================== negative-rational-exponent =====================
const DEC: Record<string, [number, number]> = { '0.5': [1, 2], '0.25': [1, 4], '0.75': [3, 4], '1.5': [3, 2] };
export const negEval: Gen = (R, n) => {
  for (;;) {
    const kind = pick(R, ['int', 'int', 'frac', 'dec'] as const);
    let bp: number, bq: number, m: number, k: number, expTex: string, expHtml: string;
    if (kind === 'dec') {
      const ds = pick(R, Object.keys(DEC)), sign = R() < 0.6 ? -1 : 1;
      [m, k] = DEC[ds]!; m *= sign;
      bp = pick(R, k === 2 ? [4, 9, 16, 25, 36, 49, 64, 81, 100] : [16, 81, 256, 625, 10000]); bq = 1;
      expTex = `${sign < 0 ? '-' : ''}${ds}`; expHtml = `${sign < 0 ? '−' : ''}${ds}`;
    } else {
      k = pick(R, [2, 3, 3, 4]); m = -int(R, 1, 3);
      if (m % k === 0) continue;
      if (kind === 'int') { bp = pick(R, MN_BASES[k]!); bq = 1; }
      else { const ps = [1, 2, 3, 4, 5].map(x => ipow(x, k)).filter(x => x <= 625); bp = pick(R, ps); bq = pick(R, ps); if (bp === bq || gcd(bp, bq) !== 1) continue; }
      expTex = expT(m, k); expHtml = expH(m, k);
    }
    const v = powQ(q(bp, bq), m, k);
    if (v.kind !== 'value' || v.v[0] > 1000 || v.v[1] > 1000) continue;
    const baseT = bq === 1 ? String(bp) : `\\left(\\frac{${bp}}{${bq}}\\right)`, baseH = bq === 1 ? String(bp) : `(${fr(bp, bq)})`;
    const [rm, rk] = red(Math.abs(m), k);
    const pos = powQ(q(bp, bq), Math.abs(m), k);
    const posV = pos.kind === 'value' ? pos.v : q(1);
    const solution = [
      ...(kind === 'dec' ? [`${expHtml.replace('−', '')} = ${rm}/${rk}, so the exponent is ${m < 0 ? '−' : ''}${rm}/${rk}.`] : []),
      ...(m < 0 ? [`A negative exponent means the reciprocal: ${baseH}<sup>${expHtml}</sup> = 1 ÷ ${baseH}<sup>${rm}/${rk}</sup>.`] : []),
      `${baseH}<sup>${rm}/${rk}</sup>: the ${ROOTWORD[rk]} first, then the power ${rm}: ${qH(posV)}.`,
      `So ${baseH}<sup>${expHtml}</sup> = ${ans(qH(v.v))}.`,
    ];
    const lad = bq === 1 ? ladder(bp, rk, Math.min(0, Math.sign(m) * rm), Math.max(rk, Math.sign(m) * rm), Math.sign(m) * rm) : undefined;
    const base: Base = {
      id: `negEval-${n}`, family: 'negEval', prompt: `Evaluate ${baseH}<sup>${expHtml}</sup> exactly. Type a whole number or a fraction.`, board: `${baseT}^{${expTex}} = \\,?`,
      solution, picture: lad ? { ladder: lad } : undefined,
    };
    const ansV = v.v;
    return fracItem(base, [ansV[0], ansV[1]], (p, d) => {
      if (sameFrac(p, d, ansV[0], ansV[1])) return { ok: true, say: `Yes: ${qH(ansV)}.` };
      if (sameFrac(-p, d, ansV[0], ansV[1])) return { ok: false, mc: MC.negMakesNeg, say: `A negative exponent does not make the value negative: it means the reciprocal. ${qH(ansV)}, a positive number.` };
      if (m < 0 && sameFrac(p, d, ansV[1], ansV[0])) return { ok: false, say: `That is ${baseH}<sup>${rm}/${rk}</sup>. The minus sign in the exponent asks for its reciprocal.` };
      const sw = powQ(q(bp, bq), Math.sign(m) * rk, rm);
      if (sw.kind === 'value' && sameFrac(p, d, sw.v[0], sw.v[1])) return { ok: false, mc: MC.swapped, say: `Root and power swapped: the denominator ${rk} is the root.` };
      return { ok: false, say: `Take the ${ROOTWORD[rk]} of ${baseH}, raise it to the ${rm}${m < 0 ? ', then take the reciprocal' : ''}.` };
    });
  }
};

/** x^(−m/n) and 1 / n-th root of x^m: both directions (also variable-notation-translation) */
export const negForm: Gen = (R, n) => {
  for (;;) {
    const m = int(R, 1, 3), k = int(R, 2, 5);
    if (m % k === 0 || gcd(m, k) !== 1) continue;
    const X = V('x'), xm = m === 1 ? X : `${X}<sup>${m}</sup>`;
    const recipRoot = fr('1', rootH(k, xm)), power = `${X}<sup>−${m}/${k}</sup>`;
    const dir = R() < 0.5 ? 'toRoot' : 'toPower';
    const third: Opt = m === 1
      ? (dir === 'toRoot' ? { t: fr('1', `${X}<sup>${k}</sup>`), mc: MC.recipRootNegIndex, say: `1/${X}<sup>${k}</sup> is ${X}<sup>−${k}</sup>. The exponent here is −1/${k}: a ${ROOTWORD[k]}, not a power ${k}.` }
        : { t: `${X}<sup>−${k}</sup>`, mc: MC.recipRootNegIndex, say: `The index ${k} is not the exponent: a ${ROOTWORD[k]} is the power 1/${k}, and the reciprocal makes it −1/${k}.` })
      : (dir === 'toRoot' ? { t: fr('1', rootH(m, `${X}<sup>${k}</sup>`)), mc: MC.swapped, say: `Root and power swapped: the denominator ${k} is the index.` }
        : { t: `${X}<sup>−${k}/${m}</sup>`, mc: MC.swapped, say: `Swapped: the index ${k} goes in the denominator.` });
    if (dir === 'toRoot') {
      const base: Base = {
        id: `negForm-${n}`, family: 'negForm', prompt: `<i>x</i> &gt; 0. Which expression equals ${power}?`, board: `x^{${expT(-m, k)}}`,
        solution: [`The minus sign means the reciprocal: ${power} = 1 ÷ ${X}<sup>${m}/${k}</sup>.`, `${X}<sup>${m}/${k}</sup> = ${rootH(k, xm)}, so ${power} = ${ans(recipRoot)}.`],
      };
      return choiceItem(R, base, [
        { t: recipRoot, ok: true, say: `Yes: the reciprocal of ${rootH(k, xm)}.` },
        { t: `−${rootH(k, xm)}`, mc: MC.negMakesNeg, say: `A negative exponent means a reciprocal, not a negative value. For ${V('x')} &gt; 0 the value is positive.` },
        { t: rootH(k, xm), say: `That is ${X}<sup>${m}/${k}</sup>. The minus sign asks for its reciprocal.` },
        third,
      ]);
    }
    const base: Base = {
      id: `negForm-${n}`, family: 'negForm', prompt: `<i>x</i> &gt; 0. Which power of <i>x</i> equals ${recipRoot}?`, board: `\\frac{1}{${rootT(k, varT('x', m))}}`,
      solution: [`${rootH(k, xm)} = ${X}<sup>${m}/${k}</sup>, and 1 over a power is the power with the opposite exponent.`, `${recipRoot} = ${ans(power)}.`],
    };
    return choiceItem(R, base, [
      { t: power, ok: true, say: 'Yes: the root is the power ' + `${m}/${k}` + ', the reciprocal makes it negative.' },
      { t: `−${X}<sup>${m}/${k}</sup>`, mc: MC.negMakesNeg, say: `The value is positive. A reciprocal is written with a negative EXPONENT: ${power}.` },
      { t: `${X}<sup>${m}/${k}</sup>`, say: `That is ${rootH(k, xm)} itself. The 1 over it makes the exponent negative.` },
      third,
    ]);
  }
};

// ===================== variable-notation-translation =====================
export const toExp: Gen = (R, n) => {
  for (;;) {
    const k = pick(R, [2, 3, 3, 4, 5]), m = int(R, 1, 4), c = pick(R, [2, 3, 5, 7, 8, 9]);
    if (m % k === 0 || gcd(m, k) !== 1) continue;
    const X = V('x'), xm = m === 1 ? X : `${X}<sup>${m}</sup>`;
    const inside = R() < 0.5;
    if (inside) {
      const base: Base = {
        id: `toExp-${n}`, family: 'toExp', prompt: `<i>x</i> &gt; 0. Which power form equals ${rootH(k, `${c}${xm}`)}?`, board: rootT(k, `${c}${varT('x', m)}`),
        solution: [`The whole radicand ${c}${xm} is the base: it goes in parentheses.`, `${rootH(k, `${c}${xm}`)} = ${ans(`(${c}${xm})<sup>1/${k}</sup>`)}.`],
      };
      return choiceItem(R, base, uniq([
        { t: `(${c}${xm})<sup>1/${k}</sup>`, ok: true, say: 'Yes: everything under the root is the base.' },
        { t: `${c}${X}<sup>${m}/${k}</sup>`, mc: MC.oneFactor, say: `The root acts on the ${c} too: ${c} is under the root, not in front of it.` },
        { t: `${c}<sup>1/${k}</sup>${xm}`, mc: MC.oneFactor, say: `The root acts on ${xm} too: the whole radicand is the base.` },
        { t: `(${c}${xm})<sup>${k}</sup>`, say: `A ${ROOTWORD[k]} is the power 1/${k}, not ${k}.` },
      ]));
    }
    const base: Base = {
      id: `toExp-${n}`, family: 'toExp', prompt: `<i>x</i> &gt; 0. Which power form equals ${c}${rootH(k, xm)}?`, board: `${c}${rootT(k, varT('x', m))}`,
      solution: [`Only ${xm} is under the root; the ${c} stays in front.`, `${c}${rootH(k, xm)} = ${ans(`${c}${X}<sup>${m}/${k}</sup>`)}.`],
    };
    return choiceItem(R, base, uniq([
      { t: `${c}${X}<sup>${m}/${k}</sup>`, ok: true, say: `Yes: the ${c} is outside the root and stays a plain factor.` },
      { t: `(${c}${xm})<sup>1/${k}</sup>`, mc: 'mc.exponents-roots.coefficient-moved-under-radical', say: `The ${c} is outside the root. Putting it inside would take its root too.` },
      ...(m > 1 ? [{ t: `${c}${X}<sup>${k}/${m}</sup>`, mc: MC.swapped, say: 'Swapped: the index goes in the denominator.' }] : []),
      { t: `${c}${X}<sup>${m * k}</sup>`, mc: MC.indexMult, say: `A root divides the exponent by the index: ${m}/${k}.` },
    ]));
  }
};

// ===================== the exponent laws =====================
/** a random nonzero exponent a/b with b in 2..6, in lowest terms; sometimes negative */
function rexp(R: () => number, neg = 0.3): [number, number] {
  for (;;) { const b = int(R, 2, 6), a = int(R, 1, 2 * b - 1) * (R() < neg ? -1 : 1); const [x, y] = red(a, b); if (y !== 1) return [x, y]; }
}
const xpT = (e: [number, number]) => `x^{${expT(e[0], e[1])}}`;
const xpH = (e: [number, number]) => `${V('x')}<sup>${expH(e[0], e[1])}</sup>`;
const EXP_LEAD = 'exponent =', EXP_OP = '/';
const EXP_TELL = 'Type the exponent as a fraction (a whole number <i>n</i> is <i>n</i>/1).';
function expCheck(right: [number, number], wrongs: { e: [number, number] | null; mc?: string; say: string }[], okSay: string, hint: string) {
  return (x: number, y: number) => {
    if (!Number.isInteger(x) || !Number.isInteger(y) || y === 0) return { ok: false, say: 'Type whole numbers, and a denominator that is not 0.' };
    if (sameFrac(x, y, right[0], right[1])) return { ok: true, say: okSay };
    for (const w of wrongs) if (w.e && sameFrac(x, y, w.e[0], w.e[1]) && !sameFrac(w.e[0], w.e[1], right[0], right[1])) return { ok: false, mc: w.mc, say: w.say };
    return { ok: false, say: hint };
  };
}
const fracH = (e: [number, number]) => (e[1] === 1 ? iH(e[0]) : `${e[0] < 0 ? '−' : ''}${Math.abs(e[0])}/${e[1]}`);
/** a signed exponent inside a sum or difference: a negative one in parentheses (4/5 + (−3/2)) */
const fracP = (e: [number, number]) => (e[0] < 0 ? `(${fracH(e)})` : fracH(e));

export const prodExp: Gen = (R, n) => {
  for (;;) {
    const e1 = rexp(R, 0.25), e2 = R() < 0.3 ? red(int(R, 1, 3), 1) as [number, number] : rexp(R, 0.3);
    const s = red(e1[0] * e2[1] + e2[0] * e1[1], e1[1] * e2[1]);
    if (s[0] === 0) continue;
    const mult = red(e1[0] * e2[0], e1[1] * e2[1]), addD = e1[1] + e2[1] === 0 ? null : red(e1[0] + e2[0], e1[1] + e2[1]);
    if (sameFrac(mult[0], mult[1], s[0], s[1]) || (addD && sameFrac(addD[0], addD[1], s[0], s[1]))) continue;
    const L = e1[1] * e2[1] / gcd(e1[1], e2[1]);
    const base: Base = {
      id: `prodExp-${n}`, family: 'prodExp', prompt: `<i>x</i> &gt; 0. Write ${xpH(e1)} · ${xpH(e2)} as one power of <i>x</i>. ${EXP_TELL}`, board: `${xpT(e1)} \\cdot ${xpT(e2)} = x^{\\,?}`,
      solution: [`Same base: multiply by ADDING the exponents: ${fracH(e1)} + ${fracP(e2)}.`, `Common denominator ${L}: ${fracH(e1)} + ${fracP(e2)} = ${ans(iH(s[0]))}/${ans(s[1])}.`],
    };
    return pairItem(base, s[0], s[1], EXP_LEAD, EXP_OP, '', expCheck(s, [
      { e: mult, mc: MC.prodMult, say: `Multiplying powers of the same base ADDS the exponents (factors join); multiplying exponents is for a power of a power.` },
      { e: addD, mc: MC.addDen, say: `Fractions do not add top + top over bottom + bottom. Use a common denominator, ${L}.` },
    ], `Yes: ${xpH(e1)} · ${xpH(e2)} = ${V('x')}<sup>${fracH(s)}</sup>.`, `Add the exponents with a common denominator: ${fracH(e1)} + ${fracP(e2)}.`));
  }
};

/** k · x^e in HTML / TeX; a negative exponent is written as k over x^|e| (positive exponents only) */
function monoH(k: number, e: [number, number]): string { const xe = (f: [number, number]) => (f[0] === 1 && f[1] === 1 ? V('x') : `${V('x')}<sup>${fracH(f)}</sup>`); return e[0] < 0 ? `${k} / ${xe([-e[0], e[1]])}` : `${k}${xe(e)}`; }
export const prodCoef: Gen = (R, n) => {
  for (;;) {
    const p = int(R, 2, 6), c = int(R, 2, 6), e1 = rexp(R, 0.3), e2 = rexp(R, 0.3);
    const s = red(e1[0] * e2[1] + e2[0] * e1[1], e1[1] * e2[1]);
    if (s[0] === 0 || s[1] === 1) continue;
    const mult = red(e1[0] * e2[0], e1[1] * e2[1]), addD = red(e1[0] + e2[0], e1[1] + e2[1]);
    if (addD[1] === 0 || addD[0] === 0 || mult[0] === 0) continue;
    const opts = uniq([
      { t: monoH(p * c, s), ok: true, say: `Yes: multiply the numbers (${p} · ${c} = ${p * c}) and add the exponents.` },
      { t: monoH(p + c, s), say: `The numbers in front are factors: multiply them, ${p} · ${c} = ${p * c}.` },
      { t: monoH(p * c, mult), mc: MC.prodMult, say: 'Same base: ADD the exponents. Multiplying them is the power-of-a-power rule.' },
      { t: monoH(p * c, addD), mc: MC.addDen, say: 'Add the fractions with a common denominator, not top + top over bottom + bottom.' },
    ]);
    if (opts.length < 4 || opts.filter(o => !o.ok).some(o => o.t === monoH(p * c, s))) continue;
    const base: Base = {
      id: `prodCoef-${n}`, family: 'prodCoef', prompt: `<i>x</i> &gt; 0. Simplify (${p}${xpH(e1)})(${c}${xpH(e2)}). Write the answer with a positive exponent.`, board: `\\left(${p}${xpT(e1)}\\right)\\left(${c}${xpT(e2)}\\right)`,
      solution: [`Numbers: ${p} · ${c} = ${p * c}. Exponents: ${fracH(e1)} + ${fracP(e2)} = ${fracH(s)}.`, ...(s[0] < 0 ? [`A negative exponent goes below the bar: ${V('x')}<sup>${fracH(s)}</sup> = 1 / ${V('x')}<sup>${fracH([-s[0], s[1]])}</sup>.`] : []), `So: ${ans(monoH(p * c, s))}.`],
    };
    return choiceItem(R, base, opts);
  }
};

const NONPERF = [2, 3, 5, 6, 7, 10];
export const prodNum: Gen = (R, n) => {
  for (;;) {
    const k = pick(R, [2, 3, 4]);
    let b: number, p: number, qq: number, val: number;
    if (R() < 0.5) { b = pick(R, NONPERF); const t = pick(R, [1, 1, 2]); if (t * k > 7 || ipow(b, t) > 100) continue; p = int(R, 1, t * k - 1); qq = t * k - p; val = ipow(b, t); }
    else { b = pick(R, MN_BASES[k]!); p = int(R, 1, k + 1); qq = int(R, 1, k + 1); const v = powQ(q(b), p + qq, k); if (v.kind !== 'value' || v.v[1] !== 1 || v.v[0] > 1000 || (p + qq) % k === 0 && R() < 0.5) continue; val = v.v[0]; if (p + qq > 7) continue; }
    const e1 = red(p, k), e2 = red(qq, k), tot = red(p + qq, k);
    const base: Base = {
      id: `prodNum-${n}`, family: 'prodNum', prompt: `Evaluate ${b}<sup>${fracH(e1)}</sup> · ${b}<sup>${fracH(e2)}</sup> exactly, without a calculator.`,
      board: `${b}^{${expT(e1[0], e1[1])}} \\cdot ${b}^{${expT(e2[0], e2[1])}} = \\,?`,
      solution: [`Same base: add the exponents, ${fracH(e1)} + ${fracP(e2)} = ${fracH(tot)}.`, `${b}<sup>${fracH(tot)}</sup> = ${ans(val)}.`],
      picture: { ladder: ladder(b, k, 0, p + qq, p + qq, { spans: [{ from: 0, to: p, tex: `${b}^{${expT(e1[0], e1[1])}}` }, { from: p, to: p + qq, tex: `${b}^{${expT(e2[0], e2[1])}}` }] }) },
    };
    const mult = Math.pow(b, (e1[0] * e2[0]) / (e1[1] * e2[1]));
    return numItem(base, val, v => {
      if (v === val) return { ok: true, say: `Yes: ${b}<sup>${fracH(tot)}</sup> = ${val}.` };
      if (near(v, mult, 0.01)) return { ok: false, mc: MC.prodMult, say: `Multiplying same-base powers ADDS the exponents: the hops join end to end.` };
      return { ok: false, say: `Add the exponents first: ${fracH(e1)} + ${fracP(e2)} = ${fracH(tot)}. Then evaluate ${b}<sup>${fracH(tot)}</sup>.` };
    });
  }
};

export const quotExp: Gen = (R, n) => {
  for (;;) {
    const e1 = rexp(R, 0.15), kind = pick(R, ['pos', 'neg', 'zero'] as const);
    let e2: [number, number];
    if (kind === 'zero') { const g = pick(R, [2, 3]); e2 = [e1[0], e1[1]]; const shown: [number, number] = [e1[0] * g, e1[1] * g]; if (shown[1] > 12) continue; e2 = shown; }
    else e2 = rexp(R, 0.15);
    const d = red(e1[0] * e2[1] - e2[0] * e1[1], e1[1] * e2[1]);
    if (kind === 'pos' && d[0] <= 0) continue;
    if (kind === 'neg' && d[0] >= 0) continue;
    const rev = red(-d[0], d[1]), div = e2[0] === 0 ? null : red(e1[0] * e2[1], e1[1] * e2[0]);
    if (div && sameFrac(div[0], div[1], d[0], d[1])) continue;
    const e2s = `${e2[0] < 0 ? '−' : ''}${Math.abs(e2[0])}/${e2[1]}`;
    const base: Base = {
      id: `quotExp-${n}`, family: 'quotExp', prompt: `<i>x</i> &gt; 0. Write ${xpH(e1)} ÷ ${V('x')}<sup>${e2s}</sup> as one power of <i>x</i>. ${EXP_TELL}`,
      board: `\\frac{${xpT(e1)}}{x^{${e2[0] < 0 ? '-' : ''}\\frac{${Math.abs(e2[0])}}{${e2[1]}}}} = x^{\\,?}`,
      solution: [`Same base: divide by SUBTRACTING, top exponent minus bottom exponent: ${fracH(e1)} − ${e2[0] < 0 ? `(${e2s})` : e2s}.`, `${fracH(e1)} − ${e2[0] < 0 ? `(${e2s})` : e2s} = ${ans(iH(d[0]))}/${ans(d[1])}${d[0] === 0 ? ' = 0 (and x⁰ = 1)' : ''}.`],
    };
    return pairItem(base, d[0], d[1], EXP_LEAD, EXP_OP, '', expCheck(d, [
      { e: d[0] !== 0 ? rev : null, mc: MC.quotRev, say: 'Subtract in order: the TOP exponent minus the BOTTOM exponent.' },
      { e: div, mc: MC.quotDiv, say: 'Dividing same-base powers SUBTRACTS the exponents; it does not divide them.' },
    ], `Yes: ${V('x')}<sup>${fracH(d)}</sup>${d[0] < 0 ? ` = 1 / ${V('x')}<sup>${fracH(rev)}</sup>` : ''}.`, `Top exponent minus bottom exponent: ${fracH(e1)} − ${e2[0] < 0 ? `(${e2s})` : e2s}.`));
  }
};

export const quotNum: Gen = (R, n) => {
  for (;;) {
    const k = pick(R, [2, 3, 4]), b = pick(R, MN_BASES[k]!.filter(x => x <= 81)), p = int(R, 1, 2 * k), qq = int(R, 1, 2 * k);
    if (p === qq) continue;
    const v = powQ(q(b), p - qq, k);
    if (v.kind !== 'value' || v.v[0] > 1000 || v.v[1] > 1000) continue;
    const e1 = red(p, k), e2 = red(qq, k), d = red(p - qq, k);
    if (e1[1] === 1 && e2[1] === 1) continue;
    const lo = Math.min(0, p - qq), hi = Math.max(k, p - qq);
    const base: Base = {
      id: `quotNum-${n}`, family: 'quotNum', prompt: `Evaluate ${b}<sup>${fracH(e1)}</sup> ÷ ${b}<sup>${fracH(e2)}</sup> exactly. Type a whole number or a fraction.`,
      board: `\\frac{${b}^{${expT(e1[0], e1[1])}}}{${b}^{${expT(e2[0], e2[1])}}} = \\,?`,
      solution: [`Same base: subtract the exponents, ${fracH(e1)} − ${fracH(e2)} = ${fracH(d)}.`, `${b}<sup>${fracH(d)}</sup> = ${ans(qH(v.v))}.`],
      picture: { ladder: ladder(b, k, lo, hi, p - qq) },
    };
    const rv = powQ(q(b), qq - p, k);
    return fracItem(base, [v.v[0], v.v[1]], (x, y) => {
      if (sameFrac(x, y, v.v[0], v.v[1])) return { ok: true, say: `Yes: ${b}<sup>${fracH(d)}</sup> = ${qH(v.v)}.` };
      if (rv.kind === 'value' && sameFrac(x, y, rv.v[0], rv.v[1])) return { ok: false, mc: MC.quotRev, say: `Subtract top minus bottom: ${fracH(e1)} − ${fracH(e2)} = ${fracH(d)}.` };
      if (sameFrac(-x, y, v.v[0], v.v[1])) return { ok: false, mc: MC.negMakesNeg, say: 'A negative exponent gives a reciprocal, not a negative number.' };
      return { ok: false, say: `Subtract the exponents (${fracH(e1)} − ${fracH(e2)}), then evaluate.` };
    });
  }
};

export const powPow: Gen = (R, n) => {
  for (;;) {
    const e1 = rexp(R, 0.2);
    const e2: [number, number] = R() < 0.3 ? [pick(R, [-4, -3, -2, 2, 3, 4, 6]), 1] : rexp(R, 0.3);
    const p = red(e1[0] * e2[0], e1[1] * e2[1]), add = red(e1[0] * e2[1] + e2[0] * e1[1], e1[1] * e2[1]);
    if (sameFrac(p[0], p[1], add[0], add[1])) continue;
    const e2T = expT(e2[0], e2[1]);
    const base: Base = {
      id: `powPow-${n}`, family: 'powPow', prompt: `<i>x</i> &gt; 0. Write (${xpH(e1)})<sup>${fracH(e2)}</sup> as one power of <i>x</i>. ${EXP_TELL}`,
      board: `\\left(${xpT(e1)}\\right)^{${e2T}} = x^{\\,?}`,
      solution: [`A power of a power: MULTIPLY the exponents, ${fracH(e1)} · ${fracP(e2)}.`, `${fracH(e1)} · ${fracP(e2)} = ${ans(iH(p[0]))}/${ans(p[1])}.`],
    };
    return pairItem(base, p[0], p[1], EXP_LEAD, EXP_OP, '', expCheck(p, [
      { e: add, mc: MC.powAdd, say: `A power of a power repeats the whole group: multiply the exponents. Adding is for a product of powers.` },
    ], `Yes: ${V('x')}<sup>${fracH(p)}</sup>.`, `Multiply the exponents: ${fracH(e1)} · ${fracP(e2)}.`));
  }
};

export const powPowNum: Gen = (R, n) => {
  for (;;) {
    const r = pick(R, [2, 2, 3, 5]), n1 = pick(R, [2, 3]), n2 = pick(R, [2, 3]), m1 = pick(R, [1, 1, 2]), m2 = pick(R, [1, 1, 2, 3]);
    const b = ipow(r, n1 * n2);
    if (b > 1000 || gcd(m1, n1) !== 1 || gcd(m2, n2) !== 1) continue;
    const val = ipow(r, m1 * m2);
    if (val > 1000) continue;
    const add = Math.pow(b, m1 / n1 + m2 / n2);
    const base: Base = {
      id: `powPowNum-${n}`, family: 'powPowNum', prompt: `Evaluate (${b}<sup>${m1}/${n1}</sup>)<sup>${m2}/${n2}</sup> exactly, without a calculator.`,
      board: `\\left(${b}^{\\frac{${m1}}{${n1}}}\\right)^{\\frac{${m2}}{${n2}}} = \\,?`,
      solution: (() => { const tot = red(m1 * m2, n1 * n2), rt = powQ(q(b), 1, tot[1]); return [`Multiply the exponents: ${m1}/${n1} · ${m2}/${n2} = ${fracH(tot)}.`, rt.kind === 'value' ? `Root first: ${rootH(tot[1], b)} = ${qH(rt.v)}. Then ${qH(rt.v)}<sup>${tot[0]}</sup> = ${ans(val)}.` : `${b}<sup>${fracH(tot)}</sup> = ${ans(val)}.`]; })(),
    };
    return numItem(base, val, v => {
      if (v === val) return { ok: true, say: `Yes: ${b}<sup>${fracH(red(m1 * m2, n1 * n2))}</sup> = ${val}.` };
      if (near(v, add, 0.01)) return { ok: false, mc: MC.powAdd, say: 'A power of a power multiplies the exponents; it does not add them.' };
      return { ok: false, say: `Multiply the exponents first: ${m1}/${n1} · ${m2}/${n2}. Then root first, power second.` };
    });
  }
};

export const prodPow: Gen = (R, n) => {
  if (R() < 0.6) {
    for (;;) {
      const k = pick(R, [2, 3]), c = pick(R, k === 2 ? [2, 3, 4, 5] : [2, 3]), s = int(R, 1, 3), m = int(R, 1, k === 2 ? 3 : 2);
      if (m % k === 0) continue;
      const C = ipow(c, k), xe = k * s, coef = ipow(c, m), xr = s * m;
      const X = V('x');
      const tri: [number, number] = red(xe * k + m, k);
      const opts = uniq([
        { t: `${coef}${varH('x', xr)}`, ok: true, say: `Yes: (${C})<sup>${m}/${k}</sup> = ${coef} and (${X}<sup>${xe}</sup>)<sup>${m}/${k}</sup> = ${varH('x', xr)}.` },
        { t: `${C}${varH('x', xr)}`, mc: MC.oneFactor, say: `The exponent acts on EVERY factor in the parentheses, the ${C} too: ${C}<sup>${m}/${k}</sup> = ${coef}.` },
        { t: `${coef}${X}<sup>${fracH(tri)}</sup>`, mc: MC.powAdd, say: `A power of a power multiplies the exponents: ${xe} · ${m}/${k} = ${xr}.` },
        { t: `${(([a, b]) => (b === 1 ? String(a) : fr(a, b)))(red(C * m, k))}${varH('x', xr)}`, mc: MC.baseTimesExp, say: `${C}<sup>${m}/${k}</sup> is not ${C} × ${m}/${k}: take the ${ROOTWORD[k]}, then the power.` },
      ]);
      if (opts.length < 4) continue;
      const base: Base = {
        id: `prodPow-${n}`, family: 'prodPow', prompt: `<i>x</i> &gt; 0. Simplify (${C}${X}<sup>${xe}</sup>)<sup>${m}/${k}</sup>.`, board: `\\left(${C}x^{${xe}}\\right)^{\\frac{${m}}{${k}}}`,
        solution: [`The exponent goes to every factor: ${C}<sup>${m}/${k}</sup> · (${X}<sup>${xe}</sup>)<sup>${m}/${k}</sup>.`, `${C}<sup>${m}/${k}</sup> = (${rootH(k, C)})<sup>${m}</sup> = ${coef}; ${xe} · ${m}/${k} = ${xr}.`, `So: ${ans(`${coef}${varH('x', xr)}`)}.`],
      };
      return choiceItem(R, base, opts);
    }
  }
  const a = int(R, 1, 3), b = int(R, 1, 3), k = pick(R, [2, 2, 3]);
  const X = V('x'), Y = V('y');
  const right = fr('1', `${varH('x', a)}${varH('y', b)}`);
  const base: Base = {
    id: `prodPow-${n}`, family: 'prodPow', prompt: `<i>x</i>, <i>y</i> &gt; 0. Simplify (${X}<sup>${k * a}</sup>${Y}<sup>${k * b}</sup>)<sup>−1/${k}</sup>.`, board: `\\left(x^{${k * a}}y^{${k * b}}\\right)^{-\\frac{1}{${k}}}`,
    solution: [`Multiply each exponent by −1/${k}: ${X}<sup>−${a}</sup>${Y}<sup>−${b}</sup>.`, `Negative exponents go below the bar: ${ans(right)}.`],
  };
  return choiceItem(R, base, uniq([
    { t: right, ok: true, say: 'Yes: both factors get the exponent, and the minus sign makes it a reciprocal.' },
    { t: `−${varH('x', a)}${varH('y', b)}`, mc: MC.negMakesNeg, say: 'A negative exponent means a reciprocal, not a negative value.' },
    { t: fr('1', `${varH('x', a)}${Y}<sup>${k * b}</sup>`), mc: MC.oneFactor, say: `The exponent acts on every factor: (${Y}<sup>${k * b}</sup>)<sup>−1/${k}</sup> = ${Y}<sup>−${b}</sup> too.` },
    { t: `${varH('x', a)}${varH('y', b)}`, say: 'That drops the minus sign. A negative exponent puts the result below the bar.' },
  ]));
};

export const coefOut: Gen = (R, n) => {
  for (;;) {
    const k = pick(R, [2, 3, 3]), c = pick(R, k === 2 ? [2, 3, 4, 5, 6, 7, 8, 9] : [2, 3, 4, 5]), m = k === 2 ? pick(R, [1, 1, 3]) : pick(R, [1, 2, 4, 5]);
    const C = ipow(c, k), X = V('x'), xm = m === 1 ? X : `${X}<sup>${m}</sup>`;
    const opts = uniq([
      { t: `${c}${X}<sup>${m}/${k}</sup>`, ok: true, say: `Yes: ${C}<sup>1/${k}</sup> = ${c}, and ${xm} under the ${ROOTWORD[k]} is ${X}<sup>${m}/${k}</sup>.` },
      { t: `${C}${X}<sup>${m}/${k}</sup>`, mc: MC.oneFactor, say: `The ${C} is under the root too: its ${ROOTWORD[k]} is ${c}.` },
      { t: `${c}${X}<sup>${k}/${m === 1 ? 1 : m}</sup>`.replace(`<sup>${k}/1</sup>`, `<sup>${k}</sup>`), mc: MC.swapped, say: `The index ${k} goes in the denominator: ${X}<sup>${m}/${k}</sup>.` },
      ...(C / k !== c ? [{ t: `${Number.isInteger(C / k) ? C / k : fr(C, k)}${X}<sup>${m}/${k}</sup>`, mc: MC.divIndex, say: `A root is not a division by its index: the ${ROOTWORD[k]} of ${C} is ${c}, because ${c}<sup>${k}</sup> = ${C}.` }] : []),
    ]);
    if (opts.length < 3) continue;
    const base: Base = {
      id: `coefOut-${n}`, family: 'coefOut', prompt: `<i>x</i> &gt; 0. Which power form equals ${rootH(k, `${C}${xm}`)}?`, board: rootT(k, `${C}${varT('x', m)}`),
      solution: [`${rootH(k, `${C}${xm}`)} = (${C}${xm})<sup>1/${k}</sup> = ${C}<sup>1/${k}</sup> · ${xm === X ? X : `(${xm})`}<sup>1/${k}</sup>.`, `${C}<sup>1/${k}</sup> = ${c}, so it is ${ans(`${c}${X}<sup>${m}/${k}</sup>`)}.`],
    };
    return choiceItem(R, base, opts);
  }
};
