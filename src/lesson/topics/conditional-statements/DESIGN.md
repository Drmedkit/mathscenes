# If-then statements and logical language (Geometry, lesson 1)

Topic: `v2.extension.logical-reasoning` (13 sub-goals). First lesson of the Geometry course: it sets the look
(Euler regions in amber / teal, a truth table on the board, shapes decided by their marks).

**Concept.** A statement over a stated domain is true or false; "if p, then q" claims that every member with p
also has q. In a picture: region P (hypothesis, amber) sits inside region Q (conclusion, teal). The only members
that can break it sit in P outside Q; members outside P never do (false hypothesis = no promise). The converse
reads Q -> P (Q outside P breaks it), the inverse ~p -> ~q (same as the converse), the contrapositive ~q -> ~p (the
same picture read from the outside: always agrees with the original). "All" = no exception; "some" = one witness;
negations swap them ("not all" = "some ... not", "not some" = "no"), keeping the domain and the boundaries.

**Models.**
- `Euler.ts` (+ pure `eulerLayout.ts`): domain box with its name; P and Q as rounded regions in five layouts
  (nested, overlap, same, apart, one) chosen from the data; members are numbers or drawn shapes (right-angle squares,
  tick marks) that start in a line-up in value order (no answer shown) and fly into their zones (`sort`). Focus:
  zone fills (P, Q, notP, notQ, pq, p, q, o), glows/rings, a red strike on a counterexample, label pulses.
- `CaseTable.ts`: truth table / value table, key columns then statement columns, T lime / F red, '?' cells,
  rings on rows, column or single-cell reveal. Rows TT, TF, FT, FF match zones pq, p, q, o.
- Practice cards: a statement on a wide slate in coloured words (hypothesis amber, conclusion teal), the solve adds
  the formed statement.

Colour roles: amber = p and ~p (the hypothesis's meaning), teal = q and ~q, by meaning in every form (the converse
visibly starts teal); lime = true / the witness; red = false / the counterexample; lavender = focus / negation zone.

## The five parts
1. **The question**: Ms. Reyes: "If you score 90 or more, then you get an A." Who can say she broke it? Jo 95 / B
   (right), Max 85 / A (inverse-error), Lee 80 / B (false-hypothesis-breaks-conditional) + how sure. Promise picture.
2. **Worked example** ("if n is a multiple of 4, then n is even", integers 1-12): name the parts (regions + labels,
   p, q, p -> q on the board) -> sort the domain (amber inside teal: true) -> the four cases (table row by row with
   its zone: 8 TT, none TF, 6 FT, 7 FF; only TF is F, and that zone is empty) -> swap: the converse (6 breaks it).
   Why-check "why does 7 not break it?" (right / false-hypothesis / converse-assumed-true).
3. **Your turn** ("if x > 6, then x > 3", integers 0-9), faded: named and sorted for you; negate x > 6 (x < 6 =
   negation-as-opposite), form the contrapositive (inverse = forms-mixed-up, converse = contrapositive-as-converse,
   x < 3 = negation-as-opposite; picture: outside teal lies inside outside amber), break the inverse (5; 8 =
   false-hypothesis, "none" = inverse-error). Callback to the card.
4. **Prove it**: Sam: "every quadrilateral here with four right angles has four equal sides; I checked A and D"
   (two squares). Judge, then a because-chain disproof by counterexample (B, the rectangle) and its negation.
   Distractor chips: all-limited-to-checked-examples, false-hypothesis-breaks-conditional (the rhombus C),
   not-all-means-none.
5. **Practice**: all 13 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 28 families
| sub-goal | families |
|---|---|
| statement-truth-value | statementKind (true / false / open / not a statement), openTruth (count over a domain; even-integer domain, boundary) |
| negate-simple | negateIneq (Euler, boundary), negateProperty (positive, acute, temperature, won), negBoundary (Sam's x < a: which value makes both false) |
| conditional-form | ifThen ("q if p", "whenever", "every A is B"), hypConc |
| conditional-truth | breaker (which n breaks it; Euler), caseValue (a case in words / a number put in / unrelated clauses; truth table) |
| form-converse | whichConverse, converseTrue (Euler; true converses from equal sets) |
| biconditional | iffMeans, iffTrue (Euler), ifAsIff (everyday promise read as iff) |
| universal-quantifier | allTrue (one property or if-then over a domain), implicitAll (claims about any integer) |
| existential-quantifier | someTrue (witness; "some" when all qualify), witnessCount |
| logical-equivalence | equivOnD (value table on a stated D), formsEquiv (truth table of p -> q vs a related form) |
| negate-universal | negAll, negAllWitness (shapes A-F decided by their marks) |
| negate-existential | negSome, negSomeTruth (exactly one of "some" / "no" is true) |
| form-inverse | whichInverse (boundaries, only-one-clause, contrapositive), inverseFalse (Euler) |
| form-contrapositive | whichContra, nameForm |

Every wrong answer the classifier recognises carries its catalogue id (`items.ts` MC table; the test checks every
id against misconceptions.json). Every domain is stated in the prompt, so each truth value is decidable.
Notes: no runtime change. Clipping with `Path2D` (`clip(path)` / `addPath`) broke the canvas context in Chrome for
the rest of the frame; Euler clips with plain context paths instead.
