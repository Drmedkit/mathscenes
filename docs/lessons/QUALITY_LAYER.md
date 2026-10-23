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
node tools/quality/placement-graph.mjs                 # pages/lessons/placement/graph.json from dependencies.json
node tools/quality/placement-sim.mjs [--n 300]         # simulated students on the check-in model and real adapters
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

A short adaptive check (about 20 questions) that finds where a student should start in `topics.json` order.
- `tools/quality/placement-graph.mjs` → `pages/lessons/placement/graph.json`: how strongly each lesson rests on the
  others, from `math-curriculum-essentials/dependencies.json` (role × kind, along topic paths that may run through
  topics outside the lesson line, never through another lesson). Only edges from earlier lessons in the order.
- `src/lesson/placement/model.ts`: the student model (the Kubo model): a belief per lesson in log-odds; an answer moves
  it and, through the graph, the linked lessons (right → the lessons below, wrong → the lessons above). The next
  question goes where the expected information gain is largest. A grade prior (the student picks 6, 7 or 8) seeds it.
- The page loads a lesson's `items.ts` + `placement.ts` only when it asks that lesson. The result: the start lesson
  (the first lesson in the order that is not mastered), the lessons that can be skipped, gaps, and the misconceptions
  seen (`errorLabel`).
- `placement-sim.mjs`: simulated students (hidden knowledge, slips, guesses) on the real adapters; run it after any
  model or graph change.

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
because one early gap moves it. Before the check-in goes live: per-strand starts (number, ratio and percent, geometry,
statistics, expressions and equations) like the Kubo themes, and a re-run of the simulation.

## Rolling out the other 60 lessons

Per lesson, measured on the pilot: O about 30-45 minutes of agent time (20-25 families; conceptual choice families
take longest), B about 30-60 minutes (mark answers, choice helper, adapter, fix 1-3 real bugs + regression probes).
Work in waves of about 6 lessons, two agents per lesson that never share files: O writes only `tests/oracle/<slug>.mjs`,
B writes only that lesson's topic folder, page hook and test; the lead runs `sweep --all --quiet`, `check-placement`,
`quality-layer.test.ts`, commits and pushes. Start with the 9 lessons the baseline sweep already flags.
