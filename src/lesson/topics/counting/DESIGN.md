# Counting: permutations and combinations (secondary-t7-16, HS Statistics 4, HSS-CP.B.9)

**Concept.** Count by structure, not by key words. Two tests decide the structure: the **swap test** (does swapping
two choices give a different outcome? then order matters) and the **reuse test** (is a choice still available after
it is used? then repeats are allowed). Successive choices multiply (a uniform tree), disjoint cases add. Ordered
without repeats is a falling product, P(n, r) = n!/(n − r)!; an unordered group of r distinct objects appears exactly
r! times among the ordered selections, so C(n, r) = P(n, r)/r!. That division only works when every outcome is
overcounted the same number of times (not with repeated types). Audits: a forbidden outcome counted, one outcome
reached by two paths, an overlap counted twice, a valid outcome left out; verification means a full list, a second
independent method or a structural argument, not bounds or a smaller case. Probability = favorable/total with the same
outcome model (ordered or unordered) on top and bottom. Grade 7 `probability` gives P = favorable/all for one trial;
this lesson goes to compound events counted by formula.

**Conventions (stated in the items).** Committees, teams, hands, toppings, handshakes: no roles (stated "no roles"
where it could be doubted). Officers, medals, seats, playlists: one person per role. Codes may start with 0; a
k-digit number may not. Probabilities: any equivalent fraction is accepted, the key is in lowest terms. Big products
carry "(calculator allowed)"; everything else stays within the topic's by-hand policy (3 digits × 1 digit, ÷ one digit).

**Model: CountPic** (`CountPic.ts`, maths in `count.ts`): one card per picture, five kinds. `slots` (one box per
choice with its count, the role under it, × between, rows joined by + or −, a division row under a bar for ÷ r!,
sample tokens above; hidden counts are "?" until the replay), `tree` (uniform tree, first branch grown, the rest on
the replay), `grid` (organized lists; one row per committee with its orders: the 10 × 6 picture of 60 = 10 × 3!),
`venn` (two sets, totals, overlap; the "only" regions on the replay), `tokens` (people / flavors, two group colors,
the chosen ones lifted with a lime ring). Colour roles: amber (first) = the ordered count / slots, teal (second) =
the r! orders / a second group, lime (link) = the answer, lavender (pick) = a sample choice, red = struck. It throws a
BlockError when boxes, chips, labels or leaves would not fit at 60 px numbers / 44 px labels. Candidate for
`src/lesson/kit/` (slots and tree would serve probability, sequences and the discrete course).

## The five parts
1. **The question**: five friends (tokens), a 3-person committee, no titles. Cards 60 (5 × 4 × 3:
   counts-orders-as-different), 10, 20 (÷ 3: divides-ordered-count-by-selection-size) + how sure.
2. **Worked example** (Slots, List, Swap, Divide): roles first, the five friends above three slots 5 × 4 × 3 = 60,
   a sample slate Ben/Dev/Ana lifts; the grid of all 60 slates, 10 rows of 6; ring row {A,B,C}: one committee, 3! = 6
   slates; divide: 60/3! = 10, the slot picture with the ÷ 3 × 2 × 1 row, C(5, 3) = 5·4·3/3! = 10. Why? (right / "3
   people, divide by 3" = divides-by-r / "names drawn one after another" = chooses-method-by-key-words).
3. **Your turn**: 7 runners in a 400 m final. Given: the podium slots 7, 6, 5. Typed: podiums 210 (343 = keeps all
   choices, 21 = n × r), orders of one trio 6 (3 = ÷ r), trios to state 35 (210 = orders as different, 70 = ÷ 3).
   Callback to the card.
4. **Prove it**: Jo: "more ways to choose the 5 starters than the 2 on the bench". Tokens A-G (three starting fives
   lift in turn) and a bench pair → starting five list. Chain: each five leaves one pair / each pair gives back one
   five / a one-to-one match means equal counts, C(7, 5) = C(7, 2) = 21; Jo's line is struck last. Decoys:
   expects-complement-choose-larger, identity-seen-as-coincidence, examples-as-proof.
5. **Practice**: all 25 sub-goals, then mixed; CountPic pictures with hidden counts revealed on the replay.

## Sub-goal → families (plan.ts)
| sub-goal | families |
|---|---|
| enumerate-compound-outcomes | listCount (tree, first branch grown), missingOutcome (organized list, one gone) |
| swap-test-order | swapTest (roles vs no roles, "one after another" trap), swapList (12 ordered vs 6 groups) |
| reuse-test-repetition | reuseTest, reuseCount (with / without putting back) |
| represent-unordered-repetition | scoopList (type counts, no formula), sameCup |
| classify-2x2 | classify, classifyTests (combination lock, handshakes, "one at a time" committees) |
| product-principle | menu (2-4 stages, calculator variant), productMissing |
| sum-principle | orAnd (one OR one, one AND one), codeLengths (25 + 125, 100 + 1,000, 26² + 26³) |
| ordered-with-repetition | pinCount (PINs, T/F keys, codes), codeVsNumeral (leading zero) |
| ordered-without-repetition | officers (incl. r > n = 0, calculator n), lineUp (n!) |
| factorial-notation | factorialEval (0! = 1), factorialMeaning |
| permutation-formula | permFormula (r = 0, 1, n), permCancel |
| combinations-as-division | groupsDivide, handshakes, overcountFactor |
| combination-formula | combEval (C, nCr, binomial; r = 0, n; calculator), combPick |
| combination-symmetry | symShortcut (C(20, 18) = C(20, 2)), symCompare |
| multi-group-selections | twoGroups (C·C; pooled and added slips), chooseOrder (relay C·r!, chair C·r) |
| restricted-positions-first | restrictFirst (fixed / end places, no leading zero), evenDistinct (case split 72 + 256) |
| complement-counting | atLeastOne (total − all juniors), repeatDigit (n^r − P(n, r)) |
| choose-method-mixed | mixedCount (same n, r; five structures), methodPick |
| probability-from-counts | probComm, probBag, probCode |
| audit-impossible-choices | auditImpossible (leading zero, one person two roles, restriction, repeat), repairCount |
| audit-double-counting | doubleCount (senior-first), teamsHalve (unnamed teams) |
| overlap-repair | vennCount, divisibleOr (lcm, not product) |
| uniform-overcount-check | uniformCheck (distinct vs repeated types), timesCounted (1 vs 2, 3 vs 6) |
| completeness-check | listComplete, skippedCase (a length or a first digit left out) |
| verify-count | verifyMethod (list / second method / structure vs bounds, smaller case, formula), listVerify |
