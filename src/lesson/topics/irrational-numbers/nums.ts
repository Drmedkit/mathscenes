// nums.ts: numbers as they are WRITTEN (TeX for the board, HTML for the panel) next to their exact VALUE (realMaths).
// The topic is about exactly that gap: sqrt 49 is written with a root sign but is the natural number 7; 22/7 is written
// like pi's neighbour but is rational. Pure: no DOM.
import { fr } from '../../runtime/item';
import { rad } from '../perfect-squares/items';
import { type Real, type Rep, PI, decStr, frac, parseDec, repToFrac, repTex, sqrt } from './realMaths';

export { rad };
export const MINUS = '−';
export const hNum = (s: string | number): string => String(s).replace(/^-/, MINUS);
/** a repeating block with a bar over it (CSS .ov in the page) */
export const ov = (s: string): string => `<span class="ov">${s}</span>`;
export const repHtml = (r: Rep): string => `${r.int}.${r.pre}${ov(r.rep)}`;
export const repDotsHtml = (r: Rep, n = 6): string => { let s = r.pre; while (s.length < Math.max(n, r.pre.length + 2 * r.rep.length)) s += r.rep; return `${r.int}.${s}…`; };

export type NumKind = 'int' | 'frac' | 'mixed' | 'dec' | 'pct' | 'rep' | 'sqrt' | 'sqrtfrac' | 'sqrtdec' | 'pi' | 'pattern';
export interface Num { tex: string; html: string; kind: NumKind; rational: boolean; x?: Real }

export const I = (v: number): Num => ({ tex: v < 0 ? `-${-v}` : String(v), html: hNum(v), kind: 'int', rational: true, x: frac(v) });
export const Fr = (p: number, q: number): Num => ({ tex: `${p < 0 ? '-' : ''}\\tfrac{${Math.abs(p)}}{${q}}`, html: `${p < 0 ? MINUS : ''}${fr(Math.abs(p), q)}`, kind: 'frac', rational: true, x: frac(p, q) });
export const Mx = (w: number, n: number, d: number): Num => ({ tex: `${w}\\tfrac{${n}}{${d}}`, html: `${w}&#8202;${fr(n, d)}`, kind: 'mixed', rational: true, x: frac(w * d + n, d) });
export const Dc = (s: string): Num => { const [a, L] = parseDec(s); return { tex: s, html: hNum(s), kind: 'dec', rational: true, x: frac(Number(a), 10 ** L) }; };
export const Pc = (v: number): Num => ({ tex: `${v}\\%`, html: `${v}%`, kind: 'pct', rational: true, x: frac(v, 100) });
export const Rp = (r: Rep): Num => { const [p, q] = repToFrac(r); return { tex: repTex(r), html: repHtml(r), kind: 'rep', rational: true, x: frac(p, q) }; };
export const Sq = (a: number, sign: 1 | -1 = 1): Num => { const x = sqrt(a, 1, sign); return { tex: `${sign < 0 ? '-' : ''}\\sqrt{${a}}`, html: `${sign < 0 ? MINUS : ''}${rad(a)}`, kind: 'sqrt', rational: Number.isInteger(Math.sqrt(a)) && Math.round(Math.sqrt(a)) ** 2 === a, x }; };
export const SqF = (a: number, b: number, rational: boolean): Num => ({ tex: `\\sqrt{\\tfrac{${a}}{${b}}}`, html: rad(fr(a, b)), kind: 'sqrtfrac', rational, x: sqrt(a, b) });
export const SqD = (s: string, rational: boolean): Num => { const [a, L] = parseDec(s); return { tex: `\\sqrt{${s}}`, html: rad(s), kind: 'sqrtdec', rational, x: sqrt(Number(a), 10 ** L) }; };
export const PIn: Num = { tex: '\\pi', html: 'π', kind: 'pi', rational: false, x: PI };
/** a non-repeating decimal pattern (no exact Real here: its digits are a rule, not a fraction) */
export const Pat = (digits: string, rule: string): Num => ({ tex: `${digits}{\\ldots}`, html: `${digits}…`, kind: 'pattern', rational: false, x: undefined, ...{ rule } });
export const PATTERNS: { d: string; rule: string }[] = [
  { d: '0.1010010001', rule: 'one more 0 each time' },
  { d: '0.12345678910', rule: 'the counting numbers written one after another' },
  { d: '0.2022022202222', rule: 'one more 2 each time' },
  { d: '5.1211211121111', rule: 'one more 1 each time' },
  { d: '0.010110111', rule: 'one more 1 each time' },
  { d: '3.03003000300003', rule: 'one more 0 each time' },
];
/** a decimal a / 10^L for TeX and HTML */
export const decT = (a: bigint, L: number, trim = false) => decStr(a, L, trim);
export const decH = (a: bigint, L: number, trim = false) => hNum(decStr(a, L, trim));
