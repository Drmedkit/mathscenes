# Building one high school / AP lesson (brief for an Opus builder)

Read, in this order: this file, `docs/lessons/BUILD_GUIDE.md` (the short version of how a lesson is built),
`docs/lessons/TOPIC_BRIEF.md` (owner decisions and rules; everything there holds unless this file says otherwise),
the reference lesson `two-step-equations` (`pages/lessons/two-step-equations.ts`, `src/lesson/topics/two-step-equations/`),
and the kit below. The plan of the whole phase is `docs/lessons/HS_PLAN.md`; you build one row of
`pages/lessons/topics-hs.json`.

## What is different from grades 7-8

- **Who:** students of 14-18 (AP lessons: 16-18) working alone. The tone is a sharp older friend; contexts can be
  adult (loans, physics, sports analytics, engineering, medicine, elections, games). Still US English and US units.
- **Your row:** `pages/lessons/topics-hs.json` gives `id` (the main topic), `alsoTopics` (folded-in topics: their
  sub-goals are in your `plan.ts` too and must all be practised), `requires` (earlier lessons the student has done:
  you may use their ideas without re-teaching), `course` and `courseTitle`.
- **Header:** the `<h1>` home link reads the course title (for example "Algebra 1") and links to
  `./index.html#<course>`, then your lesson title. The lead has scaffolded the html, `plan.ts`, the generic test and
  `voice/lines.json` (`python tools/lesson-scaffold.py <slug>`).
- **Sub-goals:** HS topics have about 23 sub-goals. Every one gets at least one family, most two; aim for 30-45
  families. Generators use the sub-goal's `cases` (number ranges) from the topic JSON.
- **Prove it** can be a real proof at this age: two-column or flow proof with a reason menu, Parsons ordering with a
  decoy, always / sometimes / never with a counterexample, an algebraic derivation step by step. Still tap/drag.
- **Inputs:** the panel has `num` (accepts −, decimals, commas, %, $), `frac`, `pair` and `choice`. Answers that are
  expressions (a factored form, an equation of a line) are asked as a choice among forms that differ by a typical
  slip, or as numbers that pin the form down (slope and intercept, the two roots). No free typing of algebra.

## The shared kit (`src/lesson/kit/`): use it, do not copy it

- **Plane** (`kit/Plane.ts`): the coordinate plane every graphing lesson needs. `Plane({ x, y, items, equal }, frame,
  dusk)`; items `curve` (any `f(x)`, `lo`/`hi`, open/closed `ends`, `dash`, `name`), `point` (`open`, `name`), `seg`
  (`arrow`, `dash`), `vline` / `hline` (asymptotes), `shade` (between two boundaries, `'top'`/`'bottom'` = window
  edge), `text`. Each item has a `key` = its step name: draw with `block.draw(c, progressOf(s => tr.k('e.' + s)), focus)`
  and bring items in with `tr.set('e.<key>', 1)`; `'axes'` brings in the card. Focus: `ring`, `dim`, `trace`
  (a point riding a curve with its coordinates), `heads`. `px` / `toData` / `snap` for drags, `where(key)` for leaders.
  Tick labels: `fmt` (for π, dates, money). Look at it live: `http://localhost:5290/kit.html?n=0..5` (and
  `pages/kit.ts` for the parameters). It throws a BlockError when something would not read: choose another window.
- A picture the kit does not have yet (number line with intervals, algebra tiles, proof frame, data plots, simulator,
  unit circle, 3D): build it as a block in YOUR topic folder, in the kit's style (compute + check + layout in a Frame +
  named steps + `where` + draw), and say in your report that it could move to the kit. Do not edit `src/lesson/kit/`.

## Also yours this time: the quality layer's builder half

After the lesson works, write `src/lesson/topics/<slug>/explain.ts` (worked steps per family, see
`docs/lessons/QUALITY_LAYER.md` part B and an existing `explain.ts`), the `explain` hook in the page, and
`src/lesson/topics/<slug>/placement.ts` (1-3 families for the check-in). The oracle is written by another agent; never
write or edit `tests/oracle/`.

## Checks before you report

`npx tsc --noEmit -p tsconfig.json 2>&1 | grep <slug>` (empty), `npx vitest run tests/lesson-<slug>.test.ts`, your
`tools/walk-<slug>.mjs` against the running dev server (http://localhost:5290/lessons/<slug>.html, the lead keeps it
running; headless Chrome ALWAYS with `--mute-audio`, `?mute` in the URL), `node tools/walk-practice.mjs <slug>`, then
`python tools/contact-sheet.py` on the screenshots: look at the sheets, fix what reads badly, walk again. Two rounds.
Touch only your own files; several builders work in this worktree at the same time. Do not commit.

Report at the end (short): files, families per sub-goal (all covered?), what the walks showed and what you fixed,
blocks that could move to the kit, anything you could not do.
