# Fraction times fraction (primary.fractions.multiply-fraction-by-fraction, grade 5, 5.NF.B.4-6)

**Concept.** a/b × c/d means a/b OF c/d. Cut c/d of a whole into b equal rows and take a of them; the cuts, run on
through the whole, make b × d equal cells, and the part taken is a × c of them. So the rule (a × c)/(b × d) is a
count of cells: rows × columns taken over all the cells of ONE whole. A factor below 1 takes only part (smaller), n/n
takes all (same), above 1 takes all and more (bigger).

**Model.** `AreaModel.ts`: a painted pan of brownies (or a 1 ft garden bed / tiled square foot) as the unit square.
Steps `whole cols first rows take grid name`: d columns cut, c painted amber (first = the amount), the amber part cut
into b rows (solid cuts), a rows painted teal (second = the part taken), the cuts run on dashed through the rest of the
pan (grid), the taken cells turn lime with outlines (link = the answer named against the whole). The amber part sits
against the right edge, so leaders from the board reach the taken cells without crossing the pan. Up to 2 wholes side
by side for c/d > 1. `computeArea` counts the cells one by one and asserts a × c, b × d, b × c.
Labels: "frosted" (amber, with a bracket) above, "eaten" (teal → lime, bracket) left, "1 pan" under, on the table;
for tiles the labels are TeX side lengths. Group labels pulse while their symbol writes.

## The five parts
1. **The question**: 3/4 of a pan is frosted, Maya eats 2/3 of the frosted part. Cards 2/3 (part-taken-as-whole),
   6/12 (right), 1 5/12 (reads-of-as-addition); how sure. Board: "2/3 of 3/4 = ? of the whole pan".
2. **Worked example** (Cut, Take, Count, Write): rows cut → "1/3 of 3/4" with a leader to one row; take 2 rows →
   "2/3 of 3/4" (teal leader, "eaten" pulses); grid + name → "2 × 3 = 6 eaten" (lime leader), "3 × 4 = 12 in all"
   ("1 pan" pulses); hero "2/3 × 3/4 = 6/12" with the leader to the taken cells, "= (2×3)/(3×4)". Why: "why is 12
   the bottom number?" (whole pan cut into 12 / just the rule = denominator-meaning-unexplained / frosted part = part as whole).
3. **Your turn** 3/4 of 2/5 (Sam packs lunch from the leftover): cut + take given; kid counts against the whole
   (6/20; 3/4 or 6/8 → part-taken-as-whole, 23/20 → adds-shaded-counts), builds "3/4 × 2/5" from chips (+, − →
   reads-of-as-addition), predicts less than 2/5 (more → multiplication-makes-bigger), "6/20 < 8/20 = 2/5" on the
   board with the amber ring, 6/20 = 3/10, callback to the card picked in part 1.
4. **Prove it**: Riley says multiplying makes bigger, so 2/3 × 3/4 > 3/4. Because-chain of 3 claims from 6 chips;
   distractors = multiplication-makes-bigger, examples-as-proof, fraction-factor-always-shrinks. Evidence: rows+take,
   rings take vs frosted, grid + "6/12 < 9/12" with two leaders, then Riley's ">" is struck.
5. **Practice**: runtime walk through all 18 sub-goals, then mixed. Area items draw the pan / bed / tiles; a miss
   replays the naming of the cells and writes (a×c)/(b×d) with its leader. Bare items show the notation big.

## Sub-goal → family
| sub-goal | families |
|---|---|
| fraction-times-whole | ofWhole (q multiple of b; q < b; compare a/b of q with q × a/b) |
| unit-of-unit | areaRead (a = c = 1, denominators 2-4) |
| unit-of-nonunit | areaRead (a = 1, b 2-3, 1 < c < d ≤ 6) |
| nonunit-of-nonunit | areaRead, rule |
| equation-and-story | equation (model → equation, equation → story) |
| model-to-rule | rule (count taken / all cells; why is the bottom b·d) |
| fractional-side-area | tiles (same denominators; 1/2 · 3/4 renamed to fourths) |
| compute-proper | compute (tier 1 ≤ 10, tier 2 denominators 11-20) |
| simplify-product | simplify (to simplest form; "who is right" equivalent forms) |
| cancel-before | cancel (which first step keeps the product; simplify then multiply) |
| improper-factors | compute, areaRead (2 pans) |
| identity-zero | compute (n/n, 0/n), predict |
| mixed-number-factors | compute (mixed × proper, mixed × mixed, tier-1 list) |
| times-as-much | predict (ribbon "n/d as long as") |
| predict-size | predict (unfriendly denominators, factor <, =, > 1) |
| explain-scaling | explain (pick the reason) |
| apply-context | story (recipe, what is left, ribbon, garden area, 1 1/2 × recipe, improper amount) |
| rectangle-perimeter-area-rational | rect (perimeter, area, units, decimal sides) |
