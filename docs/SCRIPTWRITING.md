# Scriptwriting: how we build an explanation and how we talk

The script is where an explanation succeeds or fails. The engine only makes it visible. Read `docs/PEDAGOGY.md` for
the research behind this; this file is the craft. Formats are in `docs/WORDS_FORMAT.md`.

Two voices are used in this file:
- **the narrator**: calm, off-screen, guides with questions;
- **the student**: a sharp classmate who thinks out loud (only in dialogue videos).

---

## 1. How we build an explanation

Two shapes have worked. Pick the one the idea needs.

### (a) The concept explainer (one narrator)

For an idea people half-know ("a ratio", "a fraction of", "slope"): the job is to make them *see* it. Worked example:
`examples/ratio/data/narration.json` ("What Is a Ratio, Really?", 3:54).

| beat | what it does | in the ratio script |
|---|---|---|
| **Hook: a real-world puzzle** | something concrete and familiar that the idea explains | a phone, a laptop, a cinema screen: different sizes, the same shape. "That's not a coincidence." |
| **The core idea as a rule** | state it in plain words, with the smallest example | 2 orange, 3 green tiles: "A ratio is a rule that links two amounts. For every two orange tiles, there are three green tiles." |
| **What it is not** | close the obvious wrong reading early | "It doesn't say how many tiles there are. It only says how the two amounts belong together." |
| **Build it up** | grow the example step by step, one model | copy the group: 4:6, 6:9, 8:12 → a table → "both numbers are multiplied by the same number" → "equivalent ratios" |
| **The tempting mistake, tested in the picture** | voice the mistake as reasonable, then test it fairly | "Why not add the same amount to both? That feels fair." Rectangles: 2×3 doubled keeps the shape; +2 makes it squarer. Only then is the equation struck. |
| **The deep insight** | the view that makes everything obvious | the points on a graph: one straight line through zero. "A ratio is really a direction." 4:5 is off the line. |
| **Unit / general case** | the method that works for any number | walk back to one: 1 : 1½, the unit rate; five orange → 5 × 1½ |
| **The common confusion** | the second misconception, named and fixed | "Two to three does not mean two thirds of the tiles are orange. It's two out of five." |
| **Recap** | three lines, each tied to a picture | rule · multiply, not add · one line through zero |
| **Callback** | close the hook's loop | "That's why every screen has the same shape. Sixteen to nine." |
| **Your turn + think pause** | a question with the misconception as a distractor; silence; answer with reasoning | "Is ten to fifteen the same as two to three? And five to six?" (3.6 s pause) "Yes, times five. No, three added to both." |

### (b) The misconception-first dialogue (narrator + student)

For a problem where most people's first instinct is wrong. Based on Derek Muller's finding that voicing and testing
the misconception beats a clear explanation (`docs/PEDAGOGY.md`). Worked example, "The Lemonade Problem":

| beat | what it does | example lines |
|---|---|---|
| **Hook + commit** | a concrete problem, an A/B choice with the misconception as one option, and "how sure are you?" | "A lemonade stand. The secret recipe: two cups of lemon juice for every three cups of water. It's a hot day, so we pour in four cups of lemon juice. How much water? A: five cups. Or B: six cups. Pause the video, pick one, and decide how sure you are. Seriously. Pick." (3.0 s gap) |
| **The misconception, voiced** | the student says it with a reason that sounds fair | STUDENT: "It's A! Obviously. We added two more cups of lemon, so we add two more cups of water. Fair is fair!" |
| **The narrator does not judge** | take it seriously, turn it into a test | "That sounds fair. You add the same to both. So let's try it." |
| **The fair test** | the picture shows the contradiction before anyone explains it | two pitchers side by side: "Same drink? Look at the colour." … "Way too sour. The taste changed." |
| **Work it out** | a clue, then the student builds the idea | "The recipe doesn't say plus. It says for every." STUDENT: "For every two… so four cups of lemon is two lots of two?" … "Two lots of three… six! Oh. It's not plus two. It's times two!" |
| **The rule, last** | name it after the picture and the dialogue did the work | "That's a ratio: two to three. Double the lemon, double the water, and every batch tastes the same." |
| **Why the wrong idea felt right** | say what the misconception really measures | "Adding keeps the difference the same. But taste doesn't care about the difference. It cares about how much water there is for each cup of lemon." STUDENT: "So a hundred cups of lemon and a hundred and one of water would have the same difference. And it would be… extremely sour." |
| **The twist** | a harder case where the easy trick breaks | "Now the hard one. Five cups of lemon? That's not a whole number of batches." STUDENT (first!): "Or: for every one cup of lemon, one and a half cups of water." |
| **Your turn** | a new context, the same misconception as a distractor, a think pause | "A smoothie: three bananas for every two cups of milk. For nine bananas, how much milk? A: eight cups. Or B: six cups?" (3.2 s gap) |
| **Answer + callback** | the reasoning in one line; respect the first instinct | "B, six cups. Nine bananas is three batches. And the lemonade? Six cups of water. If you picked A at the start, you're in good company. Now you know why." |

### Rules for both shapes

- **One idea per line.** A line is one breath: one or two sentences.
- **Every visual lands on its word.** If the narrator says "two orange", the orange tiles appear on "two". Plan the
  picture per word while you write (the `{cue}` markers, section 3).
- **The picture proves it before the words explain it.** "Look. It's squarer." comes after the rectangle is visibly
  squarer, and "The shape has changed" after that.
- **An open question roughly every 30 s**, and **close every loop**: every question asked is answered on screen.
- **Concrete before abstract**: tiles before 2 : 3, pitchers before "ratio", points before "direction".
- **Rule last**: the name and the general statement come after the evidence.

---

## 2. How we talk

**Like a smart, calm friend** sitting next to the viewer. Not a teacher at a board, not a presenter.

| do | don't |
|---|---|
| "Let's start small. Here are some tiles." | "Today we will learn about ratios." |
| "But here's a question that trips up almost everyone." | "Now, this is REALLY important, so pay attention!" |
| "Look. It's squarer." | "As you can clearly see, the aspect ratio of the rectangle has been altered." |
| "That sounds fair. Let's test it." | "No, that's wrong." |
| "If you picked A, you're in good company." | "If you picked A, you made a mistake." |

- **Short sentences.** Spoken, not written: "Four orange, six green." is a full line.
- **No filler, no hype**: no "awesome", "super easy", "let's dive in", "without further ado".
- **Concrete first**, abstract second, and the abstract word only once it has a picture to point at.
- **Name things once and consistently.** If it is "the group", it stays "the group"; don't switch to "the set", "the
  bunch". If the amounts are "orange" and "green", every line says orange and green.
- **Numbers**: spoken as words in the script ("two to three", "one and a half", "sixteen to nine"), shown as notation on
  screen (2 : 3, 1½, 16 : 9).
- **Precise maths language that stays friendly**: "for every", "times", "how many times bigger", "the same number",
  "out of every five". Avoid vague words where the maths is exact ("a lot bigger" → "twice as big").
- **A little silly here and there, always about the maths**: "And it would be… extremely sour." One such moment per
  video is plenty.
- **Respect the viewer's first instinct.** A misconception is not a wrong answer; it is a reasonable-sounding way of
  thinking, usually a correct idea used for the wrong question (the difference instead of the ratio).
- **The narrator asks more than it tells**: "So why did adding feel fair?", "What if you have five cups?".

### The student (dialogue videos)

- **Never dumb.** Naive once or twice (a real way of thinking), sharp the rest of the time.
- Gets there **first** at least once, or is **more right** than the narrator ("Or count up from the price, that's
  easier."; "Or: for every one cup, one and a half cups.").
- Says the rule in their own words ("It's not plus two. It's times two!").
- The narrator acknowledges it: "Spot on.", "Good thinking.", "Exactly.", "Fair point."
- When the student is right, the picture shows it as right, on the student's words.

---

## 3. Script mechanics

The script is `data/narration.json` (full format: `docs/WORDS_FORMAT.md`).

```json
{"section": "every", "text": "{rule}A ratio is a rule that links two amounts. This one says: {forevery}for every two orange tiles, there are three green tiles.", "gap": 0.5}
```

- **`{cue}` markers go right before the word the visual must land on.** `{r23}Two to three.` → the 2 : 3 writes on at
  "Two". A marker is not spoken. Name cues after what appears (`r23`, `pt46`, `squarer`), unique in the file.
- A scene can also land on any spoken word without a marker (`word('every', 'three', after)`), so you don't need a
  marker for every beat; add one where a line has several beats or where the word is ambiguous.
- **Sections are beats** (`hook`, `every`, `scale`, `add`, `line`, `unit`, `whole`, `recap`, `try`). A section is
  one step of the explanation and often one camera setup.
- **Gaps** (pause after a line):
  - ≈ 0.5 s default between lines,
  - ≈ 1.0–1.2 s at the end of a section (the picture settles, the next idea starts clean),
  - 3.2–3.6 s **think pause** after a "Your turn" question: nothing new appears during it,
  - longer where the picture needs time to finish (a camera move, a count).
- **`lead_in`** ≈ 1.4–1.6 s (the first picture can start before the first word), **`tail`** ≈ 3–3.5 s (the last
  frame holds, the music fades).
- **Line length**: one breath, 1–2 sentences, rarely more than ~25 words.
- **Target length**: 1–4 minutes, chosen by what understanding needs. The ratio concept explainer is 3:54; a single
  misconception with a twist fits in 2–3 minutes.
- **Voice settings that worked** (ElevenLabs `eleven_multilingual_v2`): narrator calm, `stability` ≈ 0.55,
  `similarity_boost` 0.8, `style` ≈ 0.15, `speed` ≈ 0.95. A student voice can be a little faster (speed ≈ 1.0) and
  livelier (style ≈ 0.3). See `audio/voices.example.json`.
- Check with `python audio/narrate.py <project> --dry` (lines, characters, cue names; no key needed).

---

## 4. Script review checklist

Go through this before you narrate (narration costs credits; re-writing text is free).

- [ ] **The maths is checked by computation**, not by eye: every number in the script (products, unit rates, fractions,
      "out of") recomputed; every "yes / no" answer verified. Blocks re-check it when the scene is built.
- [ ] **Every claim is true** as stated, also in the edge cases the viewer might think of ("every point on this line is
      the same ratio": true for points other than 0).
- [ ] **The misconception is the real, common one** (the one most people actually hold), voiced with the reason people
      actually give, not a strawman.
- [ ] The picture **tests** the misconception fairly before anything is called wrong.
- [ ] **No unexplained jargon**: every technical word ("equivalent", "unit rate") is introduced after its picture and
      used consistently afterwards.
- [ ] **One idea per line**, one breath per line; numbers spoken as words.
- [ ] Every visual beat has its word (a `{cue}` or a clear spoken word); nothing important appears on a filler word.
- [ ] An open question roughly every 30 s; **every loop closed**.
- [ ] **The rule comes last** in its section, after the evidence.
- [ ] The **"Your turn" question has the misconception as a distractor**, a think pause of 3.2–3.6 s, and an answer
      with the reasoning in one line.
- [ ] **The callback lands**: the hook's puzzle is answered with the new idea.
- [ ] Tone: no "Today we will learn", no filler, no hype; the first instinct is respected.
- [ ] Dialogue: the student is naive at most twice and right (or first) at least once, and the narrator acknowledges it.
- [ ] Read it aloud once. Anything you stumble over, the voice will too.
