# Solving linear equations in one variable (grade 8, 8.EE.C.7)

Topic `secondary-t5-30-solving-linear-equations`, slug `linear-equations`, 22 sub-goals. Builds on
`two-step-equations` (the pan balance) and `expand-and-factor` (rewriting a side; its pure `expr.ts` is imported
read-only for term arithmetic and formatting).

## Concept
A step keeps the solutions when it does the same thing to BOTH whole sides and can be undone (add / subtract any
number or x-term, multiply / divide by a nonzero number), or when it rewrites one side without changing its value.
With x on both sides the new move is taking an x-term off both sides. Solving ends in one of three forms: `x = a`
(one solution), `a = b` false (no solution), `a = a` true (every number). A check is done in the ORIGINAL equation,
both sides.

## Model: the two-pan balance (`SidesBalance.ts`, maths + layout in `sidesMaths.ts`)
Bags (teal, the x's) and loose marbles (amber, the numbers) on BOTH pans of one beam; the beam is level exactly when
both sides are equal. Steps `stand left right takeX takeN split keep open`:
- `takeX` lifts the same bags off both pans (still level: the same unknown amount left each side), the rest re-centre
  and marbles drop to the pan when no bag is left (layout phase B);
- `takeN` lifts the same marbles off both pans; `split` lines the bag pan up in p rows and the marble pan in the same
  p rows (phase C); `keep` ghosts all rows but one (one bag | x marbles);
- `open` turns every bag into a value v: the labels under the pans become the pan totals and the beam tips by their
  difference. The difference never changes under a both-pans move, so 2x + 5 = 2x + 9 tips the same way for every v
  and an identity never tips. A value strip on the table (x = 0 … 8) collects every tried value: lime dot = level.
- `focus.gone` + `focus.tilt` ghost items on ONE pan and tip the beam: wrong moves are shown, not told.
Exact maths in `lin.ts` (sides as written: terms and groups f(e), exact Q, solve → one / none / all) and
`solving.ts` (worked solution lines ending with the check in the original, equation generators per sub-goal, the
typed-solution classifier). `computeSides` refuses what it cannot draw; `loose` pictures (try a value, take bags off)
allow any positive solution, rows only for whole solutions 1 … 9.

Colour roles follow the balance of two-step equations: x-terms / bags teal (`second`), numbers / marbles amber
(`first`), the move lavender (`pick`), the answer lime (`link`), strikes red. Board: equations aligned on `=`, the move
written under both sides (− x | − x, − 3 | − 3, ÷ 4 | ÷ 4), one leader from the final value to the kept row (only when
that row is on the right pan, so the leader never crosses the other pan), the check as two lines (left: …, right: …).

## The five parts
1. **The question** 5 bags + 3 = 1 bag + 15. Cards 3, 2 (the bag moved across without changing sign:
   moves-term-without-sign-change), "Can't tell: bags on both pans" (only-constants-cross) + how sure.
2. **Worked example** four subgoal steps: Take a bag off both pans (4x + 3 = 15) → Take 3 off (4x = 12) → Split into
   4 rows (x = 3, leader to the kept row) → Check both sides (bags back and open: 18 | 18, `left: 5(3) + 3 = 18`,
   `right: (3) + 15 = 18 ✓`). Why: "why may a bag come off when nobody knows what is in it?" (same amount off both /
   move-and-change-sign as a reason / only numbers may come off).
3. **Your turn** 3x + 11 = 5x + 3, faded from the end: the bags come off by themselves (11 = 2x + 3); the kid picks the
   next move (3 off both pans / 3 off the right pan only → the beam tips, one-side-only / 11 off both), types one bag
   from the rows (4 = x; 16 and 8 are diagnosed), checks both sides of the original (23 | 23; 23 and 3 =
   evaluates-one-side-only); callback to the card.
4. **Prove it** Jordan: 2x + 5 = 2x + 9 → 5 = 9 "so x = 0". Judge, then a because-chain: taking 2 bags off both pans
   gives 5 = 9 (the bags lift, the beam stays tipped) → 5 = 9 is false whatever x is (the bags open with 0 … 8, the
   strip fills with no level value) → no solution, and x = 0 is not one (x = 0 struck, `no solution`, `at x = 0: 5 ≠ 9`).
   Distractor chips: zero-vs-no-solution, no-solution-means-error.
5. **Practice** every sub-goal in topic order, then mixed (runtime/practice.ts). Pictures: the balance (solve replay,
   take bags off, try a value, sweep 0 … 8), stacked board lines (two equations), or the bare board.
   `?sg=<sub-goal id>` practises one sub-goal only (teacher jump; the walk uses it to reach later parts).

## Sub-goal → families (plan.ts)
| # | sub-goal | families | picture |
|---|---|---|---|
| 1 | s1-check-both-sides | checkBoth (verdict with both sides; one-side trap: the left value equals the first number on the right), evalSides (type both sides) | balance, try the value |
| 2 | s1-equivalent-equations | sameSet (domain −2 … 2; same set vs one shared value vs looks) | two lines |
| 3 | s1-same-number-both-sides | keepStep (which line keeps the solutions; counterexample feedback), noResolve (same solution without solving) | bare / two lines |
| 4 | s1-variable-term-both-sides | varStep (subtract / add an x-term; why it keeps the solutions) | balance, bags off |
| 5 | s1-expression-rewrite | rewrite (distribute, collect, copied onto the other side, wrong rewrite) | two lines |
| 6 | s1-nonzero-condition | zeroStep (× 0 gains solutions; which step changes them; ÷ x loses x = 0) | bare |
| 7 | s1-solution-set-types | howMany (one / none / every number with a structural reason vs checked examples) | balance sweep |
| 8 | s2-collect-integer | solve, nextLine (collect the x-terms) | balance solve / bags off |
| 9 | s2-negative-coefficients | solve, nextLine (−x = k, k = x, −ax = b) | bare |
| 10 | s2-expand-positive | solve, nextLine (expand) | bare |
| 11 | s2-negative-factor | solve, nextLine (expand a negative factor) | bare |
| 12 | s2-fraction-coefficients | solve (fraction answers), nextLine (clear denominators; any common multiple) | bare |
| 13 | s2-decimal-coefficients | solve (incl. a money story), checkOrig (a check in a derived line proves nothing) | bare / two lines |
| 14–17 | s3-one / no / infinitely-many / classify-mixed | classify (solution set; x = 0 vs no solution, leftover constant as a value, cancellation misread) | balance when drawable |
| 18 | s3-structure-predict | predict (compare coefficients, then constants) | bare |
| 19 | s3-construct-examples | construct (one blank, two blanks, changing a constant, ax/b vs (a/b)x) | bare |
| 20 | s3-properties-of-equality | nameProp (property name vs the bare arithmetic) | two lines |
| 21 | s3-written-justification | argue (the sentence that finishes the argument) | bare |
| 22 | s3-context-interpret | context (phone plans, gyms, bike shops; a solution outside m ≥ 0) | bare |

Every misconception id the topic JSON names is classified somewhere (the test checks this against
misconceptions.json). Tests: `tests/lesson-linear-equations.test.ts`; click-through: `tools/walk-linear-equations.mjs`
(`ONLY=practice`, `N_PRACTICE=…`, `SGS=…`). No runtime change was needed.
