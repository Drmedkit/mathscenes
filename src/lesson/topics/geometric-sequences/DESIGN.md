# Geometric sequences (Algebra 1, lesson 14) — design

Topic `secondary-t6-14-sequences-geometric`, slug `geometric-sequences`, 23 sub-goals (HSF-BF.A.2, HSF-IF.A.3,
HSF-LE.A.2, HSF-LE.A.1.c, HSF-IF.C.8.b). Requires `arithmetic-sequences`, and is built as its pair: the same strip, the
same five beats, the same proof; "+ d" becomes "× r". Goes on to ratios that are fractions, decimals and negative,
the n − 1 exponent, terms far apart (extension), the zero-based index and relabelling vs rewriting, percent change as
a factor, story models with units, first crossing of a threshold, model type, and repairing a broken model.

## Concept
A geometric sequence is a function on the whole numbers n where every term is the SAME FACTOR r times the term
before (a_1 ≠ 0, r ≠ 0). Term n is n − 1 multiplications after a_1, so a_n = a_1 · r^(n−1); the exponent counts the
hops, the front number is the first term. With a zero-based index (n = periods passed) the exponent is n. The
points (n, a_n) are separate points on a curve, not a line.

## Model
- `GeoStrip.ts` (block): the indexed strip of arithmetic-sequences' SeqStrip, but the arc under each neighbour pair
  carries the FACTOR (×2, ×½, ×(−3)); an optional second, dim row of arcs carries the differences (+3, +6, +12) so a
  list is tested both ways side by side. Values are exact rationals drawn as TeX (fractions, or decimals with `dec`).
  Steps `card vals hops adds reveal`; focus `lit` (count the n − 1 multiplications), `hot` (a ratio that breaks),
  `ring`, `idxK`, `dimA`. Throws when a value or label would not fit (60 px numbers). Could move to the kit with
  SeqStrip as one strip with a + / × mode.
- `pictures.ts`: strip over a kit `Plane`: points, a dashed guide curve a·r^(x−k) ("only whole n"), the open dots of
  the arithmetic guess for contrast (`cmp`), an open ring at n = 0 (the rewrite's coefficient, not a term), a
  threshold line. Practice pictures hold the answer-side steps (`hold`, `reveal`, `count`) for the replay.
- `geo.ts`: exact rationals (q, mul, div, pow), terms, ratios, the tests, and every form in TeX and HTML.
- Colour roles: first (amber) = values / the start; second (teal) = the factor r and its hops; link (lime) = the
  answer, revealed values, counted hops; water = the arithmetic guess; pick = focus, Kai's checks; wrong = a broken
  ratio, "is never a term".

## The five parts
1. **The question** — phone tree: round 1 has 3 people, each round twice as many; round 8? Cards 384 / 768
   (n-steps-for-nth-term) / 24 (constant-factor-as-constant-amount: adds 3 each round); how sure.
2. **Worked example** — check every hop (×2; the dim + row shows +3, +6, +12: not arithmetic) → count the hops to
   round 6 (five, they light up, a_6 = 3 · 2⁵ = 96) → any round: a_n = 3 · 2^(n−1), check n = 1, round 8 = 384 →
   the graph: points on a curve, the open dots of "add 3" fall behind, only whole rounds. Why 2⁷? right /
   n-steps / index-shifted-by-one (round 0).
3. **Your turn** — a_1 = 96, a_n = ½ a_(n−1). Done for you: the terms, r = ½. Kid: the explicit form (choices:
   n-steps, exponential-initial-value-as-growth-factor), which term is 3 (typed n = 6; 5 = n-steps), is 0 a term (no:
   halving never reaches 0; yes = constant-factor-as-constant-amount, "drops 48 each time"). Callback to part 1.
4. **Prove it** — Kai checks G(n) = 12 · 2^(n−1) against a_1 = 12, a_(n+1) = 2a_n at n = 1, 2, 3 and calls it
   proved. Judge (yes = examples-as-proof), then a because-chain: same seed / same factor for every n / so every
   term. Distractors: examples-as-proof, shifted-input-added-to-output (G(n+1) = G(n) + 1),
   algebraic-rewrite-resets-index-domain (12 · 2^(n−1) = 6 · 2ⁿ "so the first term is 6"; the picture shows the ring at
   (0, 6) on the guide).
5. **Practice** — every sub-goal in order, then mixed (runtime/practice.ts), 46 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| seq-index | termRead, indexDomain |
| ratio-whole | findR, ratioCheck |
| classify-arith-geo | classify, whichGeo |
| ratio-fraction | findRfrac, findRdec |
| ratio-negative | findRneg, signCause |
| notation-evaluate | fEval, shiftNote |
| recursive-generate | recNext, recList |
| recursive-write | recWrite, recFromStory |
| explicit-derive | countHops, deriveWhy |
| explicit-evaluate | evalTerm, evalFrac |
| explicit-write | writeExp, expFromTable |
| translate-forms | recToExp, expToRec |
| nonadjacent-ratio (ext.) | gapRatio, gapCube |
| nonadjacent-formula (ext.) | backFirst, backFormula |
| index-zero | zeroStart, zeroOrOne |
| reindex | relabel, relabelValue |
| rewrite-same-index | rewriteCoef, rewriteVsRelabel |
| factor-percent | factorPct, compound |
| context-model | ctxEval, ctxMeaning |
| context-threshold | firstCross, crossCheck |
| justify-model-type | modelType, critique |
| justify-forms-agree | agreeWhy, agreeStep |
| diagnose-index | fixModel, fixValue |

## Item rules (for the oracle)
- Values are exact: fractions stay fractions (typed in the fraction box), decimals only where they terminate (0.8,
  51.2, 409.6); money in cents. A typed negative non-whole ratio is asked "as a decimal" (−0.5).
- Threshold items: "at least" / "at most" a round number that no term equals; the answer is the first index n (with
  the stated start, 0 or 1) whose exact value is past it. Calculator allowed.
- Guards against special values: no a_1 = r where swapping start and ratio would give the same sequence, no r = ±1
  in the ratio/formula families, no distractor list or formula that equals the right one, no gap-2 difference ÷ 2
  that equals ±√q.
