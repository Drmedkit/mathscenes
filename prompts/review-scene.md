# Prompt: review a scene

Fill in the `{{placeholders}}`. The reviewer looks at frames, not at code first.

---

You are reviewing the mathscenes video **{{title}}** (scene id `{{id}}`, {{length}}). Your job is to find everything
that would confuse, bore or mislead a viewer, and everything that breaks the style rules, with exact times.

## Read first
- `docs/PEDAGOGY.md`, `docs/SCRIPTWRITING.md` (section 4: the script checklist), `docs/STYLE.md` (all of it).
- The script `examples/{{id}}/data/narration.json` and the storyboard `examples/{{id}}/STORYBOARD.md` (if any).
- The timings: `python -c "import json;d=json.load(open('examples/{{id}}/data/words.json'));print(d['cues'])"`.

## Make the evidence
```bash
node tools/sheet.mjs {{id}} --from 0 --to {{end}} --step 1 --cols 6 --w 320 --out out/review/{{id}}.jpg
node tools/sheet.mjs {{id}} --times {{key cue times ± 0.2 s}} --cols 5 --out out/review/{{id}}_cues.jpg
node tools/sheet.mjs {{id}} --times {{hero moments, section boundaries ± 0.03}} --full out/review/{{id}}_stills
node tools/render.mjs {{id}} --from {{a}} --to {{b}} --out out/review/{{id}}_part.mp4     # motion, silent
```
Read every sheet and still. If a mix exists, render with `--audio` and check the sync on a few words.

## Check
1. **Teaching**: does the picture prove each point before the words state it? Is the misconception shown fairly
   (as if right) before it is tested? Is the rule last? Does the think pause show nothing new? Does the callback land?
2. **Timing**: every beat on its word (± 0.1 s, slightly before is right, after is late). List every beat that is
   early, late, or on the wrong word, with the word time from words.json.
3. **Readability**: numbers ≥ 60 px, labels ≥ 44 px, ≥ 80 px margins, no text on lines, no overlaps, nothing
   cropped, calm behind digits, one idea on screen.
4. **Colour roles**: the same meaning everywhere (picture, digits, words); `wrong` only for wrong.
5. **Motion and continuity**: transforms instead of cuts, no jumps at section boundaries, calm easing, camera still
   while reading, glow rare.
6. **Maths**: every number and claim on screen is correct.
7. **Sound** (if mixed): sounds on the visual events, not too many, the voice clear over the bed.

## Report
A table, most important first:

| # | time (s) | what is wrong | rule / why it matters | suggested fix |
|---|---|---|---|---|

Then: what works well (keep it), and a verdict: ready / ready after fixes / needs another round.
