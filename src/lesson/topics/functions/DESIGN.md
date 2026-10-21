# Function concept and identifying functions (grade 8, 8.F.A.1)

Topic `secondary-t5-32-functions-concept-and-representations`, slug `functions`, 18 sub-goals.

## Concept
A function gives **every allowed input exactly one output**. Outputs may repeat (many-to-one and constant relations are
functions); what breaks it is ONE input with two outputs, or (when the complete input set is stated) an allowed input
with no output. The test always starts from the inputs: follow every arrow that leaves an input, read every row with
that input, or slide a **vertical slice** to that input on a graph. One such input is a counterexample; checking only
some inputs proves nothing about the rest, but a complete check of a finite input set (or an argument about every
input, like "x² is one calculation") does. Reading the record the other way (output → input) can break it.

## Model: one relation, three pictures (`relation.ts` + three blocks)
- `relation.ts`: exact maths. `checkFunction` (over the inputs that occur, or over a stated input set: a missing
  output is a witness), the witness quoted from the pairs, `sharedOutput`, `duplicateRow`, `flip`, domain / range as
  distinct values, rules (y = ax + b, y = c, y = ax² + b, y = a|x| + b), the four two-variable equations of the topic,
  segment domain / range as inequalities. The page asserts at load that the explain-part relations say what the script
  says.
- `MapDiagram.ts`: two painted ovals (inputs amber, outputs teal), values ≥ 60 px (names 50), arrows start right of
  the widest input and end left of the widest output, so they never cross a value; `flip` turns every arrow round.
  Focus: rings on values, arrows in pick (being followed) / link (allowed) / wrong (witness), dimming.
- `PairTable.ts`: the same pairs as a vertical or horizontal table (row bands in a role colour, pulses); used on the
  model side in practice and as the notation on the board in parts 2-3 (the table writes row by row as each arrow is
  followed, so arrow ↔ row are linked by a shared pulse).
- `FnGraph.ts`: a crisp signed grid, tick numbers only at the plot's outer edges (never on a line), axis names input
  (amber) / output (teal), beads (closed) and rings (open), paths clipped to the plot, point labels on plates placed
  by a search that refuses curves, beads and other labels; `qual` mode for unnumbered story graphs. Focus: the
  lavender **slice** with a ring on every output it meets, a horizontal guide, point colours. Equal-scale grids are
  centred in the frame.
- `board.ts`: rows of words on the board (label 44 px over a value line, words 52 / numbers 62), with write-on, dim
  and a strike. Practice boards are TeX for equations, the page sans for words, names and sets.
- Roles: first (amber) = input, second (teal) = output, link (lime) = allowed / the answer, wrong (red) = the witness,
  pick (lavender) = the slice / what is being followed.

## The five parts
1. **The question**: five students → birthday months (Ava and Cara share March). "Which way is a function?" Cards:
   only student → month (right), only month → student (`output-uniqueness-replaces-function-test`), both
   (`reverse-relation-assumed-function`) + how sure.
2. **Worked example** (same record): Start at the inputs (oval pulse, table header on the board) → Follow every arrow
   (each arrow lights, its row writes) → Shared outputs are fine (March arrows + rows lime, "student → month: a
   function") → Flip it (arrows turn round, the March arrows turn red, the table becomes month | student with the two
   March rows red, "month → student: not a function"). Why? one output per student, sharing allowed (right) /
   no two inputs may share (`function-means-one-to-one`) / only the first arrow counts (`mapping-first-arrow-only`).
3. **Your turn** (faded from the end): five points on a grid, (1, 3) and (1, −4) share an input, (−3, 2) and (3, 2)
   share an output. Given: the points read into the board table. Kid: which input has two points on its slice
   (picking ±3 = `output-uniqueness-replaces-function-test`; the slice then sweeps every input) → does the shared output
   break it (yes = `function-means-one-to-one`; a lime guide at y = 2) → which sentence proves it (output 2 has two
   inputs / "fails the vertical line test" = `nonfunction-justification-missing-witness`). Callback to the part-1 pick.
4. **Prove it**: Jordan: "y = x² is not a function, 2 and −2 both give 4". Judge (right: Jordan is wrong; distractors
   `function-means-one-to-one`, `requires-linearity`), then a because-chain: each x gives one value of x² (squaring is
   one calculation; the slice sweeps x = −2..2, one hit each) → sharing the output 4 is allowed (different inputs may
   share; guide at y = 4, both points labelled) → y = x² is a function (a function needs exactly one output per input;
   "not a function" struck). Distractor chips: straight line (`requires-linearity`), checking x = 1, 2, 3 is enough
   (`examples-as-proof`).
5. **Practice**: every sub-goal in topic order, then mixed (runtime/practice.ts); after a miss the picture replays the
   solution (witness arrows / rows / slice) and the key fact is written on the board.

## Sub-goal → families (plan.ts)
| sub-goal | families | picture | main misconceptions |
|---|---|---|---|
| relation-pairs | readMap, pairsCount | map / pairs | mapping-first-arrow-only, reverses-coordinate-order |
| exactly-one-criterion | mapVerdict, pairVerdict | map / pairs | function-means-one-to-one, output-uniqueness, constant-rule-not-function, first-arrow |
| allowed-inputs | statedSet, contextInputs | map with a stated set | every-input-part-of-definition, absent-input-invalidates-function, domain-ignores-excluded-inputs |
| table-recognition | tableVerdict | table (vertical / horizontal, sorted or not) | output-uniqueness, repeated-identical-pair-not-function, constant-rule |
| graph-as-pairs | readPoint, outputAt | graph (1 or 2 per grid line) | reverses-coordinate-order |
| domain-range-sets | domainRange | pairs / table / map / points | domain-range-swap, relation-without-function-has-no-domain |
| graph-recognition | graphVerdict | points, horizontal / vertical line, parabola, sideways parabola, circle, two pieces | every-relation-is-function, function-must-be-connected, requires-linearity, constant-rule, one-to-one |
| domain-range-intervals | segInterval | segment with open / closed ends | endpoint-style-convention, domain-as-endpoint-points, domain-range-swap, flat-segment-as-zero |
| explicit-rule-recognition | ruleVerdict, ruleOutput | rule / word rule | requires-linearity, constant-rule, one-to-one, even-power-of-negative-negative |
| pair-satisfies-equation | whichPair, pairYesNo | equation | reverses-coordinate-order, checks-one-coordinate, even-power-of-negative-negative |
| implicit-equation-check | implicitShows | sideways parabola, circle, vertical line (labelled pairs) | every-relation-is-function, examples-as-proof |
| match-representations | sameFn | table or points + rule | examples-as-proof, checking-never-proves-anything |
| sample-vs-complete | sampleOrAll | table | few-terms-fix-unique-rule |
| compare-outputs-common-input | compareAt, crossover | table / points + rule | mismatched-comparison, generalizes-comparison-from-one-input |
| counterexample-witness | pickWitness, witnessInput | table / points / map with a missing input | one-to-one, nonfunction-justification-missing-witness, repeated-identical-pair |
| examples-dont-prove | enoughProof | points / complete table / rule | examples-as-proof, checking-never-proves-anything |
| context-direction | bothWays, reverseWitness | complete record (item → price, student → locker, time → °F) | reverse-relation-assumed-function, one-to-one, output-uniqueness |
| qualitative-graphs | readStory, sketchStory | story graph / sketch choices | flat-segment-as-zero, graph-as-picture, same-direction-means-same-rate |
