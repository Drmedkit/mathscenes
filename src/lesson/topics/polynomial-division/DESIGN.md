# Polynomial division (Algebra 2, lesson 4)

Topic `secondary-t7-05-polynomial-division-long-and-synthetic`, slug `polynomial-division`, 25 sub-goals, 52 families.
Requires `polynomial-identities` (multiplying and expanding polynomials, identities true for every x).

## Concept
Dividing P by D (not the zero polynomial) means writing P = D·Q + R with R = 0 or deg R < deg D, the same line as
47 = 6 · 7 + 5 (but the stopping test is degree, not size). Long division builds Q one term at a time: divide the
leading terms, subtract that term times the WHOLE divisor, keep every lower term; each step keeps P = D·Q + S true
(the product gains tD, the residual pays it back) and lowers the residual's degree, so it ends. Synthetic division is
the same work for D = x − c with the x's left out: it adds c·t because long division subtracts −c·t. Dividing by D,
P/D = Q + R/D only where D(x) ≠ 0, while P = D·Q + R holds for every x. R = 0 means D is a factor.

## Models (kit candidates, both in this folder)
- `LongDiv.ts`: the US bracket layout, one column per power (dividend written complete with 0 placeholders), quotient
  above its column, per cycle a product row −(t·D) and, under a rule, the full new residual. Steps `frame`, then per
  cycle `q<i>`, `m<i>`, `s<i>` (a solve animates row by row). Focus: rings on rows, struck cancelled leading terms, a
  quotient term asked ('?'), the remainder glowing. Throws below 60 px type (the page then tries a wide frame, then a
  slate).
- `SynthTab.ts`: the synthetic tableau: c in its box, the coefficient row, the products (with a multiply arrow from
  the bottom entry before), the rule, the bottom row; the remainder fenced off. Steps `frame`, `b0`, then `m<j>`,
  `b<j>`. Focus: a bottom entry or c asked ('?'), a column ringed, the remainder glowing.
- Reused read-only: `polynomials/ProductBox.ts` (the reverse area model: divisor down the left, partial products in
  the cells, the top side '?' until the solve), `polynomials/poly.ts` (writing terms).
- `pd.ts`: dense exact-rational coefficient rows, `divide` (cycle by cycle), `synth`, writing (TeX / HTML, Q + R/D
  with brackets that keep the plain text unambiguous).

## The five parts
1. **The question**: 47 = 6 · 7 + 5, then (x² + 5x + 7) ÷ (x + 2) on the bracket. Cards x + 4 (adds the remainder to
   the quotient), x + 3 + 1/(x + 2), x + 7/2 (term by term) + how sure.
2. **Worked example**, the layout row by row: x² ÷ x = x → x(x + 2) subtracted, x² struck, 3x + 7 → 3, then 1 →
   stop (degree 0 < 1): P = (x + 2)(x + 3) + 1 and P/D = x + 3 + 1/(x + 2), x ≠ −2. Why stop: degree / size like
   5 < 6 (integer-remainder-criteria) / must reach 0 (division-requires-zero-remainder).
3. **Your turn**: synthetic division of x³ − 7x + 9 by x − 2, faded from the end: setup and first column given; the
   kid types −3 (slips: −11 subtracts-product, −7 recurrence-slip), 3 (15, −5), then reads Q and R (quotient-degree,
   remainder-as-coefficient). Callback to the card.
4. **Prove it**: Kai's "that is the rule" (memorized-rule-as-justification), then a because-chain: P = D·0 + P;
   P = D(Q + t) + (S − tD); the leading terms cancel; the degree drops so it ends with deg R < deg D. Decoys:
   examples-as-proof, memorized rule, residual-not-compensated, requires-zero-remainder.
5. **Practice**: all 25 sub-goals, then mixed.

## Sub-goal → families
| sub-goal | families |
|---|---|
| pdqr-roles | roleName, rebuildP |
| remainder-degree-bound | stopCheck, remCandidates, smallDividend |
| reverse-area-model | areaSide, areaSide3 (ProductBox) |
| rational-form-restriction | excluded, restrictionPick |
| q-plus-r-over-d | rewriteQR, qrFill |
| zero-remainder-factor | isFactor, factorPick |
| ld-layout | layoutRow, placeholderCount |
| ld-next-term | monoDivide, nextTerm |
| ld-residual-update | subtractRow, updateChoice |
| ld-iterate-stop | ldFull, ldRemainder, ldQuotientPick |
| ld-nonmonic-linear | nonmonicQ, nonmonicFrac |
| ld-quadratic-divisor | quadDivR, quadDivQ |
| sd-scope | sdApplies, sdC |
| sd-coefficient-row | coefRow, rowBack |
| sd-recurrence | sdNext, sdLast |
| sd-decode | sdDecodeQ, sdDecodeCoef |
| sd-link-long-division | linkBottom, linkWhyAdd (both layouts side by side) |
| inspection-rewrite | inspectLinear, inspectSquare |
| method-select | methodPick, methodDo, ldRemainder |
| verify-expand | verifyClaim, firstMismatch |
| verify-remainder-bound | finishedPick, smallDividend |
| numeric-spot-check | spotValue, spotVerdict |
| update-invariant | invariantStep, cycleCount |
| domain-identity-contrast | domainCheck, domainFix |
| apply-known-factor | factorFull, boxDims, quotientFirst |

Every choice list goes through `common.ts keyed` (a wrong option with the same value key as the right one is dropped);
the order of two factors is free (`pairItem` `free`). Pictures never show Q or R before the answer: the layout shows
the divisor and the dividend (or the cycles before the asked one), the tableau shows the entries before the asked one.
