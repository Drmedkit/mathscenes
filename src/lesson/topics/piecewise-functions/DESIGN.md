# Piecewise and step functions (Algebra 1, lesson 10; secondary-t7-12, F-IF.C.7.b, F-IF.A.1-2, F-IF.B.5, F-BF.A.1.a)

Slug `piecewise-functions`, 24 sub-goals, 49 families. Requires `solving-linear-equations` (testing a number against
an inequality, open / closed dots on a number line); builds the graph side on the shared kit Plane.

## Concept
A piecewise function is ONE function written with several rules, each paired with an input condition. The input picks
the rule: test it against the conditions, use the one that holds. At a breakpoint the symbol decides (≤ / ≥ takes the
point in, < / > leaves it out); an input no condition covers has no output (not 0). On the graph each rule is drawn
only over its interval: a filled dot where the condition includes the end, an open dot where it leaves it out, one
filled dot at a continuous join if either piece owns it, nothing joining a jump. A step function is the special case
with every piece constant; "per started unit" closes each step on the right (round up), "per completed unit" on the
left (round down, the floor). Contexts: threshold words → < ≤ > ≥, tiers that charge the higher rate only above the
threshold, counts (dots) vs measures (segments), the size and direction of a jump; curved pieces keep only solutions,
intercepts and range inside their own interval.

## Model: the kit Plane, pictures as data
`pw.ts` (exact maths: serialisable rules lin / quad / exp / rec, conditions, f(x), owners, TeX + HTML formatting,
windows), `pic.ts` (GPic: pieces with open / closed / no end, points, segs, lines; `pieceParts` draws a rule correctly;
`reveal` = solution-side parts and a trace, hidden from the oracle), `graph.ts` (GPic → kit Plane; linear rays get an
arrow head where they leave the window, a short seg keyed `<piece>~a`). Colour roles: first piece lime (`link`),
second teal (`water`), third amber (`first`), focus / vertical tests lavender (`pick`), wrong red.

## The five parts
1. **The question** f(x) = x + 2 (x ≤ 3), 2x − 4 (x > 3): what is f(3)? Cards 5 / 2 (breakpoint-always-second-piece)
   / undefined (breakpoint-always-undefined) + how sure. Axes only, the rule on the board.
2. **Worked example** f(1): test 1 ≤ 3, the point (1, 3) on the ghost line → the first rule only for x ≤ 3 (the
   ghost line goes, the filled end at (3, 5)) → the second only for x > 3 (open end at (3, 2)) → read f(3): the
   vertical at 3, ring on the filled dot, f(3) = 5. Why: the symbols decide / listed first wins (by appearance) / both
   apply (several pieces).
3. **Your turn** $4 per started hour, 0 < t ≤ 4, steps 1-2 drawn. The kid picks the $12 step's dots (open at 2,
   filled at 3; the closed-left and both-filled answers draw in red), then prices 2 h 20 min ($12; $8 = rounds to the
   nearest). Callback to the card.
4. **Prove it** Mia: "g is not a function, its graph breaks". g(x) = 2 (x < 1), x + 3 (x ≥ 1). Because-chain: every
   input gets an output (conditions cover all, 1 included) / no input gets two (the vertical at 1 meets only the
   filled dot; the open dot is not on the graph) / so g is a function (one output per input; a vertical line sweeps
   across and meets the graph once). Distractors: function-must-be-connected, function-prototype-too-narrow,
   open-dot-counted-as-point. Mia's line is struck.
5. **Practice** every sub-goal in topic order, then mixed. A Plane per item on the left with the rule on the board
   (answer-side parts come in on the replay after a miss), option graphs A-C across the stage, or the rule on a slate.

## Sub-goal → families (plan.ts)
| # | sub-goal | families |
|---|---|---|
| 1 | read-function-notation | evalOne (linear / constant, f(p + q) trap), readPoint (f(a) = b as a point; f(p + q) vs f(p) + f(q)) |
| 2 | pick-piece | whichRule (2-3 pieces, integer / decimal inputs), whichInput |
| 3 | boundary-ownership | ownerAtBreak (rule 1 / rule 2 / both / neither), nearBreak (a − 0.1, a, a + 0.1) |
| 4 | one-function-many-rules | isFunction (jumps, joins, a constant piece), manyToOne |
| 5 | step-as-constant-pieces | isStep (unequal / falling steps vs one sloped piece), stepRead (incl. at the jumps) |
| 6 | evaluate-interior | evalPiece, evalBoth (pair) |
| 7 | evaluate-boundary-domain | evalBreak (left / right owner, both strict, outside the domain: average, 0, extended rule), isolatedPoint |
| 8 | endpoint-dots | dotFill, joinDot (filled join vs hole), readOpen |
| 9 | restrict-branch-graph | pieceGraph (graphs A-C: whole line, flipped), segEnds |
| 10 | assemble-piecewise-graph | wholeGraph (graphs A-C: connector, all filled), graphPoints (pair) |
| 11 | threshold-language | phraseCond (9 phrases), twoThreshold (gap / overlap sets) |
| 12 | step-graph-context | startedCost (just below / at / above / mid), startedGraph (graphs A-C) |
| 13 | completed-unit-steps | completedPay, whichWay (started vs completed interval) |
| 14 | greatest-integer-extension | floorEval (⌊x⌋, int(x), [[x]], negatives), floorSolve |
| 15 | intervals-from-graph | condFromGraph (swapped, y-values, all strict), joinOwner |
| 16 | write-from-graph | ruleFromGraph (slopes /1 /2 /3, secant, gap, swapped), pieceLine (pair m, b) |
| 17 | context-model | tierCost (data plan, electricity, overtime, van, postage first ounce), tierRule |
| 18 | count-domain | domainKind (count / measure / whole cents), countGraph (graphs A-C) |
| 19 | coverage-audit | findGap (missing point / interval, declared exclusion, full), gapFix |
| 20 | overlap-audit | overlapOk, overlapInput |
| 21 | repair-endpoint-errors | findError (marker, value, missing dot, connector), fixDot |
| 22 | threshold-decision-context | jumpMeaning (size, direction, units), atThreshold (at, just past, rounding trap) |
| 23 | nonlinear-piece-graphs | nlEval (quadratic, 2^x, k/x pieces), nlSolve (keep roots inside the interval) |
| 24 | nonlinear-piecewise-key-features | nlRange (restricted parabola + constant, open top), nlFeature (asymptote, domain, range, intercepts) |

Every misconception id is checked against misconceptions.json in the test; every picture is built on the kit Plane in
the test (120 seeds per family). No runtime or kit change. Walk: `tools/walk-piecewise-functions.mjs`.
