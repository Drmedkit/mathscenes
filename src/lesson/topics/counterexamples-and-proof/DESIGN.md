# Counterexamples, inference and proof (Geometry, lesson 3)

Topic: `v2.extension.counterexample-inference-and-proof` (15 sub-goals). Follows `conditional-statements` (if-then,
converse, inverse, contrapositive, quantifiers) and `geometry-foundations` (definitions, postulates, the two-column
proof frame) in the same look: amber = hypothesis, teal = conclusion, lime = what is earned, lavender = focus, red =
a counterexample / wrong.

**Concept.** A universal claim "for every x in D, if p then q" can be broken by ONE checked counterexample (in D,
p true, q false; a value with p false is not one, and there are no "exceptions"), and established only by an
argument that covers every member of D: examples never do, unless D is finite and every case is checked. A general
argument names an arbitrary member with a declared integer letter (2m, m an integer; a second number gets its own
letter). From a true conditional you may detach (p, so q), chain (p -> q, q -> r, so p -> r) and conclude by modus
tollens (not q, so not p); affirming the conclusion and denying the hypothesis are invalid, shown by a countermodel
(premises true, conclusion false) even when the conclusion happens to be true. A converse needs its own proof; the
contrapositive always agrees (four cases). "p -> q" reads "p is sufficient for q", "q is necessary for p", "p only
if q"; an "if and only if" claim needs both directions; a condition can be necessary, sufficient, both or neither.

**Models.**
- `Pairs.ts` (new): an even number as dots in pairs (two rows, a column per pair), odd = pairs + one extra dot. A
  general number is a few columns, "⋯", a last column and a brace ("a = 2m"). Two groups join into one row; two
  extra dots meet and become a pair. The dot argument is stated for nonnegative integers (0 = no dots).
- `Nest.ts` (new): the law of syllogism: P in Q in R (chain) or P and R side by side inside Q (unmatched middle).
- Reused read-only: `Euler` + `eulerLayout` (conditional-statements): P inside Q with the places a member can stand
  (one place: something follows; two: nothing follows), the shapes decided by their marks, number line-ups for
  countermodels and converses; `CaseTable` (conditional-statements): value tables (hypothesis / conclusion columns
  wait as '?') and the four-case table; `ProofFrame` + `proofPanel` (geometry-foundations): the two-column proof,
  Parsons ordering with decoys and a reason menu; `GeoFig` + `proofs.ts` (geometry-foundations): the vertical-angle,
  congruent-supplements and alternate-interior proofs with exact figures; `Card.ts` (geometry-foundations).
- Number-properties' `ClaimTable` was not needed: its claims are equalities (left ?= right); the claims here are
  property conditionals, which `CaseTable` with T / F columns shows directly.

## The five parts
1. **The question**: Lena checks n² + n + 41 for n = 0..5 (table, all prime): is "for every whole number n" proved?
   Proved (`examples-as-proof`), not proved yet (right), false because six checks are too few
   (`failed-argument-as-disproof`) + how sure.
2. **Worked example** (sum of two even integers is even; dots left, proof frame right): an example (4 + 6: five pairs,
   one case only) -> name any even integer (a = 2m, b = 2n, braces; line 1) -> join the pairs (2(m + n); lines 2-3)
   -> conclude (m + n is an integer; lines 4-5, the whole domain covered). Why two letters? (right /
   `one-letter-for-two-quantities` / a wrong reason).
3. **Your turn** (odd + odd is even, faded): line 1 (two letters, declared integers; one letter, 3 and 5 =
   `numbers-inside-general-proof`, "any numbers" = `defines-variable-incompletely`), line 3 (2(m + n + 1): the two
   extra dots pair up), the reason of line 5 (definition of even integer; a numeric check, the definition of odd,
   the claim itself = circular). Callback: n = 40 gives 1681 = 41 × 41.
4. **Prove it**: Mateo's "n is even if and only if n + 1 is odd" with one direction proved: proved? (`iff-one-
   direction-only`) Then the other direction in the proof frame: Parsons with two decoys (n + 1 = 2n + 1 = one letter;
   n = 4 = numbers inside), reasons from a menu ("checked with n = 3", "Mateo's direction read backward" = converse).
   The Euler picture: the two regions are one.
5. **Practice**: all 15 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 33 families
| sub-goal | families |
|---|---|
| counterexample | cxPick (value table; candidates with hypothesis true / false, 0, 1, negatives and 1/2 with their squares supplied), cxJudge (an offered candidate; "an exception"), cxShape (shapes with printed definitions, Euler) |
| generality-of-proof | examplesProof (n² + n + 41, circle regions, finite domain fully checked = proved, measured triangles), argCovers (the dot argument covers nonnegative even integers), afterProof (no exceptions after a proof) |
| general-representation | repPick (odd, two evens, consecutive, multiples; with dots), repWhyInt (m = 2.5 breaks "2m"), repRead (which kind is 2(m + n) + 1 ...) |
| detachment | detach (Euler places: one = q follows; only q given = nothing yet), detachWhich |
| chaining | chain (Nest: chain or unmatched middle), chainValid (reversed chains, three links) |
| direct-proof | proofFill (parity / divisibility proofs, a statement or a reason), proofAngle (vertical angles, congruent supplements with figure) |
| invalid-inference | validForm (all four forms, numbers with a true conclusion), countermodel (Euler line-up) |
| proof-audit | auditFind (circular, unjustified, hidden a = b, correct controls incl. a cited earlier theorem), auditKind (defect vs false claim) |
| converse-truth | converseJudge (true converses with a proof, false ones with a counterexample), converseCx (Euler) |
| contrapositive-equivalence | fourCases (four-case table), mustBeTrue (true, false or converse known) |
| modus-tollens | tollens (Euler places; denying the hypothesis = nothing follows), formName |
| sufficient-condition | suffRead, suffTrue |
| necessary-condition | necRead ("only if"), necTrue |
| iff-proof | iffParts, iffJudge (both proved / one proved / the other direction false) |
| classify-condition | classify (numbers, inequalities, angles, stipulated rules; "neither"), classifyWhy |

Notes: no runtime or kit change. Every pool, relation and argument form is verified in the test; every choice list
goes through `kit.choiceItem` (exactly one right). `Pairs` and `Nest` could move to the kit.
