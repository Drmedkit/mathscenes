# Properties and the real numbers (Algebra 1, lesson 1)

Topics: `secondary-t6-01-real-number-properties-and-classification` (properties of operations, justification,
equivalence, counterexamples) + `secondary.real-number-system-classification-and-closure` (US number sets,
exact vs display, closure, indirect proof). 25 sub-goals.

**Concept.** A property or a closure fact is a claim about EVERY number (every pair) of a set. Examples never prove
such a claim; one allowed counterexample breaks it; a general argument (letters, or an indirect proof) proves it.
The real numbers are a map: nested Counting ⊂ Whole ⊂ Integers ⊂ Rational, with Irrational beside Rational, and a
number sits where its exact VALUE belongs (12/4 = 3 with the counting numbers, √49 = 7 too, √2 irrational).

**Models.**
- `SetMap.ts`: the nested-set map. Tokens are placed by exact value (`numbers.ts`: r + s√n, r + sπ). Closure is shown
  as arrows from two inputs to the result: inside the ringed set (closed for this pair) or outside (counterexample).
  Rings, glows, strikes and fades are named tr keys (the page's `mapRig`).
- `ClaimTable.ts`: a claim (left ?= right, with its scope) tested row by row; ✓/✗ marks; a ✗ row glows red and
  the claim is struck. Rows without side values show only the letters (the student picks / types them).
- `AreaSplit.ts`: the distributive property as one rectangle cut in two (a minus strip is cut away: 7 × 98 =
  7(100 − 2)); labels first (expand) or areas first (factor).
- Practice `chain` pictures (justify-steps): the five-step rewrite 4(x + 3) + 2x → (4 + 2)x + 12 on a wide slate.

## The five parts
1. **The question**: the map with √2, π, √3 (and some rationals). Add two irrationals: always / sometimes / never
   irrational? (always = examples-as-proof) + how sure.
2. **Worked example**: place √2, −√2, √3 → try pairs (√2 + √3 stays inside; examples cannot prove "every") →
   hunt: √2 + (−√2) = 0 lands in Whole (additive inverse), the claim is struck → compare: 2/3 + 5/7 = 29/21 and
   a/b + c/d = (ad + bc)/(bd), integers over a nonzero integer: closed. Why-check: "one allowed pair that fails is
   enough" / "0 is a special case" (counterexample-as-exception) / "mostly true" (examples-as-proof).
3. **Your turn**: irrational × irrational, faded: placing and √3 · √5 = √15 are given; the student picks the pair
   (√3 · √3; √3 · √5 stays inside; 0 · √3 breaks the premise), types √3 · √3 = 3, names every set of 3
   (rational only = number-sets-not-nested; irrational = radical-sign-means-irrational). Callback to the card.
4. **Prove it**: Sam: "3 + √2 might be rational, nobody checked all the digits." Judge, then a four-line indirect
   proof from reason chips (suppose → √2 = q − 3 → closed under − → no number is both). Distractors:
   indirect-assumption-as-claim, examples-as-proof, rational-membership-by-fraction-display. The map shows q and
   q − 3 in Rational and √2 forced into Rational (struck), then 3 + √2 drops into Irrational.
5. **Practice**: all 25 sub-goals in order, then mixed.

## Sub-goal → families (plan.ts), 43 families
| sub-goal | families |
|---|---|
| commutative | commName, commSwap (claim table) |
| associative | commName, assocPair (claim table, pair input) |
| identity | identityPick, identityFill |
| additive-inverse | opposite, toZero |
| multiplicative-inverse | reciprocal, recipNum, zeroRecip |
| distributive | distArea (area, minus strip), distForm (expand / factor, area) |
| strategic-regroup | smartGroup, chainProduct |
| inverse-cancellation | cancelChain (incl. product-of-opposites and repeated-number traps), cancelWhich |
| justify-steps | nameStep, whichStep (chain slate) |
| counterexample-logic | oneCounter, proved (infinite vs finite sets; claim table) |
| equivalence-meaning | equivQ, differAt (student-chosen value) |
| identity-substitution-test | separating, ownValue |
| power-root-overgeneralization | powerEval, separating, ownValue (power/root claims) |
| us-set-names | setRule, countMembers |
| nested-subsets | allSets, subsetTrue |
| exact-vs-display | display (calculator, bar, growing gaps, "…"), approx |
| real-partition | placeIt, partitionTrue |
| closure | closedFinite, closedNamed |
| classify-rational-forms | allSets, countMembers (disguised forms) |
| classify-radicals | placeIt, countMembers, allSets (radicals) |
| closure-counterexample | counterPick, counterType |
| admissibility-check | admissible, counterPick |
| irrational-closure-counterexample | counterPick, irrValue |
| rational-closure-proof | sumForm (pair: new numerator, denominator), whyRational |
| rational-irrational-proof | contradiction, isIrrational |
