# Building a topic, short version (Opus builder + Haiku QA)

Read this, then `docs/lessons/TOPIC_BRIEF.md` (owner decisions, rules) and ONE reference topic:
`two-step-equations` (`pages/lessons/two-step-equations.ts`, `src/lesson/topics/two-step-equations/`). Do not read
other topics unless you need a specific trick. The runtime is `src/lesson/runtime/` (read `practice.ts`, `item.ts`,
`stage.ts`, `shell.ts` headers; skim the rest).

## Division of work
- **Lead** runs `python tools/lesson-scaffold.py <slug>` before you start: the html shell, `plan.ts` with every
  sub-goal (families empty), a generic test file and an empty `voice/lines.json` already exist. It voices, commits
  and ships after review.
- **You (Opus builder)** own the thinking: `DESIGN.md`, the model block(s), `items.ts` (families, classifier with
  misconception ids, worked solutions), `plan.ts` families, the five parts in `pages/lessons/<slug>.ts`, the spoken
  lines, topic-specific tests, and `tools/walk-<slug>.mjs` for parts 1-4 (clicks the right AND one wrong answer per
  part; copy the shape of `tools/walk-two-step-equations.mjs`, block `/@vite/client`).
- **Haiku QA** (started by the lead when you report READY FOR QA) runs your walk script, `tools/walk-practice.mjs
  <slug>` (generic practice walk with hard checks) and `tools/contact-sheet.py`, and reports: summary.json, page
  errors, sub-goals reached, and the sheet paths. You then look at the SHEETS (not every PNG; open a full PNG only
  where a sheet shows a problem), fix, and report READY FOR QA again. Two rounds, then DONE.

To save tokens: no repeated full walks by you, no screenshots one by one, no reading of five references. One
`tsc` filtered to your slug and one vitest run per fix round is enough.

## Files
```
src/lesson/topics/<slug>/
  DESIGN.md        concept, model, 5 parts beat by beat, sub-goal -> family table (short)
  <maths>.ts       exact maths, no DOM (tests + generators import it)
  <Model>.ts       the block: compute + check() + layout in a Frame + named steps + where{} boxes + draw()
  items.ts         export GENERATORS: Record<family, Gen>, FAMILY_NAMES; Gen(R, n, subgoal) -> Item
  plan.ts          (scaffolded) fill families per sub-goal
  script.ts        optional: { id: { html, say } } so panel text and spoken text live side by side
pages/lessons/<slug>.ts        the page: five parts + practice show()
pages/lessons/<slug>/voice/lines.json   { "id": { "text": "spoken, no digits or symbols" } }
tests/lesson-<slug>.test.ts    (scaffolded generic checks) + your model maths + misconception probes
tools/walk-<slug>.mjs          parts 1-4 click-through
```

## The page in 40 lines
```ts
import { BOARD, MF, line, partOf, seq, setScene, th, tr, wait, bump, type Lead } from '../../src/lesson/runtime/stage';
import { btn, feedback, fracInput, h, html, choiceInput, numInput } from '../../src/lesson/runtime/panel';
import { type LessonCtx, runLesson, SURE } from '../../src/lesson/runtime/shell';
import { startPractice } from '../../src/lesson/runtime/practice';
import { FAMILY_NAMES, GENERATORS } from '../../src/lesson/topics/<slug>/items';
import { PLAN } from '../../src/lesson/topics/<slug>/plan';
let ctx!: LessonCtx;
const say = (id: string) => { void ctx.say(id); };             // every panel line of parts 1-4 has a voice id
// scene: setScene({ model: c => block.draw(c, progressOf(s => tr.k('e.' + s))), lines: [...], leads: [...] })
// beats: seq(async alive => { tr.set('e.cut', 1, 1.4); await wait(1.5); if (!alive()) return; tr.set('e.L1', 1); })
// log every card / chip / input of parts 1-4:
//   ctx.store.log({ part: 'turn', item: 'turn.count', prompt, response, expected, correct, mc })
function partPractice() {
  startPractice({ topic: '<slug>', store: ctx.store, host: ctx.panel, plan: PLAN, gens: GENERATORS,
    familyNames: FAMILY_NAMES, seed: ctx.qs.get('seed') ? Number(ctx.qs.get('seed')) : undefined,
    show: item => { /* draw the item's picture; return { solve: async alive => { replay the worked solution } } */ return {}; } });
}
void runLesson({ slug: '<slug>', warm: ['<TeX used on the board>'], parts: [
  x => { ctx = x; partQuestion(); }, x => { ctx = x; partExample(); }, x => { ctx = x; partTurn(); },
  x => { ctx = x; partProve(); }, x => { ctx = x; partPractice(); } ] });
```
The board is narrow (about 512 px at 60 px type). If your notation is wider, draw your own wider slate in the page
(see `discounts` or `rigid-transformations`); keep numbers >= 60 px.

## An item family in 15 lines
```ts
const fam: Gen = (R, n, sg) => {
  const a = int(R, 2, 9), b = int(R, 2, 9);            // use the sub-goal's number ranges (topic JSON 'cases')
  return { id: `fam-${n}`, family: 'fam', prompt: `...${A(a)}...${B(b)}...`, board: `${a} \\div ${b} = \\,?`,
    input: 'frac', unit: 'of a bar', answer: { kind: 'frac', w: 0, n: a, d: b },
    solution: ['step 1 ...', 'step 2 ...'],
    check: r => /* exact */ ok ? { ok: true, say: '...' }
      : looksFlipped ? { ok: false, mc: 'mc.fractions-concept.fraction-division-order-reversed', say: 'why, specific' }
      : { ok: false, say: 'the general hint' } };
};
```
Inputs: `frac` (whole + n/d), `num`, `pair` (`pairLead`, `pairOp`, `pairTail` for "( □ , □ )"), `choice`. Number boxes
accept −, $, %, decimal and thousands commas.

## Rules that reviews kept catching (check them before QA)
- Notation is written next to the part it names; leaders never run through notation or across the figure (use a
  glow / pulse instead); labels never sit on a line; nothing outside the frame; numbers >= 60 px, labels >= 44 px.
- The picture moves first, notation after; a wrong claim is struck only after the evidence is on screen.
- No answer visible before the kid answers (labels, boards, choice wording).
- Spoken text has no digits or symbols ("three fourths"); short lines; US English and units.
- Every misconception id exists in `math-curriculum-essentials/misconceptions.json`.
- Windows is case-insensitive: never name a model block `Plan.ts` or `Items.ts` (it overwrites `plan.ts` / `items.ts`).
- Use TeX `-` inside math (MathJax makes the minus); write `\\` correctly in TS template strings.
