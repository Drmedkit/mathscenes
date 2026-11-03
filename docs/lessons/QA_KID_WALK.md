# Kid walk QA: lessons played in a real browser

`tools/qa/kid.mjs` is a headless, muted Chrome an agent drives step by step (look, click, fill, key, drag, wait),
playing a lesson the way a student does: answers worked out from the screen, a few believable mistakes, all five
parts and practice. Every voice line is logged (http status, playing, ended, cut off). Screenshots go to
`out/kid-<port>/` (git-ignored).

## Round 1, 2026-11-03 (live site, 1366 × 768, three Haiku testers)

Lessons: completing-the-square, scale-basics, quadratic-functions, factoring, quadratics-complex,
conditional-probability. All six play end to end; every mp3 answered 200; the maths in the feedback was right.

**Fixed in the runtime (all lessons):**
- Narration lines cut each other off: a screen that voices three paragraphs only spoke the last one, and "Yes, ..."
  was cut within 1-5 s by the next step's line (the key line of a worked example was often never heard).
  `runtime/voice.ts` now queues lines; the kid's pointer press or Enter, or a part change, still stops the narrator.
- Feedback, the next input and the "Prove it" / "Try one like it" buttons landed below the panel's fold on a laptop
  screen with nothing pointing at them. `runtime/shell.ts` (`followNew`) scrolls new panel content into view,
  never past the top of what is new; a new part starts at the top.

**Checked and not a bug:** "Prove it never unlocks" (completing-the-square) was the old driver not listing
off-screen controls; scale-basics "correct answer graded wrong" (grading code is right; the focus ring on the first
choice looked like a selection); quadratic-functions "max or min without a curve" (the curve draws in ~2 s; the
screenshot was taken before).

**By design, for the owner to decide:** the question part gives no verdict at "Find out" (the callback comes after
Your turn); practice has no voice (voice is for the explain parts).

**Open, minor (per lesson):**
- "Your step." stays on a finished step in Your turn (quadratics-complex, conditional-probability, quadratic-functions).
- Graph and Argand labels overlap ticks or the curve (quadratic-functions worked example and Your turn, quadratics-complex).
- quadratic-functions practice: wrong-answer text "y = −1 = −1"; a generic hint on the rule-from-table item.
- factoring practice: the prompt says "smaller number first" but either order is accepted.
- factoring question: a choice wraps inside a bracket, "(x + 2)(x / + 6)".
- scale-basics Your turn: "in the form 1 : n" with two free boxes (5 : 1 is accepted, then corrected).
- conditional-probability: Your turn table Total row is low contrast; feedback repeats the lesson's fraction (3/8)
  instead of the kid's equal one (6/16).
- quadratic-functions Prove it: content check whether Sam's f(1) = f(5) argument should be "Not yet".
- quadratics-complex practice: 5√10 i marked wrong although the prompt asks for i before the root (wording).
