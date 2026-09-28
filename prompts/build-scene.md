# Prompt: build a scene from a script

Fill in the `{{placeholders}}`. This is a lead brief: the builder owns the scene end to end and reports back.

---

You are the lead for one complete maths explanation video built with mathscenes: **{{title}}** ({{length}}, 16:9,
{{audience}}). The script is final and narrated: `examples/{{id}}/data/narration.json` and its timings
`examples/{{id}}/data/words.json` (every line, every word with start/end, every `{cue}`). You make everything else:
the storyboard, the scene, the sound design, and the verification. The viewer will watch every frame; so will the
reviewer.

## Read first (in this order)
1. `AGENTS.md` (workflow, review loop, definition of done).
2. `docs/PEDAGOGY.md` and `docs/SCRIPTWRITING.md` sections 1-2: what each beat of the script is FOR.
3. `docs/STYLE.md`: colour roles, readability, motion and the hard-won rules. Every rule there was a real bug.
4. `docs/BLOCKS.md`: the blocks, their params and named steps. Prefer a block over drawing by hand; if a maths object
   you need does not exist, add a block (section "How to add a block") with tests.
5. The worked example: `examples/ratio/ratio.ts` (the `beats()` function, TimeDrivers per block, camera views,
   transformations between sections) and `examples/ratio/ratioWorld.ts` (scene painters).
6. The script and the timings. Dump them:
   `python -c "import json;d=json.load(open('examples/{{id}}/data/words.json'));print(d['cues']);[print(l['section'],' '.join(f\"{w['w']}@{w['start']:.2f}\" for w in l['words'])) for l in d['lines']]"`

**Colour roles:** {{e.g. first = orange = the first amount; second = green; link = lavender = the ratio, equivalence,
insights; wrong = rose}}
**Models:** {{e.g. RatioTiles for "for every", RatioTable for scaling, RatioGraph for the line through zero}}
**Hero moments:** {{the 3-5 moments the video exists for, e.g. "the shrunk copy fits / falls short", "the line through zero"}}

## 1. Storyboard first (`examples/{{id}}/STORYBOARD.md`)
Per section: the camera (what is in frame, where it moves), and a per-beat table:

| t (word) | cue / word | what appears / changes | block step or painter | leaves |
|---|---|---|---|---|
| 23.80 "Two" | `two` | 2 orange tiles pop in (E.back) | `tiles.a` | – |

- **Every beat on ITS word**: the tile appears on "two", not on the line start. Start 0.05-0.3 s before the word.
- **The picture proves it first**: plan the moment the contradiction is VISIBLE, before the line that names it.
- **Transform, don't cut**: say how each section's objects turn into the next section's (tiles → counts → 2 : 3;
  tallies → table rows; rectangles → points).
- **One idea on screen**: say what leaves, and when.
- **Think pause**: nothing new appears (list what is on screen, frozen or gently pulsing).
- Plan the interactive twin: the learner's action per beat (for a StepDriver later).

## 2. Build the scene
- `examples/{{id}}/cues.ts` (typed Narration), `examples/{{id}}/{{id}}.ts` (SceneDef), optional
  `examples/{{id}}/{{id}}World.ts`; register it in `src/scenes/index.ts`; `tests/scenes.test.ts` then builds it in
  both themes.
- ONE `beats()` function computes every beat time from `cue()` / `word(section, word, after)`; nothing else holds a
  time. Deliberate holds are commented.
- Blocks get their maths as params and compute the rest; drive each with a `TimeDriver<Step>`. Assert the facts the
  script states at build time (`compareShapes`, `point(id).kind`, …) so a wrong script cannot render.
- Scene painters are pure functions of `t`, use theme roles only, no `Math.random`.
- Camera with `withCam` / `lerpCam`; one move at a time; never while the viewer must read.
- Sizes from `theme.font`; frames inside `frame(80, 80, 1760, 920)`; never text on lines.

## 3. Sound
- `data/sfx.json`: a small palette (tick, whoosh, ding, chime, buzz, pop … as `[prompt, seconds]`).
- `data/mix.json`: the bed (optional, gain ≈ -15, loop), the voice, `duck_db` ≈ -11, `lufs` -16, `fade_out` 3, and
  sfx events on the VISUAL events of your storyboard (anchor by `cue` / `word`, or the beat time `t`), each with a
  `note`. Tasteful: a sound for each meaningful event, not for every tiny thing; a soft buzz for wrong, one chime for
  the right answer.
- `python audio/gen_sfx.py examples/{{id}}`, `python audio/mix.py examples/{{id}}` (use `--dry` first).

## 4. Craft bar
- Numbers ≥ 60 px, labels ≥ 44 px, ≥ 80 px margins, nothing cropped, calm behind digits.
- Motion eased (`E.smooth`; `E.back` for pop-ins), calm, never frantic; glow only on THE moment of a section.
- Colour roles consistent from the first frame to the last.
- Every frame < ~500 ms to draw.

## 5. Verify (mandatory, at least 2 full look → fix rounds)
- Contact sheets of the WHOLE video at 1 frame/s:
  `node tools/sheet.mjs {{id}} --from 0 --to {{end}} --step 1 --cols 6 --w 320 --out out/{{id}}/s.jpg` → read every sheet.
- Dense sheets around every key cue (cue -0.2, 0, +0.15, +0.4, +0.8): `--times a,b,c,d,e`.
- Full-size stills of every hero moment and every section boundary ± 0.03 s: `--times … --full out/{{id}}/stills`.
- A silent render of each section to check motion: `node tools/render.mjs {{id}} --from a --to b --out out/{{id}}/sec.mp4`.
- `npm test`, `npm run typecheck`; no console errors while rendering.
- Do NOT render the full final video with audio unless asked; the reviewer does that after review.

## Report back (short)
Sections built, the hero moments and how they read (with still paths), choices that differ from the script or this
brief, anything you are unsure about, any engine or block issue (and any block you added, with its tests). Keep
STORYBOARD.md in sync with what you built.
