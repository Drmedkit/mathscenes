# Building one topic of the lesson line (brief for an agent or a person)

Read first: `docs/lessons/LESSON_LINE.md` (the format, the research rules, the look), then the reference topic
`pages/lessons/fractions-as-division.ts` + `src/lesson/topics/fractions-as-division/` (built on the runtime), then
the runtime in `src/lesson/runtime/` and the shared painters `src/lesson/{wash,annotate,words,dusk}.ts`.
Research notes with all sources (optional, deeper): `C:\Users\stelt\AppData\Local\Claude-Data\claude_pzs8sxrjxfjjc\side-session-notes\local_f381b083-039c-49ee-a496-aee0e48fc734\research-*.md`.

Curriculum: `C:\Users\stelt\Claude code foler\math-curriculum-essentials\topics\<topic id>.json` (goals, **subgoals**
with `new_element` and `cases` = number ranges) and `misconceptions.json` (entries whose `used_by` names the topic).

## Owner decisions (2026-10-21)
- Five parts per lesson: The question (commit, 3 cards + how sure), Worked example (3–4 subgoal steps, picture first,
  notation beside it, one "why?" with 3 reasons), Your turn (faded from the end), Prove it (because-chain from reason
  chips, distractors = misconceptions), Practice.
- **Voice** for parts 1–4: one narrator, no characters. Every line the panel shows in parts 1–4 has an id and a spoken
  text in `pages/lessons/<slug>/voice/lines.json` (`{"id": {"text": "..."}}`). Spoken text = the panel text, written
  to be read aloud ("three fourths", not "3/4"). Short, one idea per line. The page calls `ctx.say(id)`.
  Do NOT generate audio (the lead runs tools/lesson-voice.py once for all topics).
- **Much more practice that walks through ALL sub-goals** of the topic JSON. `plan.ts` exports `PLAN: SubgoalPlan[]`
  in topic JSON order (id = the subgoal id, a short kid-friendly title, the families that practise it). Every
  sub-goal gets at least one family; a generator receives the subgoal id and uses that subgoal's number ranges.
- **Diagnosis is logged** (runtime does this for practice; in parts 1–4 call `ctx.store.log({...})` for every card,
  chip and input with `mc` = the misconception id). Kids never see the ids.
- Look: dusk wall, painted objects (washes + one ink line), may be **less painterly where it helps clarity**. No
  Kubo/Pip/Max/Comets, no characters. US English, US units, no money unless the topic needs it.
- No generic AI design: no pills/eyebrows, no 01/02 numbering, no badges.

## Files you own (do not edit anything else)
- `src/lesson/topics/<slug>/DESIGN.md` (short: concept, model, the 5 parts beat by beat, the subgoal → family table)
- `src/lesson/topics/<slug>/<Model>.ts` — your model block(s): compute (exact maths, `check()` with readable
  messages), layout inside a Frame (numbers ≥ 60 px, labels ≥ 44 px, no text on lines), named steps, `where` boxes for
  annotation, draw with `wash`/`inkLine` and colour roles (first = the whole/amount, second = the parts/groups,
  link = the answer, pick = focus, wrong = wrong).
- `src/lesson/topics/<slug>/items.ts` (families: `Gen` from runtime/item.ts) and `plan.ts`.
- `pages/lessons/<slug>.html` (copy the reference html; the `<link>` to lesson.css stays) and `pages/lessons/<slug>.ts`
  (calls `runLesson({ slug, parts: [...] })`).
- `pages/lessons/<slug>/voice/lines.json`
- `tests/lesson-<slug>.test.ts`: every family × every subgoal it serves × 300 seeds: the answer passes, choices are
  unique with exactly one right, the main misconceptions are classified; the model's maths is checked.
- `tools/walk-<slug>.mjs`: a headless click-through (copy tools/walk-fractions-as-division.mjs; puppeteer, ALWAYS
  `--mute-audio`, add `?mute` to the URL) that screenshots every part and ~10 practice items (right and wrong).

Do not edit: `src/lesson/runtime/*`, the shared painters, the reference topic, `vite.config.ts`, `lesson.css`,
`.gitignore`. Need a runtime change? Put a local helper in your topic folder and say so in your report.
Extra CSS goes in a `<style>` in your html. Do not commit (the lead commits).

## Grades 7–8 (first two years of secondary school)
- Your topic is a row of `pages/lessons/topics.json` (id, slug, title, the topics it requires). Kids are 12–14: the
  tone is a smart friend, never childish; situations can be more grown-up (sports stats, recipes, trips, phones,
  maps, savings, science), still US units and $ where money is the point.
- "Prove it" can be more formal at this age (two-column frame with reason chips, Parsons ordering with a decoy step,
  always / sometimes / never with a counterexample) but stays tap/drag, no free typing.
- Pick the model that carries THE concept of your topic (number line with arrows for signed numbers, a balance or
  algebra tiles for equations, a coordinate grid for graphs/transformations, an area model, a spinner/bag for
  probability, a map/scale bar...). Build it as a block in your topic folder (compute + check + layout + steps +
  `where` boxes), crisp lines where precision matters (grids, axes, angles), washes for the objects.
- Several topics are built at the same time by different agents in this worktree. Only touch your own files. Check
  only your own code: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep <slug>` (other topics may be half-built) and
  `npx vitest run tests/lesson-<slug>.test.ts`.
- The page header: copy the reference html (`<h1>` with the "Fractions"-style home link becomes the course name
  "Math 7–8" linking to ./index.html, then your topic title).

## Checks
`npx tsc --noEmit -p tsconfig.json`, `npx vitest run tests/lesson-<slug>.test.ts`, then the walk script against the
running dev server http://localhost:5290/lessons/<slug>.html (started by the lead from this worktree). Look at
every screenshot yourself, fix what reads badly (overlaps, text on lines, leaders through objects, cramped boards),
walk again. Two rounds at least.
