// Oracle for the lesson "square-and-cube-roots" (square roots, cube roots, x² = p and x³ = p, grade 8). Written from
// what the student sees only: the prompt (its HTML where the plain text drops the root's bar: √16 + 9 is √(16 + 9)),
// the board TeX and the choices. Roots are worked out exactly where they are rational (perfect squares and cubes of
// fractions and decimals) and as decimals otherwise; √ always names the principal (non-negative) root, ∛ of a
// negative is negative, x² = p has ±√p. Statements are judged by checking the numbers they name and whether their
// reason is true. See docs/lessons/QUALITY_LAYER.md, "O: the oracle".
import { Q, choiceWhere } from '../../tools/quality/oracle-kit.mjs';

// ---------------------------------------------------------------- exact roots
const clean = s => String(s ?? '').replace(/[−–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
function dec(t) {
  const m = String(t).match(/^(\d*)(?:\.(\d+))?$/);
  if (!m || (m[1] === '' && !m[2])) throw new Error(`not a number: ${t}`);
  return Q(Number((m[1] || '0') + (m[2] || '')), m[2] ? 10 ** m[2].length : 1);
}
const iroot = (n, k) => { const r = Math.round(Math.abs(n) ** (1 / k)); for (const c of [r - 1, r, r + 1]) if (c >= 0 && c ** k === Math.abs(n)) return c; return null; };
/** a value: { q } exact (a Q) or { f } a decimal only (irrational), or { nr } not a real number */
const V = q => ({ q, f: q.value });
const F_ = f => ({ q: null, f });
function vroot(x, k) {
  if (x.nr) return x;
  if (k === 2 && x.f < 0) return { nr: true };
  if (x.q) {
    const a = iroot(x.q.n, k), b = iroot(x.q.d, k);
    if (a !== null && b !== null) return V(Q(a * (x.q.n < 0 ? -1 : 1), b));
  }
  return F_(Math.sign(x.f) * Math.abs(x.f) ** (1 / k));
}
const vop = (a, b, op) => {
  if (a.nr || b.nr) return { nr: true };
  if (a.q && b.q) { const r = op === '+' ? a.q.add(b.q) : op === '-' ? a.q.sub(b.q) : op === '*' ? a.q.mul(b.q) : a.q.div(b.q); return V(r); }
  const r = op === '+' ? a.f + b.f : op === '-' ? a.f - b.f : op === '*' ? a.f * b.f : a.f / b.f;
  return F_(r);
};
function vpow(a, e) {
  if (a.nr) return a;
  let r = V(Q(1));
  for (let i = 0; i < e; i++) r = vop(r, a, '*');
  return r;
}
/** evaluate plain maths with sqrt(…) / cbrt(…) */
function ev(text) {
  const s = clean(text).replace(/·|×/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3');
  const toks = s.match(/sqrt|cbrt|\d+\.?\d*|\.\d+|[-+*/^()]/g) ?? [];
  let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  function expr() { let v = term(); while (peek() === '+' || peek() === '-') { const o = next(); v = vop(v, term(), o); } return v; }
  function term() {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t === '*' || t === '/') { next(); v = vop(v, unary(), t); }
      else if (t === '(' || t === 'sqrt' || t === 'cbrt') v = vop(v, power(), '*');
      else break;
    }
    return v;
  }
  function unary() { if (peek() === '-') { next(); return vop(V(Q(-1)), unary(), '*'); } if (peek() === '+') { next(); return unary(); } return power(); }
  function power() {
    const b = primary();
    if (peek() === '^') { next(); const e = primary(); return vpow(b, e.q.n); }
    return b;
  }
  function primary() {
    const t = next();
    if (t === '(') { const v = expr(); next(); return v; }
    if (t === 'sqrt' || t === 'cbrt') { next(); const v = expr(); next(); return vroot(v, t === 'sqrt' ? 2 : 3); }
    if (t !== undefined && /^[\d.]/.test(t)) return V(dec(t));
    throw new Error(`unexpected ${t} in "${s}"`);
  }
  const v = expr();
  if (p !== toks.length) throw new Error(`trailing in "${s}"`);
  return v;
}
function closeOf(s, i) { let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; if (s[j] === '}' && --d === 0) return j; } return -1; }
/** TeX → plain maths with sqrt( ) / cbrt( ) */
function texMath(tex) {
  let s = String(tex ?? '');
  for (let g = 0; g < 20; g++) {
    let m = s.match(/\\sqrt\[3\]\{/) ?? s.match(/\\sqrt\{/) ?? s.match(/\\[dt]?frac\{/);
    if (!m) break;
    const i0 = m.index + m[0].length - 1, i1 = closeOf(s, i0);
    if (/frac/.test(m[0])) { const j1 = closeOf(s, i1 + 1); s = s.slice(0, m.index) + `((${s.slice(i0 + 1, i1)})/(${s.slice(i1 + 2, j1)}))` + s.slice(j1 + 1); continue; }
    s = s.slice(0, m.index) + `${/\[3\]/.test(m[0]) ? 'cbrt' : 'sqrt'}(${s.slice(i0 + 1, i1)})` + s.slice(i1 + 1);
  }
  return s.replace(/\\left|\\right/g, '').replace(/\\times|\\cdot/g, '*').replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/\\text\{[^{}]*\}/g, ' ')
    .replace(/\\[,;:! ]|\\quad|\\qquad/g, ' ').replace(/=\s*\\?,?\s*\?.*$/, '').replace(/[{}]/g, '').trim();
}
/** HTML (prompt / choice) → plain maths: √<span class="rad">…</span> → sqrt(…), ∛ → cbrt */
function htmlMath(h) {
  let s = String(h ?? '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&minus;/g, '-');
  for (let g = 0; g < 6; g++) {
    const b = s;
    s = s.replace(/<span class="fr"><span>([^<]*)<\/span><span>([^<]*)<\/span><\/span>/g, '(($1)/($2))');
    s = s.replace(/√<span class="rad">([^<]*)<\/span>/g, 'sqrt($1)').replace(/∛<span class="rad">([^<]*)<\/span>/g, 'cbrt($1)');
    if (s === b) break;
  }
  return clean(s.replace(/<[^>]+>/g, '').replace(/√(-?[\d.]+)/g, 'sqrt($1)').replace(/∛(-?[\d.]+)/g, 'cbrt($1)'));
}
const boardV = q => ev(texMath(q.board).split(/=|\\approx|\\overset|\?/)[0]);
const same = (a, b) => !a.nr && !b.nr && (a.q && b.q ? a.q.eq(b.q) : Math.abs(a.f - b.f) < 1e-9);
const out = (q, x) => (q.input === 'frac' && x.q ? x.q.pair : x.q ? x.q.value : x.f);
const num = t => ev(clean(t).replace(/(\d+)\/(\d+)/g, '(($1)/($2))'));
const tryNum = t => { try { return num(t); } catch { return null; } };
const roundTo = (x, k) => Math.round(x * 10 ** k + 1e-9) / 10 ** k;

// ---------------------------------------------------------------- families
const F = {};

F.sqSide = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Squaring gave (\d+(?:\.\d+)?)\. Which number, 0 or more, went in\?/))) return out(q, vroot(V(dec(m[1])), 2));
  if ((m = p.match(/^Squaring turns (-?\d+(?:\.\d+)?) into what number\?/))) return out(q, vpow(num(m[1]), 2));
  if ((m = p.match(/covers (\d+(?:\.\d+)?) sq \w+\. How long is one side\?/))) return out(q, vroot(V(dec(m[1])), 2));
  if ((m = p.match(/^(\d+)² = (\d+), and \2 ÷ 2 = ([\d.]+)\. Does halving undo squaring\?/))) {
    return choiceWhere(q, c => { const k = clean(c).match(/^No: halving gives ([\d.]+), not (\d+)\. The square root undoes squaring: √(\d+) = (\d+)\.?$/); return !!k && dec(k[1]).eq(dec(m[2]).div(2)) && k[2] === m[1] && k[3] === m[2] && Number(k[4]) ** 2 === Number(m[2]); });
  }
  return undefined;
};

F.principal = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/Which number does √(\d+) name\?/))) { const r = vroot(V(dec(m[1])), 2); return choiceWhere(q, c => { const k = clean(c).match(/^(-?\d+) only$/); return !!k && same(num(k[1]), r); }); }
  return out(q, boardV(q));
};

const rootCount = (k, x) => (k === 3 ? 1 : x.f > 0 ? 2 : x.f === 0 ? 1 : 0);
F.cubeEdge = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Cubing gave (-?\d+(?:\.\d+)?)\. Which number went in\?/))) return out(q, vroot(num(m[1]), 3));
  if ((m = p.match(/^Cubing turns (-?\d+(?:\.\d+)?) into what number\?/))) return out(q, vpow(num(m[1]), 3));
  if ((m = p.match(/holds (\d+(?:\.\d+)?) cubic \w+\. How long is each edge\?/))) return out(q, vroot(V(dec(m[1])), 3));
  return undefined;
};

F.rootIndex = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^What does the small (\d+) in ∛(\d+) ask\?/))) return choiceWhere(q, c => clean(c) === `Which number, used as a factor ${m[1]} times, makes ${m[2]}?`);
  if ((m = p.match(/^Fill in both: the square root and the cube root of (\d+)\./))) { const x = V(dec(m[1])); return [out(q, vroot(x, 2)), out(q, vroot(x, 3))]; }
  return out(q, boardV(q));
};

/** a choice that names a number, or "not a real number" */
function choiceSays(c) { const t = clean(c).trim(); if (/^not a real number$/.test(t)) return { nr: true }; if (/±/.test(t)) return null; /* two numbers, not one */ return tryNum(t); }
const pickValue = (q, x) => choiceWhere(q, c => { const v = choiceSays(c); return !!v && (x.nr ? !!v.nr : same(v, x)); });

F.signRoot = q => (q.input === 'choice' ? pickValue(q, boardV(q)) : out(q, boardV(q)));
F.evalSq = q => (q.input === 'choice' ? pickValue(q, boardV(q)) : out(q, boardV(q)));
F.evalCube = q => (q.input === 'choice' ? pickValue(q, boardV(q)) : out(q, boardV(q)));

F.ratRoot = q => {
  const p = htmlMath(q.promptHtml ?? q.prompt);
  let m;
  if ((m = p.match(/^Which is greater: sqrt\(([\d.]+)\) or ([\d.]+)\?/))) {
    const r = vroot(V(dec(m[1])), 2), x = V(dec(m[2]));
    const k = r.f - x.f;
    if (Math.abs(k) < 1e-12) return choiceWhere(q, c => /^They are equal/.test(c));
    if (k > 0) return choiceWhere(q, c => { const y = clean(c).match(/^√([\d.]+), because it is ([\d.]+)$/); return !!y && same(num(y[2]), r); });
    return choiceWhere(q, c => clean(c).startsWith(`${m[2]},`) && false);   // a square root does not always shrink a number
  }
  if ((m = p.match(/says sqrt\(([\d.]+)\) = ([\d.]+)\. Is \w+ right\?/))) {
    const r = vroot(V(dec(m[1])), 2), claim = V(dec(m[2]));
    if (same(r, claim)) return choiceWhere(q, c => /^Yes: /.test(c) && (() => { const y = clean(c).match(/^Yes: ([\d.]+) × ([\d.]+) = ([\d.]+)$/); return !!y && dec(y[1]).mul(dec(y[2])).eq(dec(y[3])) && dec(y[3]).eq(dec(m[1])); })());
    return choiceWhere(q, c => { const y = clean(c).match(/^No: ([\d.]+) × ([\d.]+) = ([\d.]+), so ([\d.]+) = √([\d.]+)$/); return !!y && dec(y[1]).eq(claim.q) && dec(y[1]).mul(dec(y[2])).eq(dec(y[3])) && dec(y[3]).eq(dec(y[5])) && !dec(y[5]).eq(dec(m[1])); });
  }
  return out(q, boardV(q));
};

F.rational = q => {
  const p = htmlMath(q.promptHtml ?? q.prompt);
  let m;
  const T = c => clean(c);
  if ((m = p.match(/^Is (sqrt|cbrt)\((\d+(?:\.\d+)?)\) rational or irrational\?/)) ?? (m = p.match(/^Is (∛|√)(\d+(?:\.\d+)?) rational or irrational\?/))) {
    const k = /cbrt|∛/.test(m[1]) ? 3 : 2, r = vroot(V(dec(m[2])), k);
    if (r.q) return choiceWhere(q, c => { const y = T(c).match(/^Rational: it equals (-?\d+(?:\.\d+)?)$/); return !!y && same(num(y[1]), r); });
    return choiceWhere(q, c => new RegExp(`^Irrational: ${m[2]} is not a perfect ${k === 2 ? 'square' : 'cube'}$`).test(T(c)));
  }
  if (/^Which statement is true\?/.test(p)) {
    const t = texMath(q.board).split('?')[0].trim();
    const r = ev(t);
    return choiceWhere(q, c => {
      const y = T(c).match(/^(?:√|∛)(\d+) (=|≈) ([\d.]+)$/);
      if (y) { const v = dec(y[3]).value; return y[2] === '=' ? !!r.q && same(r, V(dec(y[3]))) : !r.q && Math.abs(r.f - v) <= 0.5 * 10 ** -(y[3].split('.')[1]?.length ?? 0) + 1e-12; }
      return false;   // an irrational root has an exact value; ≈ fits its rounding
    });
  }
  if ((m = p.match(/^(sqrt\(.*?\)|cbrt\(.*?\)) = \(\((\d+)\)\/\((\d+)\)\) = .*Is it rational or irrational\?/))) {
    const r = ev(m[1]);
    return choiceWhere(q, c => { const y = T(c).match(/^Rational: it equals the fraction (\d+)\/(\d+)$/); return !!y && !!r.q && r.q.eq(Q(Number(y[1]), Number(y[2]))); });
  }
  return undefined;
};

/** consecutive whole numbers around a root */
function around(x) { const lo = Math.floor(x.f + 1e-12); return [lo, lo + 1]; }
F.boundSq = q => { const r = boardRootOf(q); return around(r); };
F.boundCube = q => { const r = boardRootOf(q); return around(r); };
function boardRootOf(q) {
  const t = texMath(q.board).replace(/\\square|□/g, '').split('<').map(x => x.trim()).filter(Boolean);
  return ev(t.find(x => /sqrt|cbrt/.test(x)));
}
F.refine = q => { const r = boardRootOf(q); const lo = Math.floor(r.f * 10 + 1e-9) / 10; return [lo, roundTo(lo + 0.1, 1)]; };

F.compare = q => {
  const p = htmlMath(q.promptHtml ?? q.prompt);
  let m;
  if ((m = p.match(/^Which is greater: (.*?) or (.*?)\?$/))) {
    const a = ev(m[1]), b = ev(m[2]);
    if (Math.abs(a.f - b.f) < 1e-12) return choiceWhere(q, c => /equal/.test(c));
    const big = a.f > b.f ? a : b;
    return choiceWhere(q, (c, i) => { const v = tryNum(htmlMath(q.choicesHtml?.[i] ?? c)); return !!v && same(v, big); });
  }
  if (/^Order from least to greatest:/.test(p)) {
    return choiceWhere(q, (c, i) => {
      const parts = htmlMath(q.choicesHtml?.[i] ?? c).split('<').map(x => tryNum(x.trim()));
      return parts.every(Boolean) && parts.every((v, j) => j === 0 || parts[j - 1].f < v.f);
    });
  }
  return undefined;
};

F.roundRoot = q => {
  const p = htmlMath(q.promptHtml ?? q.prompt);
  let m;
  if ((m = p.match(/^Is sqrt\((\d+(?:\.\d+)?)\) nearer to (\d+) or to (\d+)\?/))) {
    const mid = Q(Number(m[2]) + Number(m[3]), 2);
    // compare squares exactly: √n vs the midpoint
    const k = dec(m[1]).sub(mid.mul(mid)).n;
    return choiceWhere(q, c => (k < 0 ? c.trim() === m[2] : k > 0 ? c.trim() === m[3] : /halfway/.test(c)));
  }
  if (/Round sqrt\((\d+)\) to the nearest tenth/.test(p)) { const r = boardV(q); return roundTo(r.f, 1); }
  return undefined;
};

/** x² = p (or x³ = p) from the board: { k, p } */
function powEq(q) {
  const t = texMath(q.board);
  const m = t.match(/^(-?[\d.]*)\s*x\^(2|3)\s*([-+]\s*[\d.]+)?\s*=\s*(.*)$/);
  if (!m) return null;
  const a = m[1] === '' ? V(Q(1)) : m[1] === '-' ? V(Q(-1)) : V(dec(m[1]));
  const c = m[3] ? V(dec(m[3].replace(/[\s+]/g, '').replace(/^-/, ''))).q.mul(m[3].includes('-') ? -1 : 1) : Q(0);
  const rhs = ev(m[4]);
  return { k: Number(m[2]), p: vop(vop(rhs, V(c), '-'), a, '/') };
}
F.solveSq = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Is x = (-?\d+) a solution of x² = (\d+)\?/))) {
    const x = num(m[1]), ok = same(vpow(x, 2), num(m[2]));
    return choiceWhere(q, c => { const y = clean(c).match(/^(Yes|No): \((-?\d+)\)² = (?:\((-?\d+)\) × \((-?\d+)\) = )?(-?\d+)$/); return !!y && (y[1] === 'Yes') === ok && same(vpow(num(y[2]), 2), num(y[5])); });
  }
  if ((m = p.match(/^True or false: √(\d+) = ±(\d+)\?/))) {
    const r = vroot(V(dec(m[1])), 2);
    return choiceWhere(q, c => { const y = clean(c).match(/^False: √(\d+) = (\d+)\. It is x² = (\d+) that has the two solutions ±(\d+)\.?$/); return !!y && same(num(y[2]), r) && y[3] === m[1] && same(num(y[4]), r); });
  }
  const e = powEq(q);
  if (!e) return undefined;
  const r = vroot(e.p, 2);
  if (q.input === 'pair') return [out(q, r), out(q, vop(V(Q(-1)), r, '*'))];
  // choices: both roots, written exactly
  return choiceWhere(q, c => {
    const t = clean(c);
    if (/only|exactly/.test(t)) return false;
    const y = t.match(/^x = (.*?) or x = (.*)$/);
    if (!y) return false;
    const a = tryNum(y[1].replace(/√(\d+)/, 'sqrt($1)')), b = tryNum(y[2].replace(/√(\d+)/, 'sqrt($1)'));
    const exact = !/\./.test(y[1]) || !!r.q;
    return exact && a && b && same(a, r) && same(b, vop(V(Q(-1)), r, '*'));
  });
};

F.countSol = q => {
  const e = powEq(q);
  const n = rootCount(e.k, e.p);
  return choiceWhere(q, c => (n === 0 ? /^No real solution/ : n === 1 ? /^Exactly one/ : /^Two/).test(c.trim()));
};

F.solveCube = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/^Is x = (-?\d+) a solution of x³ = (-?\d+)\?/))) {
    const x = num(m[1]), ok = same(vpow(x, 3), num(m[2]));
    return choiceWhere(q, c => { const y = clean(c).match(/^(Yes|No): \((-?\d+)\)³ = (-?\d+)$/); return !!y && (y[1] === 'Yes') === ok && same(vpow(num(y[2]), 3), num(y[3])); });
  }
  const e = powEq(q);
  const r = vroot(e.p, 3);
  if (q.input !== 'choice') return out(q, r);
  // one real cube root, written exactly
  return choiceWhere(q, c => { const y = clean(c).match(/^x = (∛\d+|-?\d+(?:\/\d+)?)$/); return !!y && same(tryNum(y[1].replace(/∛(\d+)/, 'cbrt($1)')) ?? { nr: true }, r); });
};

F.isolate = q => {
  const e = powEq(q);
  if (e.k === 3) return out(q, vroot(e.p, 3));
  const r = vroot(e.p, 2);
  return q.input === 'pair' ? [out(q, r), out(q, vop(V(Q(-1)), r, '*'))] : out(q, r);
};

F.context = q => {
  const p = htmlMath(q.promptHtml ?? q.prompt);
  let m;
  if ((m = p.match(/s² = (\d+) gives s = (\d+) or s = -(\d+)\. Which is the side length\?/)) ?? (m = p.match(/s\^2 = (\d+) gives s = (\d+) or s = -(\d+)\. Which is the side length\?/))) {
    const unit = (p.match(/of \d+ sq (\w+)/) ?? [])[1];
    return choiceWhere(q, c => clean(c) === `${m[2]} ${unit}`);   // a length is not negative
  }
  if ((m = p.match(/has an area of (\d+) sq (\w+)\. Its side is:/))) { const r = vroot(V(dec(m[1])), 2); return choiceWhere(q, c => { const y = clean(c).match(/^(\d+(?:\.\d+)?) (\w+)$/); return !!y && y[2] === m[2] && same(num(y[1]), r); }); }
  if ((m = p.match(/covers (\d+(?:\.\d+)?) sq \w+\..*Round the side to the nearest tenth/))) return roundTo(vroot(V(dec(m[1])), 2).f, 1);
  if ((m = p.match(/^A number squared is (\d+)\. What could the number be\?/))) { const r = vroot(V(dec(m[1])), 2); return choiceWhere(q, c => { const y = clean(c).match(/^(\d+) or -(\d+)$/); return !!y && same(num(y[1]), r) && y[1] === y[2]; }); }
  if ((m = p.match(/(?:has an area of|covers) (\d+) sq \w+\. How long is each side\?/))) return out(q, vroot(V(dec(m[1])), 2));
  if (/Should she keep all those digits\?/.test(p)) return choiceWhere(q, c => /^Yes: keep extra digits while working, round only the answer/.test(c));
  if ((m = p.match(/holds (\d+) cubic (\w+)\. Its edge is:/))) {
    const r = vroot(V(dec(m[1])), 3), u = { inches: 'in', feet: 'ft', centimeters: 'cm' }[m[2]];
    return choiceWhere(q, c => { const y = clean(c).match(/^∛(\d+) (\w+), between (\d+) and (\d+) \w+$/); return !!y && y[1] === m[1] && y[2] === u && Number(y[3]) < r.f && r.f < Number(y[4]) && Number(y[4]) - Number(y[3]) === 1; });
  }
  if ((m = p.match(/holds (\d+) cubic \w+\. How long is each edge\?/))) return out(q, vroot(V(dec(m[1])), 3));
  return undefined;
};

F.multistep = q => {
  const p = clean(q.prompt);
  let m;
  if ((m = p.match(/holds (\d+) cubic \w+\. What is the area of one face\?/))) return out(q, vpow(vroot(V(dec(m[1])), 3), 2));
  return out(q, boardV(q));
};

export function solve(q) {
  const f = F[q.family];
  return f ? f(q) : undefined;
}

// ---------------------------------------------------------------- the world
/** plausible side or edge (feet) of the things the lesson measures */
const SIZE = [
  [/photo print/, 0.25, 3], [/quilt/, 2, 12], [/sticky note/, 0.08, 0.5], [/rug/, 2, 15], [/garden bed/, 2, 20], [/chessboard/, 0.5, 2.5],
  [/patio/, 5, 40], [/floor tile/, 0.08, 3], [/dance floor/, 6, 60], [/solar panel/, 1.5, 6], [/fish tank/, 0.6, 5], [/dice mold/, 0.03, 0.5],
  [/storage cube/, 0.6, 4], [/gift box/, 0.25, 3], [/ice block/, 0.05, 3], [/planter/, 0.25, 4], [/water tank/, 1, 15], [/shipping crate/, 1, 12],
];
const TOFT = { in: 1 / 12, inches: 1 / 12, ft: 1, feet: 1, yd: 3, cm: 1 / 30.48, centimeters: 1 / 30.48 };
export function sane(q) {
  const out = [], p = clean(q.prompt);
  let s; try { s = solve(q); } catch { s = undefined; }
  if (q.input === 'choice' && s === -1) out.push('no single right choice');
  let m;
  if ((m = p.match(/(?:A|For a) (square|cube-shaped) ([a-z ]+?) (?:covers|has an area of|holds|of) (\d+) (sq|cubic) (\w+)/))) {
    const hit = SIZE.find(([re]) => re.test(m[2]));
    const side = m[1] === 'square' ? Math.sqrt(Number(m[3])) : Math.cbrt(Number(m[3]));
    const ft = side * (TOFT[m[5]] ?? NaN);
    if (hit && Number.isFinite(ft) && (ft < hit[1] || ft > hit[2])) out.push(`a ${m[1]} ${m[2]} with a side of ${Math.round(side * 100) / 100} ${m[5]}`);
  }
  if ((q.family === 'boundSq' || q.family === 'boundCube') && Array.isArray(s)) {
    try { const r = boardRootOf(q); if (r.q) out.push('the root is a whole number: it does not lie between two'); } catch { /* fine */ }
  }
  if (q.family === 'roundRoot' || (q.family === 'context' && /nearest tenth/.test(p))) {
    try { const n = p.match(/covers (\d+(?:\.\d+)?) sq/); const r = n ? vroot(V(dec(n[1])), 2) : boardV(q); const t = r.f * 10; if (Math.abs(t - Math.floor(t) - 0.5) < 1e-9) out.push('a .x5 tie'); } catch { /* fine */ }
  }
  return [...new Set(out)].join('; ');
}

export default { solve, sane };
