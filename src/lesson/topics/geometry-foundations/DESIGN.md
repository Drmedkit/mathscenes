# Definitions, postulates and first proofs (Geometry, lesson 2)

Topic: `secondary-t6-17-foundations-of-geometry-definitions-postulates-and-reasoning` (31 sub-goals). Follows
`conditional-statements` (lesson 1: if-then, converse, quantifiers) in the same look: amber = hypothesis / given side,
teal = the other given / conclusion side, lime = the target and what a step earns, lavender = focus, red = wrong.

**Concept.** A geometry is a system: undefined terms (point, line, plane), definitions (names, usable both ways),
postulates (claims accepted without proof: two points / one line, Segment and Angle Addition, Linear Pair, the
parallel postulate, Corresponding Angles) and theorems (claims proved from them). A proof is a chain of statements,
each with a reason whose hypothesis is already on the page: a given, a definition, a postulate, an earlier theorem or
a property of equality. A drawing licenses only how points lie (order on a line, which lines cross, adjacency);
sizes need markings or givens. Checking examples is evidence; one counterexample refutes; a proof that uses only the
givens covers every figure, the drawing is one representative case. On a sphere (no parallel postulate) the
conclusions change: the system decides what is true.

**Models.**
- `geo.ts` + `GeoFig.ts`: exact figures (computed points, model units, y up): segments / rays / lines, congruence
  ticks, parallel chevrons, arcs and right-angle boxes, point letters, length and measure labels (60 px), words.
  `figProblems` refuses a label off the frame, on a line / arc / tick, or overlapping another label, and a measure
  label that differs from the drawn angle. `figs.ts` builds the figures (points on a line, fans, crossings,
  transversal with textbook slots 1-8, a box with skew edges, quadrilaterals, right angles).
- `ProofFrame.ts` (canvas) + `proofPanel.ts` (panel): **the proof frame** (see below).
- `Globe.ts`: the sphere (orthographic, a little from above): great circles solid in front / dashed behind,
  latitude circles, the equator + two meridians triangle with its right angles drawn exactly on the sphere.
- `Card.ts`: statement cards (one, or a grid of headed cards A-D) with role colours in the words.
- `proofs.ts`: the course's reasons and their types, and a bank of 11 short proofs (overlapping segments both ways,
  midpoint + transitive, midpoint doubled, bisector doubled, vertical angles, congruent supplements / complements,
  alternate interior / exterior and consecutive interior from the Corresponding Angles Postulate), each row with the
  rows it uses (`validOrder`), the other reasons that would also be valid (never offered as wrong), decoys with
  their misconception, the theorem it proves (citing it inside is circular), and an exact figure.

### The proof frame (reusable block for every later Geometry lesson)
- Canvas, `ProofFrame(params, frame, theme)`: Given / Prove lines (TeX), then numbered rows statement (TeX, sized to
  fit, min 50 px) | reason (words, 44 px, wrapped to at most 3 lines). Steps `frame`, `s<i>`, `r<i>`; focus
  `rings`, `ask` ('?' in a cell until it is revealed), `strike` (a circular or unlicensed line), `dim`. Pool mode
  lettered A, B, C ... for Parsons; `first` numbers a proof shown from its middle. Throws when it cannot be read.
- Panel, `proofPanel({ lines, decoys, menu, order, onPlace, onReason, onWrong, onDone })`: pass 1 Parsons: tap the
  lines in an order that works (any valid order; a line is refused while a line it uses is missing; the target only
  last; decoys refused with their own reason and misconception); pass 2 a reason menu per line (also-valid reasons
  accepted, distractors carry their misconception). The page moves the canvas half on every callback.

## The five parts
1. **The question**: Rita writes `AM = MB` beside a drawing where M only looks halfway (nothing marked, no given).
   What may go in the reason column? It looks that way (`diagram-appearance-as-given`), I measured 3.2 cm and 3.2 cm
   (`procedure-or-measurement-as-proof`), nothing yet (right) + how sure. The proof frame shows the '?' reason.
2. **Worked example**: A, B, C, D in order on a line, AC = BD; prove AB = CD. Givens and target (line 1 = the given;
   amber band AC, teal band BD) -> split each whole (Segment Addition twice; the bands split) -> substitute -> take
   away the shared BC (Subtraction; the BC pieces fade and the ticks on AB and CD appear, earned). Why not write
   AB = CD in line 1? (right / appearance / circular).
3. **Your turn** (faded): the Vertical Angles Theorem, lines 1-2 written (Linear Pair Postulate). The student picks
   line 3's reason (Substitution; the Vertical Angles Theorem = circular; Addition), line 4's statement
   (m∠1 = m∠3; ∠1 = ∠3 = figure-vs-measure; one side only), line 5's reason (definition of congruent angles; circular;
   Linear Pair = wrong pair), then its status (theorem; conjecture = examples-as-proof; postulate). The crossing
   swings: the same proof for every crossing. Callback to part 1.
4. **Prove it**: Kai measured five drawings: proved? Then the Alternate Interior Angles Theorem in the proof frame:
   Parsons with two decoys ("∠3 and ∠6 are vertical angles" = wrong pair, "m∠3 + m∠6 = 180°" = congruent pair as
   supplementary), then reasons from a menu (Alternate Interior Angles Theorem = circular, Linear Pair = wrong pair).
   The transversal swings; ∠3 and ∠6 stay equal.
5. **Practice**: all 31 sub-goals in order, then mixed.

## Sub-goal -> families (plan.ts), 56 families
| sub-goal | families |
|---|---|
| undefined-terms | undefTerm (gallery: point/line/plane vs segment/ray/angle/circle), markVsObject (dot width, line length, thick crossing, why undefined) |
| definition-as-stipulation | tiltedDef (tilted perpendicular / right angle / midpoint; an 82° near-miss), pickDef (precise vs prototype vs too loose; a definition need not list every property) |
| definition-precision | defVerdict (too broad / too narrow / works, on supplied examples and non-examples incl. the skew box edges), whichBreaks (which figure the definition gets wrong) |
| postulate | kindOf (definition / postulate / theorem / conjecture from how it was obtained), segAdd, angleAdd (numbers and expressions) |
| spherical-vs-euclidean | sphereLine (great circle vs latitude circle), sphereTriangle (90 + 90 + d), holdsOnSphere |
| conditional-statements | hypConc (incl. "q if p" order and the job of the hypothesis in a proof), toIfThen |
| conjecture-vs-theorem | conjOrThm (measured / dragged / someone says / proved), whatMakesThm |
| proof-as-justification | whichIsProof (a theorem card, a real argument, a circular argument; the theorems are proved claims, never a definition read forward), proofOf |
| givens-vs-target | givenOrProve (with figure), readGiven (lengths vs segments; a given of this problem vs a postulate) |
| reason-types | reasonType (ringed line in a bank proof), findLine (the one line of a given type) |
| segment-angle-notation | nameAngle (vertex in the middle; ∠B ambiguous), figVsMeasure (AB = 7 vs bar; m∠ vs ∠) |
| equal-vs-congruent | figVsMeasure (≅ between figures, = between numbers), defSwitch (both directions of the definition) |
| diagram-markings | readMark (ticks, box, arcs, chevrons, combined), boxSplit (the box is a measure) |
| diagram-licenses | mayConclude (unmarked near-right angle, near-equal segments, near-parallel lines), canAssume |
| one-step-inference | matchReason (definitions, Linear Pair), midAlg (midpoint / bisector with x) |
| implication-direction | validUse (converses of Linear Pair and Vertical Angles; definitions both ways), bothWays, partialDef (PA = PB off the segment) |
| equality-properties, substitution-property, addition-subtraction-property | propName, propApply (each sub-goal gets its own properties; substitution of a never-shown quantity; one-side slips) |
| equality-chains | proofFill (segment and angle chains), chainNum |
| angle-pair-chains | matchReason (Linear Pair, vertical, Angle Addition, congruent supplements), congSuppNum |
| proof-format | proofFill, formatJudge (two-column vs paragraph; filled columns are not enough) |
| circularity | findLine (cites the theorem being proved / calls the target "Given"), repairCircular |
| independent-proof | parsons (pool with a decoy; any valid order is excluded from the wrong choices), planBack |
| claim-scope | scopeOf, everySome |
| empirical-vs-deductive | evidenceVerdict (measured, dragged, finite list checked = proved, counterexample, failed attempt), tearCorners |
| counterexample | pickCounter (meets the hypothesis and fails / holds / breaks the hypothesis), afterCounter |
| representative-diagram | redraw (a general proof on a second drawing; a proof that used where D falls, refuted by drawing 2), scopeOf |
| parallel-line-theorem-proofs | pairName, proofFill (alternate interior / exterior, consecutive interior), notParallel |
| parallel-converses | isParallel (incl. vertical angles = can't tell), converseOf, algebraPar (find x so ℓ ∥ m) |
| parallel-angle-problems | angleChain (two steps, named), algebraPar |

Notes: no runtime change. Clipping is not used (the previous Geometry build found that `Path2D` clips blank the
frame in Chrome). Overlines in the panel are real combining marks (A̅B̅), so plain text keeps segment vs length.
