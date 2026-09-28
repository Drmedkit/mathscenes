# Pedagogy: the explanation spine

Why the videos are built the way they are. `docs/SCRIPTWRITING.md` turns this into concrete writing rules;
`docs/STYLE.md` into picture rules.

## The research: clear is not the same as learned

Derek Muller's PhD research (*Designing Effective Multimedia for Physics Education*, University of Sydney, 2008; the
idea behind his Veritasium videos) compared short physics videos made for students who arrived with a common
misconception. The scores below are the ones he gives in his talk on this research.

- A **clear, concise expository explanation** (the correct idea, stated well) made students **more confident** but
  barely changed their test scores (in his study about 6 → 6.3 out of 26). They already "knew" the wrong idea, did not
  notice the video said something different, and felt confirmed. Students rated it clear and easy.
- A version that **started with the misconception**, had one person voice it, even showed it **as if it could be
  right**, and then worked it out, **nearly doubled** the scores (about 6 → 11 out of 26), although students called it
  "confusing".
- The difference was **mental effort**: the viewer had to notice that their own idea and the evidence disagree.

So a good explanation does not start with the answer. It starts with what the viewer already believes.

## The spine (misconception-first)

| # | beat | what happens |
|---|---|---|
| 1 | **Hook + commit** | A real, concrete problem and an A/B question where the misconception is one option. "Pause and pick. And decide how sure you are." The viewer now has skin in the game. |
| 2 | **The misconception, voiced** | Someone (the student, or the narrator speaking for "most people") voices the common misconception with a reason that SOUNDS fair, because it is how many people really think. The narrator does not say "wrong": "That sounds fair. Let's test it." The picture shows the misconception as if it were right. |
| 3 | **The fair test** | Try it for real (measure, build, count, compare shapes). The contradiction becomes **visible in the picture** before anyone explains it. |
| 4 | **Work it out** | "Here's a clue…": the real idea built step by step with ONE model (tiles, a table, a number line, a graph). The student gets there and says it in their own words. |
| 5 | **The rule, last** | Only now name it and state it: "That's a ratio." The words confirm what the picture already proved. |
| 6 | **Why the wrong idea felt right** | Name what the misconception actually measures (e.g. the difference) and why that is not the question. Respect the first instinct: "If you picked A, you're in good company." |
| 7 | **The twist** | A harder case where the easy trick breaks (non-whole numbers, a new context) → the deeper method (unit rate, the general rule). |
| 8 | **Your turn** | A new question with the same misconception as a distractor; a **think pause** in which nothing new appears; the answer with its reasoning in one line; a **callback** to the hook. |

The concept-explainer shape (no dialogue, one narrator) follows the same logic: the tempting mistake is still tested in
the picture before it is named, and the rule still comes after the evidence. Both shapes are worked out in
`docs/SCRIPTWRITING.md`; the ratio example (`examples/ratio`) is a concept explainer.

## Commit and confidence

- Ask for a choice (A/B), not an open "what do you think?": a choice is quick, and it makes the misconception concrete.
- Ask how sure they are. Confidence is what makes the later contradiction felt.
- In an interactive page, ask the same question before and after the explanation, so the learner can see their mind
  change.

## Attention rules

- **An open question roughly every 30 s** ("So why did adding feel fair?", "Now the hard one."). Close every loop you
  open, on screen.
- **The picture proves it first**, the words explain after. The viewer should see the contradiction before hearing it.
- **One idea on screen at a time.** Remove what is done; don't let the board fill up.
- **Short sentences**, spoken like a smart friend. No "Today we will learn". No filler.
- **A little silly, never childish:** at most one small physical gag per video, and always about the maths (the
  too-sour drink, the rectangle that is suddenly squarer).
- **Length follows understanding:** 1–4 minutes. Cut anything the idea does not need; don't pad to reach a length.

## The student voice (dialogue videos)

A second voice, **the student**, is a sharp classmate, not a foil.

- Voices the misconception once, as a real and reasonable way of thinking ("Fair is fair!").
- Is naive once or twice at most, and **sharp** the rest of the time: spots the smarter strategy, says the rule in
  their own words, sometimes gets there **before** the narrator or is **more right** than the narrator.
- The narrator acknowledges it: "Spot on.", "Good thinking.", "Exactly."
- A character who is always wrong is boring and teaches that guessing means being wrong.

## Built for video AND interaction

The same scene runs as a video (clock) and as an interactive page (steps). Plan each beat as something a learner could
do: the storyboard names the learner's action per beat (pick A/B, drag the second amount, press Next to copy the
group). Keep narration lines short and self-contained (one idea per line) so a line can be reused as the caption of an
interactive step.
