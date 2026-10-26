# Arithmetic sequences (Algebra 1, lesson 9) — design

Topic `secondary-t6-10-sequences-arithmetic`, slug `arithmetic-sequences`, 21 sub-goals (HSF-IF.A.3, HSF-BF.A.2,
HSF-LE.A.2). Goes past the 7-8 `linear-patterns` lesson: index notation, recursive and explicit forms, the n-th
term, which term has a value (and whether it is a term at all), sequences as functions on the whole numbers, the
first term vs the intercept, rewriting and relabelling (index 1 → index 0), and the general equivalence proof.

## Concept
An arithmetic sequence is a function on the whole numbers n: term number n above, value a_n below, the SAME jump d
from each term to the next. Term n is n − 1 jumps after a_1, so a_n = a_1 + d(n − 1) = dn + (a_1 − d): its points
(n, a_n) lie on one line with slope d, but only the points at whole n belong.

## Model
- `SeqStrip.ts` (block): the indexed table strip. Steps `card vals jumps reveal`; a gap in the indices gets a '…'
  column; focus `lit` (count the n − 1 jumps), `hot` (a jump that breaks the pattern, wrong colour), `ring`,
  `idxK`. Throws when a value or jump label would not fit its column (60 px numbers).
- `pictures.ts`: strip over a kit `Plane` of the discrete graph (points, stairs run 1 / rise d, dashed "linear
  extension", an open ring at (0, a_1 − d), named points). Practice pictures hold the answer-side steps
  (`hold`, `reveal`, `solvePts`) for the replay after a miss.
- `seq.ts`: exact maths (terms, differences, position of a value incl. not-whole / before / after / d = 0) and
  every form in TeX and HTML.
- Colour roles: first (amber) = values / the start; second (teal) = the jump d, stairs; link (lime) = the answer,
  revealed values, counted jumps; pick = term numbers in focus, Kai's checks; wrong = a broken jump, n = 13.5.

## The five parts
1. **The question** — stadium: row 1 has 14 seats, each row 3 more; row 40? Cards 131 / 134 (n-steps-for-nth-term)
   / 120 (drops-start-value); how sure. Strip with jumps and the points.
2. **Worked example** — check every jump (d = 3) → count the jumps to row 6 (they light up: five) → any row n:
   a_n = 14 + 3(n − 1), check n = 1, row 40 = 131 → read the graph: stairs (run 1, rise 3), dashed linear
   extension, slope = d, only whole rows. Why 39 jumps? right / drops-start-value / first-term-treated-as-index-zero.
3. **Your turn** — a_1 = 50, a_n = a_(n−1) − 4. Done for you: the terms, d = −4. Kid: the explicit form (choices:
   n-steps, term-to-term-rule-as-position-rule), which term is 2 (typed n = 13; 12 = n-steps), is 0 a term (no:
   n = 13.5; yes = discrete-quantity-allows-fractions). The graph shows (13, 2) and the empty spot at 13.5.
   Callback to the part-1 card.
4. **Prove it** — Kai checks A(n) = 6 + 4(n − 1) against a_1 = 6, a_(n+1) = a_n + 4 at n = 1, 2, 3 and calls it
   proved. Judge (yes = examples-as-proof), then a because-chain: same seed / same step for every n / so every
   term. Distractors: examples-as-proof, shifted-input-added-to-output (A(n+1) = A(n) + 1),
   first-term-treated-as-index-zero-value (4n + 2 → "first term 2", the picture shows the ring at (0, 2)).
5. **Practice** — every sub-goal in order, then mixed (runtime/practice.ts), 44 families.

## Sub-goal → families
| sub-goal | families |
|---|---|
| common-difference | findD, consistent |
| function-notation | fRead, fMeaning |
| index-notation | termAt, neighbor |
| discrete-linear-graph | graphRead, graphPick |
| recursive-generate | recNext, recTwo |
| recursive-write | recWrite, recFinite |
| explicit-derive | countJumps, deriveForm |
| explicit-evaluate | evalFar, evalMoney |
| explicit-from-list | formFromList, formFromGraph |
| solve-for-position | whichN, isTerm, constCase |
| explicit-from-two-terms | twoTerms, gapD, determined |
| recursive-to-explicit | recToExp, recToExpChoice |
| explicit-expanded-form | expand, slopeOf |
| explicit-to-recursive | seedOf, expToRec |
| forms-equivalence | equivWhich, equivPair |
| collinear-justification | whyLine, slopeBetween |
| first-term-vs-intercept | firstVsZero, interceptTerm |
| recursive-notation-shift | shiftRule, shiftBound |
| reindex-explicit | reindexExp, sameTerms |
| reindex-recursive | reindexRec, relabelBound |
| context-index-choice | ctxValue, ctxModel |
