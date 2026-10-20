# The lesson line: concrete, annotated, lots of practice (proposal + prototype)

Status 2026-10-20: **research done, one prototype topic built, waiting for the owner's direction before scaling.**
Prototype: `pages/lessons/fractions-as-division.html` (run `npm run dev`, or the `mathscenes-lessons` launch config,
port 5290; `?part=0..4&open` jumps to a part, `?seed=n` fixes the practice items). Click-through + screenshots:
`node tools/lesson-walk.mjs` → `out/lesson-walk/`.

This is a new line of maths lessons for grades 4–8, next to Kubo Level Up. It keeps the dusk look of Level Up
"style E", drops the cast (no Kubo, Pip, Max or the Comets), runs on the mathscenes TypeScript engine (MathJax →
canvas, blocks that compute and check their own maths) and has far more practice. The owner's brief: less abstract,
and decide annotation, proof writing and exercises on research, not on habit.

Research notes with every source: the side-session notes folder (`research-annotation.md`, `research-reasoning.md`,
`research-exercises.md`). The findings below are the part that changes the design.

---

## 1. What the research says (short)

### Annotation: tie each symbol to the picture
| finding | size | consequence |
|---|---|---|
| A label placed **next to the part it names** beats a label placed apart (split attention) | g = 0.63 over 58 effects; 0.80 for screen material; d = 0.97 for grade-7 angle examples (Schroeder & Cenkci 2018; Tindall-Ford 2015) | the notation is written beside the model and linked to it, never in a separate box without a link |
| ... and kids who **drag the label onto the diagram themselves** do as well | Tindall-Ford 2015 | "tap the chip into the slot" is a valid interaction, not a shortcut |
| The same **colour** for a quantity in picture, notation and words | d ≈ 0.35, mostly for weaker kids (Richter, Scheiter & Eitel 2016) | colour roles, held for the whole lesson |
| **Worked examples** in maths | g = 0.48 (Barbieri 2023, 55 studies) | every topic opens with a fully worked example |
| **Fading from the end** (complete example → last step blank → solo) | Renkl & Atkinson; the step you fade is the principle you learn | "Your turn" gives the first steps and leaves the concept-carrying steps to the kid |
| **Subgoal labels** ("Cut", "Deal", "Count", "Write") | better transfer to new problems (Catrambone; Margulieux 2016) | every worked example has 3–4 short labelled steps, same words every time |
| **Self-explanation**: prompts help (g = 0.55) but a pile of prompts on an example lowers the example effect | Bisra 2018; Barbieri 2023 | **one** short prompt per example, answered by choosing a reason |
| **Concreteness fading**: objects → picture model → symbols, each stage pointing back at the last | Fyfe et al. 2014, 2015; three stages beat two | real objects, then a strip / tape, then bare notation, in that order inside a topic |

### Proof writing for 9–14 year olds
- **Choosing the reason from a list works.** In Aleven & Koedinger's geometry tutor kids had to name the rule
  behind each step (typed or picked from a glossary). They learned more, most on the deep items, and needed
  *fewer* problems to reach mastery (102 vs 136). Typed free-text explanations added nothing over the menu.
- **The required slot is what makes kids read the reasons**: glossary use went from 1–3 % to 47 % of steps.
- **Structure beats prose** at this age: "because"-chains (grades 4–6), flow-chart proofs (7–8), Parsons ordering
  with a decoy step, and picture proofs. A written two-column proof from scratch does not fit; a two-column frame
  with reason chips does.
- **Wrong options are the diagnosis** (Eedi, two-tier tests): every distractor is one catalogued misconception, and
  a "how sure?" rating flags confident errors, which kids correct most readily.
- **Error analysis (spot the slip) helps, but later**: on delayed tests, for kids who already have the method, and
  kids like it less. Correct example first, mistake example after.

### Exercises at volume
- **Interleaving is the strongest lever**: grade 7, 787 kids, a month later 61 % vs 38 % (d = 0.83). A few
  same-kind items right after the lesson, then never the same kind twice in a row.
- **5-in-a-row is a noisy gate**: a kid who is right 95 % of the time fails a 5-streak on the first try 23 % of the
  time; a 70 % kid passes after ~16 items of grinding. Better: **5 of the last 6, from at least 4 kinds**, plus a
  delayed re-check before "mastered" (the Khan pattern).
- **Spacing**: review at growing gaps (day 2, 7, 16, 35, 80), 2–3 items each.
- **Families, not items**: a template with fixed *structure* and free *skins* (context, names, numbers). One
  context alone traps the knowledge (Kaminski 2008); many contexts per structure plus bare-symbol items transfer.
- **Feedback on a miss**: what went wrong + a short worked solution in picture and symbols, then a **fresh item of
  the same kind**, never the same numbers (Shute 2008; IXL, Zearn, Math Academy all do this).

---

## 2. One lesson = one topic, five parts (~20–25 min)

| part | what the kid does | research it rests on | prototype |
|---|---|---|---|
| **1 The question** | a real situation, 3 answer cards (one right, two misconceptions), "how sure?" | commit + confidence (Veritasium / PEDAGOGY.md; hypercorrection) | 3 granola bars, 4 friends: 4/3, 3/4, 1/4 |
| **2 Worked example** | presses each of 4 subgoal steps; the picture moves first, then the notation writes beside it, linked; one "why?" with 3 reasons | worked example, subgoal labels, contiguity, one selectable self-explanation | Cut → Deal → Count → Write; "why is 4 the bottom number?" |
| **3 Your turn** | the same structure on a harder case, faded from the end: first steps given, the kid counts the share (fraction input) and builds the division (chips); the mind-change callback to part 1 | backward fading on the concept step; label dragging | 5 bars, 3 friends: 5/3 = 1 2/3, "a share can be more than 1" |
| **4 Prove it** | judge someone's claim, then build a 3-line because-chain from 5 reason chips (2 are misconceptions); the picture backs each line as it is placed | reason menus, error analysis after the correct example, picture proof | Jordan writes 2 ÷ 5 = 5/2 |
| **5 Practice** | generated, mixed problems; misconception-specific feedback; worked solution + a twin after a miss; mastery meter | interleaving, families, elaborated feedback, k-of-n gate | 7 families, 5 of last 6 from ≥ 4 kinds |

The explain part (1–4) is ~8–10 min with no voice yet; practice is ~10–15 min.

---

## 3. The screen, in words (1920 × 1080 canvas + a side panel)

```
┌──────────────────────── canvas 16:9 ─────────────────────────┐┌─ panel ──────────┐
│  3 bars                                  ┌── board ───────┐  ││ title            │
│  [▓▓▓▓][▓▓▓▓][▓▓▓▓] ← painted objects    │ 3 ÷ 4 = 3/4 bar│  ││ the situation    │
│                                          │  (hero line)   │  ││ (role-coloured)  │
│  4 friends                               │ 1 ÷ 4 = 1/4 bar│  ││ ● Cut  ✓         │
│  [☺ ▓▓▓┊┊┊] [☺ ▓▓▓┊┊┊] ←─── leader ─────┤ 3 × 1/4 = 3/4  │  ││ ● Deal ✓         │
│  [☺ ▓▓▓┊┊┊] [☺ ▓▓▓┊┊┊]    (one tray     │  (working,     │  ││ ○ Count [button] │
│        dusk wall above, table below      │   dimmed)      │  ││ inputs / chips   │
│                                          └────────────────┘  ││ feedback         │
└──────────────────────────────────────────────────────────────┘└──────────────────┘
```

- **Left (≈ 60 %)**: the concrete model, big and painted. **Right**: the notation board, a calm dark slate.
  **Panel**: the words, the subgoal plan, the inputs. Text stays in the panel; the canvas carries no sentences.
- **Annotation rules (implemented in `src/lesson/annotate.ts`)**
  1. One colour per role, everywhere: amber = what is shared (dividend), teal = who shares (divisor),
     lime = one share (the answer), lavender = "this piece" (focus), red = wrong. The same colours are in the
     panel text.
  2. A symbol that names a **part** (one piece, one tray) gets a **leader line**: it leaves *under* the symbol,
     runs along a rail below the line of notation (never through text), leaves the board and ends at the part.
  3. A symbol that names a **group** ("3 bars", "4 friends") makes that group's label **light up** while the symbol
     writes on (a pulse, gone after a second). Long leaders across the picture were tried and cut: they crossed the
     objects.
  4. The picture moves first, the notation is written after it (`texDraw` write-on), each line next to the part of
     the picture it describes (the working lines sit at the height of the bar / tray they talk about).
  5. Step highlighting: only the current line and its leader are bright; earlier lines dim to ~45 %.
  6. The share is always measured against a **ghost of one whole** (the dashed outline in each tray, the same size
     as a real bar), so "3/4 of a bar" and "1 2/3 bars" are visible, and "3/12" is visibly wrong.
- **Proof screen**: the claim is on the board; the panel shows the chain (claim, *because* slot) × 3 and the chips.
  A right chip locks in and the canvas plays that line's evidence; a wrong chip names its misconception. Jordan's
  equation is struck only after the evidence is on screen (STYLE.md: never strike before the picture shows why).
- **Practice screen**: the item's situation is drawn when a model fits (granola bars / brownie pans with
  `EqualShare`, rope / ribbon / rice / trail mix with `MeasureStrip`); bare-notation families show the notation big.
  After a miss the same picture solves itself (cut, deal, count, hero line), the panel shows the worked steps and
  the diagnosis, and "Try one like it" gives a twin. Under it: the last six attempts and the goal.

---

## 4. The look: "partly style E, more modern, no Kubo"

Kept from style E: the navy/plum dusk wall, the warm horizon glow, a painted wooden table, objects as **flat washes
with one ink line** (seeded wobble, no randomness, `src/lesson/wash.ts`), bright colour roles on a dark board.
Changed:
- **No cast, no world.** No characters, no Comets venue, no jumbotron, no speech bubbles. A sharer is a small teal
  head-and-shoulders mark on a tray, not a person. The situation lives in the words and the objects.
- **Notation is real typesetting** (MathJax on canvas, write-on), not a display font on a scoreboard.
- **A modern UI shell**: sans labels on the canvas and in the panel (Segoe UI / system), flat buttons, a thin text
  rail for the five parts (no pills, no numbered "01/02" sections, no badges).
- **Calmer, bigger maths**: the model takes the left 60 %, the board the right; nothing decorative behind digits.

---

## 5. How many exercises per topic

| | prototype (fractions as division) | proposal per topic |
|---|---|---|
| item families | 7: sharing story, division → fraction, fraction → division, between which wholes, share the leftover, check it adds back, spot the slip | 8–10, always including: bare symbolic, ≥ 6 story skins, a model/visual family, both directions, choose-the-form, one error-analysis family |
| variants per family | 88 (spot the slip, limited by what the picture can draw) to 947 (share the leftover) distinct problems; ~2,800 in all (counted over 5,000 seeds) | ≥ 40 each, > 500 distinct items per topic |
| learn (parts 2–4) | 1 worked example + 1 faded example + 1 proof = ~10 kid actions | same |
| practice | open-ended; 2 blocked, then interleaved, a twin after each miss | 12–20, held near 80 % right; ~30 % from earlier confusable topics once there are several topics |
| mastery check | 5 of the last 6 right from ≥ 4 families | the same rule, hint-free, incl. ≥ 1 bare item and ≥ 1 new context → "proficient" |
| spaced review | not built | 2–3 items at day 2, 7, 16, 35, 80 → "mastered" after the day-7 review |
| per kid, lifetime | — | ~45–60 items per topic (Kubo Level Up today: ~15–20) |

Every wrong answer the classifier recognises is tagged with its id from
`math-curriculum-essentials/misconceptions.json` (shown as "diagnosis: …" in the prototype; a kid version would
hide the id and log it).

---

## 6. How mathscenes is used and extended

New, in `src/lesson/` (nothing in the existing blocks or scenes was changed):

| file | what |
|---|---|
| `dusk.ts` | the dusk theme (same `Theme` interface, roles first / second / link / wrong / pick) |
| `wash.ts` | painterly painters: `wash` (3-layer watercolour fill + one ink line), `inkLine`, `duskRoom` |
| `EqualShare.ts` | the block for a ÷ b: bars cut and dealt to trays with a ghost whole; computes the deal and checks conservation; steps `labelA bars labelB trays cut deal count regroup`; `where.*` boxes for annotation; focus + label pulse |
| `MeasureStrip.ts` | a measured amount as a strip with unit ticks, cut into b pieces, the piece labelled |
| `annotate.ts` | the board slate and leader lines (rail under the symbol, never through text) |
| `words.ts` | sans labels on the canvas, measured for layout |
| `items.ts` | 7 item families, seeded generator, exact checking, misconception classifier, interleaving scheduler, mastery rule |
| `shareLayout.ts` | the model's size, pure, so generators only make problems the picture can draw |

The page itself (`pages/lessons/fractions-as-division.ts`) is one file per topic: scenes (model + board lines +
leaders), a small animation track, and the panel. Tests: `tests/lesson.test.ts` (every family × 400 seeds: the
answer passes, choices are unique and exactly one is right, the classic wrong answers get their misconception,
every story/slip item has a picture, the model conserves the whole).

To scale, the next pieces are generic: a lesson **runner** (parts, progress, saving, the review schedule) so a topic
is data + its blocks; more lesson blocks (the BLOCKS.md wish list: NumberLine, BarModel, AreaModel, FractionStrip,
PlaceValueChart); voice for parts 1–4; and phone layout (the page stacks under 1150 px but was only checked at 1920).

---

## 7. Next to Kubo Level Up `fractiondivision`

| | Kubo Level Up | this line |
|---|---|---|
| explain | Max and Pip, pizza table, jumbotron; 5 levels | no cast; worked example with subgoals, faded "your turn", a proof |
| notation | on the jumbotron, display font | MathJax beside the model, linked by colour, leaders and pulses |
| practice | 3 rungs (A/B/C help) + test 5 in a row; ~21 items seen | 7 interleaved families, twin after a miss, 5 of last 6 from ≥ 4 kinds |
| abstraction | practice moves to bare sums (owner decision for Level Up) | practice stays situated where the structure allows (objects, strips), with bare items mixed in |
| reasoning | "Is Pip right?" (2 buttons) | because-chain with misconception chips; spot-the-slip family |
| audio | full voice | none yet |

---

## 8. Open questions for the owner

1. Voice: narrate parts 1–4 (one narrator, no characters), or keep the line text-first?
2. Look: is "dusk wall + painted objects + modern UI" the right amount of style E, or more / less painterly?
3. Scope of a lesson: is this five-part shape the template, or should practice be its own daily mixed session
   across topics (the research favours that once there are several topics)?
4. The diagnosis tag: show it to teachers / parents (a report), or keep it internal?
5. Which topics next, and how many in the first batch? (Suggestion: 3 topics that build on each other, so the
   interleaving and spaced review can be tested for real.)
