# Prompt: write a script

Fill in the `{{placeholders}}` and give this to a model (or follow it yourself).

---

You are writing the narration script for a short maths explanation video (and its interactive twin) made with
mathscenes. The script decides whether the explanation works; the animation only makes it visible.

**Topic:** {{topic, e.g. "What is a ratio?"}}
**Audience:** {{age / level, e.g. "ages 10-13, have seen fractions"}}
**Shape:** {{"concept explainer (one narrator)" or "misconception-first dialogue (narrator + student)"}}
**The misconception to beat:** {{the common wrong way of thinking and the reason people give for it, e.g. "add the same to
both amounts, because that feels fair"; or "find it" if unknown}}
**Target length:** {{1-4 min, by what understanding needs}}
**Models available on screen:** {{blocks you can use, e.g. RatioTiles, RatioTable, RatioGraph, EquationMorph; see docs/BLOCKS.md}}
**Colour roles:** {{e.g. first amount = orange (`first`), second = green (`second`), link = lavender}}
**Project folder:** `examples/{{topic_id}}/`

## Read first
1. `docs/PEDAGOGY.md` (why misconception-first).
2. `docs/SCRIPTWRITING.md`: follow it. Section 1 for the shape, section 2 for how we talk, section 3 for the mechanics.
3. `docs/WORDS_FORMAT.md` (narration.json).
4. The worked example `examples/ratio/data/narration.json` (a concept explainer) for rhythm, line length and cue
   placement.

## Do
1. **Find the misconception.** Name the most common wrong idea about this topic and what it actually measures
   (usually a correct idea used for the wrong question). If you are unsure, say so and list candidates.
2. **Outline the beats** as a table: section id, beat (from the chosen shape), the one idea, the picture that proves it
   (which block / object, what changes), the open question it raises or closes.
3. **Write the lines**: one idea per line, one breath (1-2 sentences), numbers as words, `{cue}` markers right
   before each word a visual must land on, cue names after what appears (`r23`, `squarer`). Sections = beats.
4. **Gaps**: ≈ 0.5 s default, 1.0-1.2 s at section ends, 3.2-3.6 s think pause after the "Your turn" question.
   `lead_in` ≈ 1.5, `tail` ≈ 3.5. Voices: `"voices": {"narrator": "narrator"}` (+ `"student": "narrator_alt"` or
   another voice for a dialogue).
5. **Compute every number** in the script (write the computation next to it in your notes) and verify every yes/no
   answer.
6. **Run the checklist** in `docs/SCRIPTWRITING.md` section 4 and fix what fails.
7. Write `examples/{{topic_id}}/data/narration.json` (with a `_doc` that states the arc and the colour roles) and run
   `python audio/narrate.py examples/{{topic_id}} --dry` to check the lines, character count and cue names.

## Deliver
- The narration.json.
- The beat table (section → idea → picture → question).
- The misconception, and why it feels right.
- The checklist, ticked, with anything you are unsure about.
