# Quality layer: practice sweep, worked steps, check-in adapters

The same three layers the Kubo courses got in October 2026 (`kubo-curriculum/interactive/_levelup/audit/AUDIT.md`,
`_levelup/placement/PLACEMENT.md`, `K3_QUALITY_LAYER.md`), rebuilt for the lesson line (63 lessons, grades 7-8, on
mathscenes). The reader is a 12- to 14-year-old working alone. Every lesson gets:

1. **An independent oracle** (`tests/oracle/<slug>.mjs`) that works out the right answer of every practice item
   from what the student sees, and **the practice sweep** that compares it with the lesson's own answer, thousands
   of items per family.
2. **Worked steps** (`src/lesson/topics/<slug>/explain.ts`): `explain(it)` gives the steps the "Step by step" card
   shows after a miss, and the answer those steps arrive at (checked against the oracle).
3. **A check-in adapter** (`src/lesson/topics/<slug>/placement.ts`): 1-3 practice families the check-in page
   (`pages/lessons/placement.html`) may ask, so it can find where a student should start in the lesson order.

## How the lesson line's practice works (the Kubo equivalents)

| Kubo course (`core.js`) | Lesson line (`src/lesson/topics/<slug>/`) |
|---|---|
| `TYPES` | the (sub-goal, family) pairs of `plan.ts` `PLAN` (`tools/quality/load.mjs` `pairsOf`) |
| `makeItem(type, rand)` | `GENERATORS[family](R, n, subgoal)` (some lessons call the map `GENS`) in `items.ts` |
| `it.answer` | `it.answer`: a `Response` (`{kind:'num', v}`, `{kind:'frac', w, n, d}`, `{kind:'pair', x, y}`, `{kind:'choice', i}`) |
| `answerEq` / keypad / `accepts` | `it.check(response)` → `{ ok, mc?, say }`; typed numbers go through `panel.ts` `num()` (accepts −, $, %, commas) |
| `story(it)` | `it.prompt` (HTML) + `it.board` (TeX on the board) + `it.choices` + the picture the page draws |
| `classify(it, given)` | the `mc` of the verdict (`math-curriculum-essentials/misconceptions.json` ids) |
| `explain(it)` | `explain(it)` in `explain.ts`; until it exists the card shows `it.solution` |

`src/lesson/runtime/practice.ts` runs it: a walk through every sub-goal, then mixed; after a miss the "Step by
step" card (`panel.ts` `stepsCard`), the topic's canvas replay, then a twin item.

## Commands (repo root `mathscenes-lessons`)

```
node tools/quality/items-dump.mjs <slug> [--n 4] [--family f] [--subgoal sg] [--json]   # items as the student sees them
node tools/quality/sweep.mjs <slug> [<slug> ...]       # the practice sweep: 0 errors is the bar
node tools/quality/sweep.mjs --all --quiet             # every live lesson (out/quality/sweep.json)
node tools/quality/check-placement.mjs [<slug> ...]    # the check-in adapters (must pass)
node tools/quality/placement-graph.mjs                 # pages/lessons/placement/graph.json + strands.json + mc-names.json
node tools/quality/placement-sim.mjs [--n 300]         # simulated students on the check-in, real adapters, per strand
node tools/quality/placement-sim.mjs --all [--total]   # the model alone (model answers); --total: the old single-start model
node tools/walk-placement.mjs [--knows 30] [--grade 7] # click-through of the check-in page (dev server :5290)
npx vitest run tests/quality-layer.test.ts tests/lesson-<slug>.test.ts
node tools/walk-practice.mjs <slug> --no-parts          # click-through of practice incl. the steps card (dev server :5290)
```

## Two roles per lesson, and they never do each other's job

- **Oracle writer (O):** writes `tests/oracle/<slug>.mjs` only.
- **Lesson builder (B):** writes `explain.ts`, `placement.ts`, the `explain` hook in the page, and fixes the lesson
  when the sweep finds a real bug. Never edits an oracle.

Nobody deploys. Touch only your own lessons. Leave `src/lesson/runtime/`, `tools/quality/`, `pages/lessons/placement*`
to the lead.

## O: the oracle (`tests/oracle/<slug>.mjs`)

An ES module with a default export:

| Function | Returns |
|---|---|
| `solve(q)` | The right answer, worked out from `q` only. `undefined` = this family is not covered (keep that rare, say why in a comment). |
| `sane(q)` (optional) | `''`, or a short description of what is impossible or unfair in this item's world. |

`q` is the student's view of one item (`tools/quality/view.mjs` `viewOf`), exactly what `items-dump.mjs` prints:

```
{ subgoal, family, id,
  prompt,      // the question as plain text: fractions as a/b, x² as x^2, a real minus sign −
  promptHtml,  // the same as HTML (only if the plain text loses something)
  board,       // the TeX on the board (tools/quality/oracle-kit.mjs texPlain / texTable read it)
  input,       // 'num' | 'frac' | 'pair' | 'choice'
  unit,        // the word after the answer box
  pair,        // for 'pair': { lead, op, tail } around the two boxes
  choices,     // for 'choice': the button texts (plain)
  data }       // the picture data the page draws (picture / pict / pic / givens ...), solution-side fields removed
```

What `solve` returns, by `q.input`:
- `num` → a number, as the student should type it (if the question says "to the nearest tenth", the rounded value).
- `frac` → the exact value: `[n, d]`, `'a/b'`, `'w a/b'` or a number (`Q(...).pair` from the kit).
- `pair` → `[x, y]` (the two boxes, left to right).
- `choice` → the index of the right choice in `q.choices` (or its exact text).

Rules:
- **Work it out like a careful teacher, from the givens the student sees**: the numbers in the prompt, the board,
  the choices, and the picture. Read `src/lesson/topics/<slug>/DESIGN.md` (what the questions mean), the topic JSON in
  `math-curriculum-essentials/topics/` (sub-goals), `plan.ts`, and the page's `showItem` in `pages/lessons/<slug>.ts`
  (only to learn what the picture data draws). **Never open `items.ts`, `explain.ts`, the topic's maths helpers
  (`*Maths.ts` and the like), or the lesson tests**, and never run items-dump with `--answers`.
- Picture data: use the geometry and the numbers that are drawn (angles, lengths, positions, counts). Do not trust a
  semantic label the student cannot see (e.g. `kind: 'radius'` on a segment): compute what the drawing shows.
- For choices, decide which statement is true by the maths (compute the values, test each claim). Do not pick "the
  one that sounds like the lesson".
- Helpers: `tools/quality/oracle-kit.mjs` (`nums`, `fracs`, `texPlain`, `texTable`, `choiceWhere`, `round`, exact
  fractions `Q`). Nothing else from the repo.
- `sane(q)`: name what is impossible or unfair for a 7th/8th grader: negative or fractional people, a price of $0 or
  a $3,000 sandwich, a percent over 100 of a part, a survey category with 0 answers asked as "most used", a triangle
  whose angles do not make 180°, a radius of 0, a measurement nobody would get (a 40 ft pencil), a question that has
  two right answers or none, a "nearest tenth" answer whose exact value is a .x5 tie that floats can round either way.
- Then run `node tools/quality/sweep.mjs <slug>`. For every error, re-read the question as the student sees it:
  - your oracle misread the question → fix the oracle, note it;
  - the lesson is wrong (wrong answer, two right choices, an unfair item) → leave it, list it in your report with the
    item and why. **Never bend the oracle to make an error go away.**
- Report: the families covered (and any left `undefined`, with the reason), and the lesson bugs you believe are real.

## B: worked steps, check-in adapter, fixes

### 1. `explain(it)` in `src/lesson/topics/<slug>/explain.ts`

```ts
import type { Explain } from '../../runtime/item';
import { stepsFrom } from '../../runtime/explain';
export const explain: Explain = it => stepsFrom(it);          // + per-family overrides where needed
export const TEXT_OK = [/1\/0/];                              // optional: text the sweep must not flag ("1/0 has no value")
```
Hook it into the page: `import { explain } from '../../src/lesson/topics/<slug>/explain';` and pass `explain,` to
`startPractice({...})`. After a miss the runtime shows the "Step by step" card (`panel.ts` `stepsCard`, steps appear
one after another; falls back to `it.solution` when `explain` is missing, returns `null` or throws), and the topic's
canvas replay still runs.

`Explained = { steps: string[]; result: Response }`. **`result` is read from the steps, never copied from
`it.answer`** (`src/lesson/runtime/explain.ts`): the last value marked `<b class="s">…</b>` (or `<b class="a ans">`
when the lesson keeps a colour class), else the last number of the last step; for a choice, the one choice whose text
a step names or marks. So the sweep checks that **the card ends on the answer the oracle computes**: a solution line
that says 45° while the answer is 54° is an error.

What B does per lesson (the pilot pattern):
- Start with `stepsFrom(it)` and run the sweep: every pair whose steps "give nothing" or "end in X" needs work.
- Mark the answer in the solution line that reaches it: `<b class="s">${x}</b>` (or add ` ans` to the lesson's own
  colour class: `<b class="b ans">`). Use `ans()` from `runtime/explain.ts`.
- Choice items: in the lesson's choice helper, `solution: endOnChoice(base.solution, right.t)` adds `So: <right
  choice>` when no step names it yet (pilot: one line in each lesson's helper).
- Steps: 2-5, each at most ~200 characters plain, grade 7-8 words, **the lesson's own method** (DESIGN.md, the worked
  example), **the item's own numbers**, no `undefined`/`NaN`/float noise/`+ −`/double spaces. Rewrite the solution
  lines that break this, or override per family in explain.ts (`OVERRIDES[it.family]?.(it) ?? stepsFrom(it)`); if an
  override needs the generator's numbers, store them on the item as `it.ex = {...}` (`ex` is hidden from oracles).

### 2. `placement.ts`: the check-in adapter

```ts
import type { Placement } from '../../placement/types';
export const PLACEMENT: Placement = {
  picks: [{ subgoal: 'solve-whole-positive', family: 'solve', standalone: true }, { subgoal: 'solve-signed', family: 'solve', standalone: true }],
  use: it => !/calculator/.test(it.prompt),   // optional: which items may be asked (no calculator on the check-in)
  figure: it => null,                          // optional: a small SVG string when an item needs its picture
  errorLabel: { 'mc.linear-equations.undoes-in-wrong-order': 'Undoes the two steps in the wrong order' },   // optional
};
```
- 1-3 picks: practice families at the lesson's test level (the core skill of the later sub-goals), answerable
  without the lesson's canvas in under a minute. Prefer typed answers to 2-3 choices; no "calculator" items unless
  the core skill needs one.
- The check-in shows `it.prompt`, `it.board` (TeX) and the item's own input, and judges with `it.check()`. An item
  whose question needs its picture ("the lit slice", "segment B") needs `figure(it)`: a self-contained SVG (viewBox,
  no external refs, no script, at most 6 KB) in the lesson-page colours (lines `#efe6f7`, fills `#232850`, highlight
  `#ffbe5c`, second `#4fd3cf`). Otherwise pick a family that stands alone; set `standalone: true` on a pick whose
  items carry picture data the question does not need.
- `errorLabel` (optional): wording per misconception id for the end report; without it the report uses the
  catalogue's `name` (`pages/lessons/placement/mc-names.json`). `check-placement` probes the picks with typical wrong
  answers and lists the ids it sees; they must exist in `misconceptions.json`.

### 3. Fix what the sweep finds

When the oracle of your lesson exists, run the sweep. Lessons without an oracle are already swept for text, choices
and variety (`sweep.mjs --all`): on 2026-10-23, 56 errors in 9 lessons (notation like `2 + −5`, `b = −6 − −1 × 3`,
`−0`, `undefined`/`1/0` used as maths: allow those with `TEXT_OK`), 449 "plural after 1" warnings to look at, and 21
families whose same seed gives different items. Then run the sweep. Fix every real error in the lesson (generator, answer, check,
text, world, choices) and add a regression probe to `tests/lesson-<slug>.test.ts`. **Never edit an oracle.** If you are
sure an oracle is wrong, say so in your report with the item and the reasoning; the lead decides.

Done = `sweep.mjs <slug>`: 0 errors; `check-placement.mjs <slug>` passes; `npx vitest run tests/lesson-<slug>.test.ts
tests/quality-layer.test.ts` passes; `npm run typecheck` clean; `walk-practice.mjs <slug>` shows the steps card
without page errors. Warnings ("1 marbles", generic feedback) are worth a look, not a blocker.

## The check-in page (`pages/lessons/placement.html`)

A short adaptive check (about 20 questions) that gives a start lesson **per strand**, like the Kubo check-ins give one
per theme (a single start on the 63-lesson path was exact for only ~23% of simulated students: one early gap moved it).
- `tools/quality/placement-graph.mjs` → `pages/lessons/placement/graph.json`: how strongly each lesson rests on the
  others, from `math-curriculum-essentials/dependencies.json` (role × kind, along topic paths that may run through
  topics outside the lesson line, never through another lesson). Only edges from earlier lessons in the order.
- The same tool → `pages/lessons/placement/strands.json`: six strands, each an ordered list of lessons in `topics.json`
  order, every lesson in exactly one. A lesson takes the `strand` of its curriculum topic
  (`math-curriculum-essentials/topics/<id>.json`), mapped as below; `OVERRIDE` in the tool moves the few lessons the
  curriculum files elsewhere. Change the mapping there and re-run the tool, never by hand.

  | strand (id) | curriculum strands | lessons |
  |---|---|---|
  | Number and rational numbers (`number`) | Fractions, Numbers & Operations; + rational operations, exponents, roots, irrational numbers, scientific notation (filed under Algebra & Modeling) | 12 |
  | Ratio, rate and percent (`ratio`) | Ratios & Percentages, Measurement; + proportional relationships (Functions), percent applications (Algebra) | 14 |
  | Expressions, equations and inequalities (`equations`) | Algebra & Modeling (the rest) | 7 |
  | Functions and linear relations (`functions`) | Functions & Trigonometry (the rest); + linear patterns (Data & Patterns) | 4 |
  | Geometry and measurement (`geometry`) | Geometry | 20 |
  | Statistics and probability (`statistics`) | Statistics & Probability, Data & Patterns (the rest) | 6 |
- `src/lesson/placement/model.ts`: the student model (the Kubo model): a belief per lesson in log-odds; an answer moves
  it and, through the links, the linked lessons (right → the lessons below, wrong → the lessons above). Links: the
  graph, plus the order itself: within a strand every earlier lesson counts as a foundation (0.8, fading 0.85 per
  lesson between), and along the whole path the ~4 lessons just before (0.4). The next question goes where it is
  expected to narrow the **strand starts** most: per strand the entropy of "which lesson is the first one not known"
  (lessons independent given the beliefs), summed over the strands, plus 0.15 × the overall uncertainty (for the
  teacher's picture). That spreads the questions over the strands by itself (in simulation: number 3.8, ratio 3.5,
  equations 2.5, functions 1.2, geometry 5.4, statistics 2.8 of ~19), and stops early when little is left to learn.
  A grade prior (the student picks 6, 7 or 8) seeds it. A strand starts at its first lesson with a belief below 0.35
  (`START_BELOW`; below 0.5 because the grade prior is cautious, a same-grade lesson nobody asked sits at 0.4).
- The page loads a lesson's `items.ts` + `placement.ts` only when it asks that lesson. The result: one card per strand
  (its lessons as a strip: known, probably known, the start, still to learn; "Start: <lesson>", "Lesson k of n", how
  many later lessons can be skipped), the misconceptions seen (`errorLabel`), and a closed "For your teacher" part:
  questions per strand, the first lesson not known on the path read as one line, gaps, and the whole path in order with
  each lesson's strand, status, belief and how often it was asked. Saved in `localStorage` (`mathscenes.placement`,
  with `strands`); the intro shows the last strand starts.
- `placement-sim.mjs`: simulated students (grade 6-8, an ability, hidden known lessons consistent with the graph,
  slips, guesses). Default: the real adapters (every lesson with a `placement.ts`, its own items and `check()`);
  `--all`: the model alone with model answers; `--total`: the old single-start model, strand starts read off it;
  `--profile 0.5`: students who also differ per strand; `--strands file`: try another strand set. It reports per strand
  exact / within one lesson. Run it after any model, graph or strand change.
- `walk-placement.mjs`: clicks through the page like a student who knows the lessons before `--knows`; fails on page
  errors or a strand without a result; prints each strand's start next to the one the walk implies; screenshots the
  result, the teacher view and a phone-width result (`out/walk-placement/`).

**Simulation (2026-10-23, 1000 students `--all`, 600 with the real adapters, ~19 questions).** Within one lesson of
the true strand start (exact in brackets):

| | number | ratio | equations | functions | geometry | statistics | mean |
|---|---|---|---|---|---|---|---|
| old model `--all --total` | 65 (48) | 53 (40) | 76 (54) | 69 (46) | 40 (29) | 61 (51) | **60.5** (44.6) |
| strands `--all` | 77 (67) | 67 (57) | 85 (72) | 93 (71) | 68 (56) | 90 (78) | **79.9** (66.8) |
| old model, real adapters | 68 (49) | 52 (39) | 74 (53) | 70 (47) | 42 (32) | 60 (51) | **60.9** (45.1) |
| strands, real adapters | 77 (69) | 61 (52) | 84 (68) | 90 (68) | 67 (54) | 88 (74) | **77.9** (64.1) |

With strand profiles (`--profile 0.5`): 59.5% → 77.3%. The single start on the whole path also improved (exact 22% →
51%), lessons decided 90%, of those correct 89%. The two long strands stay under 80%: the simulated students know
each lesson with independent noise (sd 0.6 against a step of ~0.2 between neighbours in a strand), so an early gap in
a 14- or 20-lesson strand is often invisible. Even an oracle that knows each student's exact ability (but not the
per-lesson noise) gets ratio ~67% and geometry ~54% within one; the check-in is at or above that. Splitting geometry
in two (transformations and similarity / shapes, angles and measurement) or ratio in two (ratio and scale / percent)
did not raise the mean (79.9% with 7 strands, 80.4% with 8): the 20 questions are the limit, not the strand set. So
the six strands above, the curriculum's own domains. Tuned on the sim: the order links (strand 0.8, path 0.4), the
start threshold 0.35, the overall weight 0.15; the stopping rule and threshold mattered little (±1%).

## Pilot (2026-10-23): two-step-equations, circles, pie-charts

Oracles written blind by three separate agents; explain, adapters and fixes by B. Sweep at `--n=600`: all three 0
errors (about 85,000 items, every one answered by an oracle). The oracles agreed with every lesson answer; what they
found was in the items' **worlds and choices**:
- two-step-equations: "what does the 4 stand for" with 4 bags AND 4 pears; "Each friend paid $9" (meant as wrong) true
  when x equalled the per-friend amount; "1 marbles / 1 cones / 1 pears".
- circles: sizes that ignore the object (38 ft tabletop, 1.5-inch pizza, 0.8 cm jar lid, 2 m field, 4-inch coin, 40-inch
  can); areaBack called the bigger circle "a smaller one"; frac answers stored as a decimal whole (`w: 5.5`).
- pie-charts: "close the circle" had two valid lists in ~80% of items (the "fix only the last angle" distractor was
  within 1° too); "relabel the slice" was an honest fix when the exact share was x.5%. Lead decision: a 0-count
  category asked as a percent is intended (the topic JSON names zero-frequency cases), not a world error.
- The steps check found solution lines whose answer was not marked or not stated (flowBack box, convertRD, propCheck)
  and one family (solve-rational/firstMove) whose solution named a wrong choice's text.

The check-in: `placement-sim.mjs --all` (every lesson as if it had an adapter): 20 questions, 90% of lessons decided,
87% of those right; the single start lesson on a 63-lesson path is exact for only ~23% (within 2 lessons ~33%),
because one early gap moves it. Lead decision: per-strand starts like the Kubo themes before it goes live. Done
2026-10-23 (see "The check-in page"): six strands, within one lesson of the strand start 60.5% → 79.9%.

## Rolling out the other 60 lessons

Per lesson, measured on the pilot: O about 30-45 minutes of agent time (20-25 families; conceptual choice families
take longest), B about 30-60 minutes (mark answers, choice helper, adapter, fix 1-3 real bugs + regression probes).
Work in waves of about 6 lessons, two agents per lesson that never share files: O writes only `tests/oracle/<slug>.mjs`,
B writes only that lesson's topic folder, page hook and test; the lead runs `sweep --all --quiet`, `check-placement`,
`quality-layer.test.ts`, commits and pushes. Start with the 9 lessons the baseline sweep already flags.

## Result (2026-10-23)

All 63 lessons: an independent oracle, `explain.ts` + the page hook, a `placement.ts` adapter. Done in six groups of
ten (one O and one B agent per group, the lead committing per group). `sweep --all --quiet`: 0 errors over all 63
(about 1.1 million items per run, every family answered by an oracle); `check-placement`: 63 adapters, 0 failing;
`quality-layer.test.ts` and every lesson test pass; typecheck clean. The oracles agreed with the lessons' arithmetic
almost everywhere; what they found was in the worlds and the choices: two right choices (reflections verify, perfect
squares nearer, ratio rates, slope meaning, systems method, a 75%-of route keyed as ÷ 4), a keyed answer that was not
in the picture (functions witness pairs), false statements keyed right (3, 6, 9 called not proportional; turned
similar rectangles called not similar; 31.40 < 10π < 31.50 called undecidable), factors glued to brackets ((−2)51(−5)),
and sizes and prices that ignore the object (a 38 ft tabletop, a 28 ft marble, 37° wheelchair ramps, a $1,000 water
bottle, sales tax up to 50%). Every fix has a regression probe in its lesson test.

Lead fixes in shared code: the runtime reads every thousands comma (7,400,000) and `&minus;`; the view reads a
fraction with markup inside (x/5); `alt` is hidden from oracles; `b.ans` stays inline in a step; two oracles had
reading bugs (cylinders converted a height twice; sales-tax and dilations did not read "an").

Open:
- Picture fields that carry the answer and are still visible to oracles (the oracles never read them): map-scale
  `p.ans`, `lines.ask.v`; composite-figures `fig.area`, `fig.perimeter`; reading-maps solve overlays and the ruler's
  `mark`; scale-drawings `labels2`; one-step-inequalities graph `board`/`tests`; sampling `mark`/`bands`. Per lesson,
  make them non-enumerable or move them to the replay data.
- The steps card can push the practice panel past the screen (up to ~250 px with long choices; POLISH.md).
- The check-in per strand is within one lesson ~78-80% in simulation; ratio (61-67%) and geometry (67-68%) are lower
  because those strands are long and the budget is ~20 questions.
- A negative fraction answer is read per lesson (`resultOf` has no sign convention for `frac`); see the lessons'
  explain.ts overrides (add-subtract-rational-numbers, multiply-divide-rational-numbers, integer-exponents).

