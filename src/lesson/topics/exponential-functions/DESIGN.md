# Exponential growth and decay (Algebra 1, lesson 13; secondary-t6-13, 26 sub-goals)

## Concept
Exponential change multiplies by the **same factor** over every equal step; linear change **adds the same amount**.
A percent of the *current* amount is a factor (1 ± r); a percent of the *original* amount is a fixed amount. Everything
else (a = value at 0, b > 1 or 0 < b < 1, b^k over k periods, roots for b from two points, the exponent as a count of
periods, compounding n times a year, validity of a model) follows from "same factor per equal step".

## Model
`GrowthTable.ts`: a table of values on a card; between neighbouring rows a bracket with the **ratio** (×1.1, teal) and
the **difference** (+110, water) of the last column. "Exponential" = the ratio label repeats; "linear" = the difference
label repeats. Hidden cells ('?') turn into their values on `reveal`. Graphs use the kit `Plane` (curves a·b^x, point
graphs, lines, asymptote lines). `pictures.ts` holds the serialisable picture data (question data vs `solve*`/`reveal`
data that waits for the replay).

## The five parts
1. **The question** — two accounts from $1,000: A +$100/yr, B +10%/yr; after 3 years? Cards A / the same / B
   (the same = constant-factor-as-constant-amount).
2. **Worked example** — fill in year by year (table reveals) → compare changes (differences +100, +110, +121 grow;
   ratios ×1.1 equal) → B(t) = 1000(1.1)^t with a = value at 0 and b = 1 + 0.10 → the table gives way to the graph
   (line vs curve over 20 years, $3,000 vs ≈ $6,727.50). Why-question: why $110 in year 2?
3. **Your turn** — $24,000 car, −20%/yr; year 1 done. Kid picks b (0.8 / 0.2 rate / −0.2 negative / 1.2), the model
   (vs −4,800t and (24,000·0.8)^t), types V(2) = 15,360 (14,400 = constant amount), decides whether it ever reaches $0
   (5 × 20% = 100% / goes negative) → decay curve with its asymptote. Callback to the commit.
4. **Prove it** — Maya checks three ratios of f(t) = 5·3^t. Judge; then a because-chain: substitute t + 1 / product
   rule 3^(t+1) = 3^t·3 / f(t) ≠ 0 and t arbitrary. Distractors: examples-as-proof, f(t+1) = f(t)+1 (shifted input),
   3^(t+1) = 3^t + 3 (function distributes over sum). The table grows rows t and t + 1 with ×3.
5. **Practice** — 26 sub-goals, 54 families (below), then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| repeated-factor | continueTable, twoPlans |
| decay-factor | decaySubtract, decayPick, continueTable (decay ranges) |
| ratio-test | classifyTable, roundedRatios |
| equal-intervals | stepTwo, unequalGaps |
| percent-situations | situationType, simpleVsCompound |
| long-run-comparison | overtake, aheadForever, decayVsLinear |
| model-form | evalModel, formFromTable |
| initial-value | readA, readATable |
| classify-by-b | growOrDecay, pickModel |
| graph-whole-inputs | matchPoints, twoGraphs, decayPoints |
| continuous-graph | rangeChoice, asymptote, domainChoice |
| factor-from-table | factorTable (table or labelled points) |
| backsolve-initial | backA, backAWords |
| factor-percent | factorToPct, pctToFactor |
| model-from-words | modelChoice, modelPair |
| predict | predict (money to the cent, fish, mg; one calculator entry, round at the end) |
| multi-period-factor | kFactor, kPercent |
| two-point-factor | twoPt, twoPtModel |
| exponent-period-count | periodEval, periodCount |
| rewrite-exponent-form | rewritePair, rewriteRate |
| periodic-compounding | compoundBalance, apy, principalNeeded |
| constant-ratio-proof | ratioProof, ratioOverH |
| test-extra-observations | twoModels, modelCheck |
| noisy-data-fit | noisyFit, ratioDrift |
| time-domain | contextDomain, contextRange |
| extrapolation-limits | horizon, trustModel |

Rounding: every rounded answer states its place; generators skip values within 0.02 of a .x5 tie (`nearTie`).
Superscripts with more than one token are written in brackets in HTML (2<sup>(t/6)</sup>) so the plain text stays exact.
