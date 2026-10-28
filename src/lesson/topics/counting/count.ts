// count.ts: the exact counting maths of "Counting: permutations and combinations" (factorials, P(n,r), C(n,r), n^r,
// multisets, exhaustive lists for small cases, fractions in lowest terms) and number formatting. Pure: no DOM.
// Every value the lesson uses stays far below 2^53, so plain numbers are exact.

export const fact = (n: number): number => { let p = 1; for (let i = 2; i <= n; i++) p *= i; return p; };
/** ordered selections of r from n without repetition: n(n-1)...(n-r+1); 0 when r > n */
export const P = (n: number, r: number): number => { if (r > n || r < 0) return 0; let p = 1; for (let i = 0; i < r; i++) p *= n - i; return p; };
/** unordered selections of r from n distinct objects; 0 when r > n */
export const C = (n: number, r: number): number => { if (r > n || r < 0) return 0; const k = Math.min(r, n - r); let c = 1; for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i; return Math.round(c); };
/** unordered selections of r from k types with repeats allowed (multisets) */
export const multi = (k: number, r: number): number => C(k + r - 1, r);
export const pow = (n: number, r: number): number => n ** r;
/** the falling product as factors: [n, n-1, ..., n-r+1] */
export const falling = (n: number, r: number): number[] => Array.from({ length: Math.max(0, r) }, (_, i) => n - i);

export const gcd = (a: number, b: number): number => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** a fraction in lowest terms [n, d] */
export const lowest = (n: number, d: number): [number, number] => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

// ---------- exhaustive lists (small cases; the tests use them to check the formulas) ----------
/** every ordered selection of r from xs (no repeats) */
export function perms<T>(xs: readonly T[], r: number): T[][] {
  if (r === 0) return [[]];
  const out: T[][] = [];
  xs.forEach((x, i) => { for (const rest of perms([...xs.slice(0, i), ...xs.slice(i + 1)], r - 1)) out.push([x, ...rest]); });
  return out;
}
/** every unordered selection of r from xs, in list order (A B C before A B D ...) */
export function combs<T>(xs: readonly T[], r: number): T[][] {
  if (r === 0) return [[]];
  if (xs.length < r) return [];
  const [h, ...t] = xs;
  return [...combs(t, r - 1).map(c => [h!, ...c]), ...combs(t, r)];
}
/** every ordered list of length r from xs with repeats */
export function words<T>(xs: readonly T[], r: number): T[][] {
  if (r === 0) return [[]];
  return xs.flatMap(x => words(xs, r - 1).map(w => [x, ...w]));
}
/** every multiset of size r from xs, as sorted lists */
export function multisets<T>(xs: readonly T[], r: number): T[][] {
  if (r === 0) return [[]];
  if (!xs.length) return [];
  const [h, ...t] = xs;
  // the ones that use the first type (at least once), then the ones without it
  return [...multisets(xs, r - 1).map(m => [h!, ...m]), ...multisets(t, r)];
}

/** how many numbers with `len` digits, all different, from the digits `digits` (no leading zero), satisfy `ok` */
export function countNumbers(digits: readonly number[], len: number, ok: (ds: number[]) => boolean, distinct = true): number {
  const all = distinct ? perms(digits, len) : words(digits, len);
  return all.filter(ds => ds[0] !== 0 && ok(ds)).length;
}

// ---------- formatting ----------
/** 1234567 -> "1,234,567" (prompts, choices) */
export const fmtN = (v: number): string => (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-US');
/** the same in TeX: 1{,}234{,}567 */
export const texN = (v: number): string => fmtN(v).replace(/,/g, '{,}').replace('−', '-');
/** "5 × 4 × 3" (HTML / plain) */
export const prodH = (xs: readonly number[]): string => xs.map(fmtN).join(' × ');
/** "5 \times 4 \times 3" (TeX) */
export const prodT = (xs: readonly number[]): string => xs.map(texN).join(' \\times ');
/** "3! = 3 × 2 × 1" style factor list for r! (r >= 1) */
export const factFactors = (r: number): number[] => falling(r, r);
/** words for small numbers in stories ("three") */
export const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
export const word = (n: number): string => WORD[n] ?? String(n);
