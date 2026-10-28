# Conditional probability and independence (secondary-t7-17, HS Statistics 6, HSS-CP.A.1-5, B.6-8)

**Concept.** A condition shrinks the sample space: only the outcomes that fit it are left, and they become the new
whole. P(A | B) = n(A and B) / n(B) counts inside that new whole; P(A and B) / P(B) is the same move with
probabilities (dividing by P(B) rescales B to 1). The event after the bar is the condition, so P(A | B) and P(B | A)
share a top but not a bottom. Independence means the condition changes nothing: P(A | B) = P(A), equivalently the
product test P(A and B) = P(A)P(B). Overlap does not decide it: disjoint events with positive probabilities are
dependent (if B happens, A cannot), overlapping events can go either way, and the empty event is the one pair that is
both disjoint and independent. Around the core: 'and' / 'or' / 'not' on displayed sample spaces, building and reading
two-way tables, relative frequencies by their whole, the addition rule, draws with and without replacement, the
multiplication rule on trees, sample-to-sample variation, and (AP extension) total probability, Bayes and base rates.

**Model: CondPic** (`CondPic.ts`): one card per picture, nine kinds. `table` (painted by the two-way-tables lesson's
`TwoWayTable`: the condition is an amber ring round one row or column and everything else dims, the part glows lime),
`grid` (the 36 rolls of a red and a blue die, sums in the cells; A tinted amber, B ringed teal, a condition dims the
cells outside it), `venn` (two circles overlapping / apart / one inside the other in a sample-space rectangle; counts,
probabilities or outcomes in the regions), `tree` (two stages, TeX branch labels, path products right-aligned, a
lime path), `chips` (outcomes 1..N or coded records), `dots` (simulated sample proportions with one value marked),
`spinner` (unequal sectors with a probability legend), `tokens` and `ctree` (counting's CountPic). Highlights are
marks ('whole', 'part', 'hlA', 'hlB', 'cond', 'path', 'rev'); practice replays 'rev' after a miss. Layout uses
estimated text widths (no DOM), throws BlockError below 60 px numbers / 44 px labels. Candidate for `src/lesson/kit/`
together with CountPic (a probability-pictures module for the Statistics course).

## The five parts
1. **The question**: 200 juniors, job x license. Pick a junior with a job: P(license)? Cards 48/200 (the condition not
   made the new whole), 48/80, 48/110 (confusion of the inverse) + how sure.
2. **Worked example** (Read, Shrink, Count, Formula) on the same table: cells are "and", margins one group; the amber
   ring closes round the Job row and the rest dims (new whole 80); 48 glows: P(L | J) = 48/80 = 3/5; the dashed ring
   round the whole table while P(L and J) / P(J) = (48/200)/(80/200) writes on, the 200s cancel. Why? (right / divide by
   200 = condition-not-made-new-whole / divide by 110 = confusion-of-the-inverse).
3. **Your turn**: 160 students, left-handed x instrument (6, 10 / 54, 90). Given: the Left-handed row ringed. Typed:
   P(I | L) = 6/16 (6/160 = new whole, 6/60 = inverse), P(I) = 60/160 (16/160, 6/160), then independent? (one-cell
   count and "sounds connected" decoys). Both are 3/8: independent. Callback to the card.
4. **Prove it**: Sam: "mutually exclusive events are independent". One die, A = {1, 2}, B = {6} in two separate
   circles. Chain: P(A and B) = 0 / P(A)P(B) = 1/18 > 0 / so dependent; then the condition dims everything but B:
   P(A | B) = 0 but P(A) = 1/3. Sam's line struck last. Decoys: disjointness-decides-independence, examples-as-proof,
   mutual-exclusivity-as-unequal-probabilities.
5. **Practice**: all 31 sub-goals, then mixed; most items show a CondPic, the highlights and hidden values come in
   on the replay.

## Sub-goal -> families (plan.ts)
| sub-goal | families |
|---|---|
| compound-sample-space | diceCount (ordered cells, merged-pairs slip), treeCount (paths, not branch labels) |
| event-intersection | andDice (incl. empty), andList (set choice; union / A / B decoys) |
| event-union | orDice (overlap once; exclusive-or slip), orList (listed once) |
| event-complement | notDice, notVenn (partial complement: B-only or neither) |
| two-way-table-structure | tableRead (joint / margin / not-category), tableFill |
| restrict-sample-space | restrictDice (one die or the grid), restrictTable (which strip is the whole) |
| conditional-notation | notationRead, notationWrite (inverse, joint, bar-as-division decoys) |
| renormalize-new-whole | spinnerCond (weights kept, not equalized), jarCond |
| zero-probability-condition | zeroOrUndef (impossible B vs empty A and B), zeroFormula |
| count-conditional | condDice (0 and 1 included), condNumbers |
| table-conditional | tableCond (row / column conditions, 2x2 and 2x3), tableSwitch (reused denominator) |
| build-two-way-table | buildCell (Y/N record cards), buildCond |
| relative-frequency-summaries | relKind (joint / marginal / conditional by the whole), relCompute (nearest %), assocClaim (no causation) |
| reverse-conditional | reverseTable, reverseClaim (news-style phrasings) |
| formula-conditional | formulaDec (decimals, percents), formulaVenn (fractions), zeroFormula |
| independence-conditional-test | indepTable (exactly independent or not), indepModel (deck facts stated, 1..N, die) |
| independence-product-test | productTest (circular-test decoy), productForward (independence stated) |
| replacement-effect | replaceCond, replaceDecide (incl. heart-then-ace: still independent without replacement) |
| general-multiplication-rule | twoDraws, treePath |
| multiplication-rule-given-probabilities | multCount (screening per 1,000; P(A)P(B given A); three stages), multChoose |
| mutually-exclusive-definition | exclWhich (disjoint, not exhaustive), exclYesNo |
| addition-rule | addTable, addGiven (or / missing overlap / disjoint), addDice |
| exclusive-implies-dependent | exclDep, exclDepWhy (the general argument) |
| overlap-vs-independence | classifyVenn (apart / independent overlap / dependent overlap / inside), classifyList |
| zero-probability-exception | emptyEvent, emptyWhich |
| sample-proportion-variation | dotsUnusual, dotsTwoGroups |
| empirical-independence-limits | approxIndep (stated 5-point tolerance; within / beyond) |
| conditional-in-context | screenTable (P(condition given positive) vs sensitivity), freeThrow (pick the comparison), laterEvent |
| total-probability | totalTwo, totalThree (machines) |
| bayes-theorem | bayesScreen (three decimals), bayesMachine (exact fraction) |
| base-rate-effect | baseRateCompare (same test, different prevalence), secondTest (posterior as the new prior) |
