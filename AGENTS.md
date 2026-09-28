# AGENTS.md: how an AI (or a person) authors a maths video with mathscenes

You are making one maths explanation that works twice: as a narrated **video** (1920 × 1080 MP4) and as a live
**interactive** page, from the same TypeScript scene. This file is your entry point. Read it fully, then the docs it
points to before you start each stage.

| read | when |
|---|---|
| `docs/PEDAGOGY.md` | before anything: why explanations are built misconception-first |
| `docs/SCRIPTWRITING.md` | writing or reviewing a script: the two shapes, how we talk, mechanics, checklist |
| `docs/WORDS_FORMAT.md` | narration.json, words.json, sfx.json, mix.json |
| `docs/STYLE.md` | building and reviewing the picture: colour roles, readability, motion, hard-won rules |
| `docs/BLOCKS.md` | which blocks exist, their params and steps, how to add one |
| `docs/TEX_COVERAGE.md` | what TeX renders (MathJax 4) and the workarounds |
| `examples/ratio/` | a complete worked example: script, timings, scene, sfx and mix |
| `prompts/` | ready-to-fill task prompts: write a script, build a scene, review a scene |

## Principles

1. **Misconception first, rule last.** The viewer commits, the tempting wrong idea is voiced and shown as if right,
   a fair test in the picture exposes it, the idea is worked out, the rule is named last. (`docs/PEDAGOGY.md`)
2. **The picture proves it before the words explain it**, and **every beat lands on its word.**
3. **Blocks compute and check their own maths.** Never type an answer into a picture: give a block its params and
   let it compute (exact rationals) and validate. A scene that states a fact should assert it at build time
   (`if (!cmp.same) throw …`), so a wrong script can't render.
4. **Pure frames.** `draw(c, t)` depends on `t` only. No state, no `Math.random` (use `hash()`).
5. **Readable or nothing.** Numbers ≥ 60 px, labels ≥ 44 px, ≥ 80 px margins, never text over lines, one idea on
   screen at a time. Blocks throw instead of drawing something unreadable; don't catch and squeeze.
6. **Colour roles, not colours.** `first` / `second` / `link` / `wrong` (…) mean the same thing all video long.
7. **Transform, don't cut.** Objects turn into the next idea.
8. **Look at your frames.** You are not done because it compiles; you are done when the contact sheets and stills
   read well and every cue is on its word.

## Workflow

A video project is a folder like `examples/ratio/`:

```
examples/<topic>/
  <topic>.ts            the scene (SceneDef): beats bound to cues, blocks, camera
  <topic>World.ts       scene-level painters that are not maths blocks (optional)
  cues.ts               typed Narration over data/words.json
  data/narration.json   the script                       (you write)
  data/words.json       word + cue timings               (narrate.py writes)
  data/sfx.json         sound prompts                    (you write)
  data/music.json       optional music bed plan          (you write)
  data/mix.json         bed + voice + sfx events         (you write)
  media/                generated audio (git-ignored)
```
Register the scene in `src/scenes/index.ts`.

1. **Script** → `data/narration.json`. Follow `docs/SCRIPTWRITING.md` (template: `prompts/write-script.md`). Run the
   script checklist. Dry-run: `python audio/narrate.py examples/<topic> --dry`.
2. **Narrate** → `python audio/narrate.py examples/<topic>` writes `media/narration.wav` and `data/words.json`
   (needs `ELEVENLABS_API_KEY`). Without a key you can still build against a hand-made words.json, but real timings
   are the point: re-bind after narrating.
3. **Dump the timings** and plan per word:
   `python -c "import json;d=json.load(open('examples/<topic>/data/words.json'));print(d['cues']);[print(l['section'],' '.join(f\"{w['w']}@{w['start']:.2f}\" for w in l['words'])) for l in d['lines']]"`
4. **Scene** → a storyboard first (per section: the camera, what appears on which word, what leaves), then the code
   (template: `prompts/build-scene.md`). Beats come from `word()` / `cue()` in one `beats()` function; blocks are
   driven by `TimeDriver`s; scene painters are pure.
5. **Review loop** (below), at least two look → fix rounds.
6. **Sound** → `data/sfx.json`, `data/mix.json` (sounds on the visual events), `python audio/gen_sfx.py`,
   optional `gen_music.py`, `python audio/mix.py` → `media/final_mix.wav`.
7. **Render** → `node tools/render.mjs <scene> --audio --out out/<topic>.mp4` (silent without `--audio`).

## The review loop

Always look at real frames. Commands (from the repo root):

```bash
# contact sheet of the whole video, 1 frame per second (time under each frame); read every sheet
node tools/sheet.mjs <scene> --from 0 --to <end> --step 1 --cols 6 --w 320 --out out/review/sheet.jpg
# dense sheet around every key cue: cue -0.2, 0, +0.15, +0.4, +0.8
node tools/sheet.mjs <scene> --times 37.9,38.1,38.25,38.5,38.9 --cols 5 --out out/review/cue_r23.jpg
# full-size stills of every hero moment and of every section boundary +- 0.03 s
node tools/sheet.mjs <scene> --times 146.9,203.9 --full out/review/stills
# a short silent clip of a section to check motion and pacing
node tools/render.mjs <scene> --from 120 --to 150 --out out/review/line.mp4
```

For each sheet / still check (and fix, then look again):
- **Cues**: every visual beat on its word (compare the time under the frame with `words.json`), started slightly
  before the word, nothing early, nothing late. The think pause shows nothing new.
- **Readability**: sizes, margins, no text on lines, no overlaps, nothing cropped at the frame edges, calm behind
  digits, one idea on screen.
- **Colour roles** consistent everywhere, `wrong` only for wrong.
- **Continuity**: section boundaries don't jump; objects transform rather than pop.
- **Maths**: every number on screen is right (it should be: blocks compute it).
- No console errors in the render output; `npm test` and `npm run typecheck` pass.

Interactive: `npm run dev`, then open `player.html?scene=<id>` (loops), `player.html?scene=<id>&t=<s>` (a still),
`gallery.html` (every block with sliders), `interactive.html` (a StepDriver example). Screenshots:
`node tools/shot.mjs page "player.html?scene=<id>&t=12" out/x.png --w 1920 --canvas "#cv"`.

## Definition of done

- [ ] The script passes the checklist in `docs/SCRIPTWRITING.md`; `words.json` is from the final script.
- [ ] Every beat is bound to a cue or a word (no magic times except deliberate holds, commented).
- [ ] Facts the script states are asserted in the scene or computed by blocks.
- [ ] `npm test`, `npm run typecheck`, `npm run build` pass; the scene builds in both themes (`tests/scenes.test.ts`).
- [ ] Two review rounds done: contact sheets of the whole video, dense cue sheets, stills of hero moments and
      boundaries, all read and fixed.
- [ ] Sound events sit on the visual events; the mix is normalised (`lufs` in mix.json).
- [ ] The final render plays start to end without errors; the audio is in sync with the words.

## Commands

| command | what |
|---|---|
| `npm install` | dependencies (Puppeteer downloads a headless Chrome) |
| `npm run dev` | Vite dev server: `index.html`, `gallery.html`, `interactive.html`, `player.html` |
| `npm test` | Vitest: block maths, TeX parsing, scene cues, scenes build in both themes |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `dist/`, fully offline (MathJax and font ranges bundled) |
| `node tools/render.mjs <scene> [--from s --to s] [--audio [file]] [--theme paper] [--out f.mp4]` | video (needs ffmpeg) |
| `node tools/sheet.mjs <scene> --from a --to b --step s` / `--times t1,t2 [--full dir]` | contact sheets / stills |
| `node tools/shot.mjs page "<page?query>" out.png [--canvas "#cv"]` | a page screenshot |
| `node tools/tex-coverage.mjs` | TeX coverage check → `out/tex-coverage.html` |
| `python audio/narrate.py <project> [--dry]` | script → narration.wav + words.json |
| `python audio/gen_sfx.py <project> [--dry] [--force names]` | sfx.json → media/sfx/*.mp3 |
| `python audio/gen_music.py <project> [--variants A B] [--keep A] [--dry]` | optional music bed |
| `python audio/mix.py <project> [--dry]` | bed + voice + sfx → media/final_mix.wav (+ cue sheet) |

Keys: only in `.env` (copy `.env.example`) or the environment. Never commit a key, a `.env`, or generated audio/video.
