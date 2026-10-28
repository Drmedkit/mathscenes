# Systems of equations (secondary-t6-08, Algebra 1, lesson 8)

**Concept.** A system asks for the pairs that make BOTH equations true at once: on the plane, the points on both
lines. Beyond grade 8 (`systems-of-equations`): an equation may be REPLACED by itself plus a multiple of the other
(scaling a whole equation keeps its line; the sum line passes through the same crossing), so elimination with one or
two multipliers, cleared fractions and decimals all keep the solution set; graphs give estimates until checked;
0 = k means no solution (parallel), 0 = 0 means the whole line (not the plane, not (0, 0)); c2 vs k·c1 decides which;
method choice from structure; modelling from words / graph / table and judging viability in context.

**Model: the shared kit's Plane** (`src/lesson/kit/Plane.ts`) through `sysPic.ts`: `line` items (a x + b y = c, a
vline when b = 0), points, segments, texts. Line 1 amber (first), line 2 teal (second), new / scaled lines and the
answer lime (link), candidates lavender (pick), wrong red. A scaled equation is drawn dashed on top of its own line
(same line); the elimination result (11x = 44) is the upright line x = 4 through the crossing. Plane keys live under
`<part>g.` so they never clash with board step keys (`<part>T…`, `x.board`, `x.given0`, `x.sol0`).
Maths in `sysMaths.ts` (exact: Cramer, line / solution-set keys, written forms std / y = mx + b / x = my + k / raw).

## The five parts
1. **The question**: Ana keeps 3x + 2y = 16 and replaces 5x − 4y = 12 by second + 2 × first (11x = 44). Same
   solution? Cards: same (right) / new solution (transformed-equation-new-solution) / only 11x = 44 is left
   (keeps-only-combined-equation). Only the two lines on the plane.
2. **Worked example** (same system): graph → estimate near (4, 2) → 2 × first = same line, dashed on top → add:
   11x = 44 is the line x = 4 through the same crossing → back-substitute, check in the unused equation, (4, 2).
   Why: both true ⇒ sum true (right) / x-intercept (one-graph-intercept) / luck (new-solution).
3. **Your turn** 4x + 3y = 5, 3x − 2y = 8, faded from the end: letter chosen for you; kid picks × 2 and × 3
   (swapped = multipliers-dont-match), solves 17x = 34 (34 = stopped at 17x), reports (2, −1) ((−1, 2) = reversed).
   Callback to the card.
4. **Prove it**: Sam gets 0 = 0 for 2x − 3y = 6, −4x + 6y = −12 and writes (0, 0). Judge, then a because-chain:
   (0, 0) breaks the first / second = −2 × first: one line / every point of that line and nothing else ((3, 0) yes,
   (1, 1) no). Decoys: letters become 0 (zero-vs-no-solution), every pair works (infinite-means-every-point), many
   crossings (infinite-means-many-crossings).
5. **Practice**: 27 sub-goals in topic order, then mixed; 55 families. Graph items show the lines with the question
   (the answer point only on the solve); algebra items start on a slate and turn into the plane on the solve.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| check-pair-both | pairCheck, whichPair |
| intersection-common-solution | readCross, markedPoint |
| constraints-in-context | ctxMeaning, ctxRead (plans, tickets, bus and car) |
| bridge-graph-line-forms | siMatch, stdIntercepts, stdSlope |
| bridge-horizontal-vertical | hvWhich, hvCross, hvSlope |
| bridge-rewrite-slope-intercept | toSI (incl. 2x = 8), stdSlope |
| solve-by-graphing | readCross (standard form, rational slopes, h/v), estimateExact, roundedFails |
| graph-with-technology | techExact (rounded vs exact display), techWindow |
| substitute-isolated | subStep, subSolve (incl. set equal) |
| back-substitute-report | backSub, fullSub |
| bridge-isolate-variable | isolate, toSI |
| isolate-then-substitute | isoSubSolve, whereSub |
| replacement-preserves | replaceSum, recover |
| eliminate-ready | elimAdd, elimSub |
| eliminate-scale-one | scaleRow, scaleSolve |
| eliminate-scale-both | bothMult, anyMultiple, scaleSolve |
| rational-coefficients | clearFrac, ratSolve |
| choose-method | chooseMethod, methodsAgree |
| graph-classify | classifyGraph, cannotTell, termsCI |
| predict-by-slopes | predictSlopes, hvSlope |
| contradiction-no-solution | contraMeaning, contraSub |
| identity-infinite-line | identityMeaning, identityMember |
| connect-algebra-graph | scaledConst, sameLineForms |
| inspect-structure | inspect, chooseMethod (with inspection) |
| prove-elimination | proofDir, proofReverse |
| formulate-system | writeVerbal, fromGraph, fromTable, writeSolve |
| judge-viability | viable, planMeaning |

**Distractors.** Every choice list goes through `choice` / `fixedChoice` (itemKit.ts): an option whose meaning (the
same line, the same solution set, the same value, the same point, "it cancels") equals the answer's is dropped; the
test sweeps every family × sub-goal × 300 seeds.
