// answers.mjs: answer values for the quality tools. An oracle answers in plain values (docs/lessons/QUALITY_LAYER.md):
//   num → a number · frac → a number, 'a/b', 'w a/b', [n, d] or [w, n, d] · pair → [x, y] · choice → the index (or the
//   choice's plain text). These helpers compare such a value with an item Response, and turn it into the Responses a
//   student would produce by typing it (through the panel's own number parser).
import { plainText } from './view.mjs';

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** a value → exact [num, den] (den > 0) when it is a clean rational, else null */
export function toRat(v) {
  if (Array.isArray(v)) {
    if (v.length === 2) { const [n, d] = v.map(Number); return Number.isInteger(n) && Number.isInteger(d) && d ? norm(n, d) : null; }
    if (v.length === 3) { const [w, n, d] = v.map(Number); return Number.isInteger(w) && Number.isInteger(n) && Number.isInteger(d) && d ? norm((w < 0 ? -1 : 1) * (Math.abs(w) * d + n), d) : null; }
    return null;
  }
  if (typeof v === 'string') {
    const s = v.trim().replace(/−/g, '-').replace(/^\$/, '');
    let m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if (m) { const w = Number(m[1]); return norm((w < 0 || m[1].startsWith('-') ? -1 : 1) * (Math.abs(w) * Number(m[3]) + Number(m[2])), Number(m[3])); }
    m = s.match(/^(-?\d+)\/(\d+)$/);
    if (m) return Number(m[2]) ? norm(Number(m[1]), Number(m[2])) : null;
    return /^-?(\d+\.?\d*|\.\d+)$/.test(s) ? toRat(Number(s)) : null;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  // continued fraction, denominators up to 100000
  let h0 = 1, h1 = 0, k0 = 0, k1 = 1, x = v;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(x);
    [h0, h1] = [a * h0 + h1, h0]; [k0, k1] = [a * k0 + k1, k0];
    if (k0 > 100000) return null;
    if (Math.abs(h0 / k0 - v) <= 1e-12 * Math.max(1, Math.abs(v))) return norm(h0, k0);
    x = 1 / (x - a);
    if (!Number.isFinite(x)) break;
  }
  return Math.abs(h0 / k0 - v) <= 1e-12 * Math.max(1, Math.abs(v)) ? norm(h0, k0) : null;
}
function norm(n, d) { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; }
const numOf = v => (typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim().replace(/−/g, '-').replace(/^\$/, '').replace(/,/g, '')) : NaN);
const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
function sameValue(a, b) {
  const ra = toRat(a), rb = toRat(b);
  if (ra && rb) return ra[0] === rb[0] && ra[1] === rb[1];
  const x = Array.isArray(a) ? (ra ? ra[0] / ra[1] : NaN) : numOf(a), y = Array.isArray(b) ? (rb ? rb[0] / rb[1] : NaN) : numOf(b);
  return near(x, y);
}

/** the oracle's value `want` and a Response `r` of item `it` mean the same answer */
export function sameAnswer(it, want, r) {
  if (!r) return false;
  switch (it.input) {
    case 'choice': {
      const i = typeof want === 'number' ? want : (it.choices ?? []).map(plainText).findIndex(c => c.toLowerCase() === String(want).trim().toLowerCase());
      return r.kind === 'choice' && r.i === i;
    }
    case 'pair': return r.kind === 'pair' && Array.isArray(want) && want.length === 2 && sameValue(want[0], r.x) && sameValue(want[1], r.y);
    // a whole box may hold a decimal (5.5 typed in the whole box reads as { w: 5.5, n: 0, d: 1 })
    case 'frac': return r.kind === 'frac' ? (Number.isInteger(r.w) ? sameValue(want, [r.w, r.n, r.d]) : sameValue(want, r.w + r.n / r.d)) : r.kind === 'num' && sameValue(want, r.v);
    default: return r.kind === 'num' ? sameValue(want, r.v) : false;
  }
}

/** a number the way a student types it (no float noise, a real minus sign as one variant) */
export function typed(v) {
  const n = numOf(v);
  if (!Number.isFinite(n)) return [String(v)];
  const s = String(Number(n.toPrecision(12)));
  return n < 0 ? [s, '−' + s.slice(1)] : [s];
}
/** every Response a student could give for the oracle's value (one of them must pass check) */
export function responsesFor(it, want, P) {
  const parse = s => P.num({ value: s });
  switch (it.input) {
    case 'choice': {
      const i = typeof want === 'number' ? want : (it.choices ?? []).map(plainText).findIndex(c => c.toLowerCase() === String(want).trim().toLowerCase());
      return [{ kind: 'choice', i }];
    }
    case 'pair': return Array.isArray(want) ? [{ kind: 'pair', x: parse(typed(want[0])[0]), y: parse(typed(want[1])[0]) }] : [];
    case 'frac': {
      const r = toRat(want);
      if (!r) return [];
      const [n, d] = r, out = [{ kind: 'frac', w: 0, n, d }];
      if (n >= 0 && n > d && n % d) out.push({ kind: 'frac', w: Math.floor(n / d), n: n % d, d });
      if (n % d === 0) out.push({ kind: 'frac', w: n / d, n: 0, d: 1 });
      return out;
    }
    default: return typed(want).map(s => ({ kind: 'num', v: parse(s) }));
  }
}
/** a clearly wrong typed answer (null for choices) */
export function wrongTyped(it) {
  const a = it.answer;
  if (a.kind === 'num') return { kind: 'num', v: a.v + 1000 };
  if (a.kind === 'frac') return { kind: 'frac', w: 0, n: (a.w * a.d + a.n) + 997 * a.d, d: a.d };
  if (a.kind === 'pair') return { kind: 'pair', x: a.x + 1000, y: a.y + 1000 };
  return null;
}
/** a one-line picture of an item for reports */
export function show(it) {
  return `${plainText(it.prompt)} | board: ${it.board ?? ''}${it.choices ? ` | choices: ${it.choices.map((c, i) => `(${i}) ${plainText(c)}`).join(' ')}` : ''} | answer: ${JSON.stringify(it.answer, (k, v) => (typeof v === 'bigint' ? Number(v) : v))}`.slice(0, 600);
}
