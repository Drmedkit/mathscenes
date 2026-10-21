# Judging samples (grade 7, 7.SP.A.1)

Topic `primary.data.judge-sample-representativeness-and-limit-conclusions`, page `pages/lessons/judging-samples.html`.

## Concept
A conclusion may reach only as far as the data do. Three questions carry it: who is the question about (the
population), who actually gave the data (the sample: a census, part of the population, or a different group), and
who is left out or missing, for a reason linked to the answer or not. The claim is then stated for the group the
data support: the whole group for a census, or when it holds however the missing would have answered; otherwise the
group studied, with the defect named as the reason. Random-sample inference and cause are out of scope.

## Model: `SampleMap` (+ `RecordTable`)
- **SampleMap** (`SampleMap.ts`): the population as one painted region with an amber outline and its label; every
  member a mark (person, apple, day, phone). The asked group is ringed in teal: the whole region (census), a block at
  the right of the map, nearest the board (part), or a separate box outside the region (different group). Left out =
  lavender shading + label. Answers: yes = cream mark, no = dark mark with a cream ring, no reply = dashed teal ring.
  The completion focus fills the no-reply marks all-yes, then all-no (every way the missing could have answered).
  The supported claim = lime outline (round the ring, or the whole map); an overreaching claim = red dashed outline
  round the population. One mark per member up to 300; bigger groups get an exact scale ("1 mark = 5 students")
  when one divides both counts, else a crowd to scale. Steps: `pop dots sample answers leftOut scope over`.
  `where`: pop, popLabel, ring, sampleLabel, left, leftLabel, outside, yes, missing, legend.
- **RecordTable** (`RecordTable.ts`): a sign-up sheet of 12 to 21 rows (name, answer) on a dark card with crisp row
  lines; the audit marks a duplicate (both copies lavender, the copy struck), blanks (dashed teal), and the yes
  answers that count (lime). Steps: `grid rows dup blank yes`.
- **Maths** (`sampling.ts`): `computeStudy` (census / part / different, answered, missing; throws on nonsense),
  `bounds`, `guaranteed` / `possible` over every completion of the unknown answers, `scopeFor`, `countTable`
  (one row per person, a duplicate must repeat the same answer).
- **Board** (`board.ts`): the notation of this topic is an audit card, so the board writes rows of words in the page
  sans, numbers big (66 px, never under 60), labels 44 px: amber = population, teal = data came from, lavender =
  left out, lime = the data support, red = an overreaching claim (struck). Groups are linked by a label pulse on the
  map; the one part (the yes answers) by a leader line.

## The five parts
1. **The question**: Lincoln Middle, 240 seventh graders; the council asked 60 kids at the gym, 51 said yes. Three
   statements: "most of the 240" (`generalizes-beyond-sampled-group`), "51 of the 60 at the gym, may not hold for the
   rest" (right), "nothing at all" (`one-flaw-rejects-all-data`) + how sure.
2. **Worked example** (same study): Name the population (amber outline + row, label pulse) → Find the sample (teal
   ring, answers fill in, "51 of 60 said yes" with a leader to the yes marks) → Ask who is left out (lavender shade,
   "180 not at the gym", likely too high) → State only what the data support (red dashed round all 240 + "most of
   all 240" struck, then lime round the gym block + "51 of 60 at the gym"). Why? 3 reasons: over-included gym kids
   (right), "ask 200 at the gym" (`large-sample-cures-bias`), "the question was about all, so the answers are"
   (`target-population-assumed-measured`).
3. **Your turn** (faded from the end): Oak Hill, all 200 got a reading form, 140 came back, 110 yes, 60 missing.
   Steps 1–2 play by themselves; the kid judges the missing (clue: non-readers kept the form → too high;
   `nonrespondents-answer-like-respondents` distractor), watches the 60 fill all-yes / all-no ("110 to 170 of
   200"), and picks the claim that holds in every case: "more than half, at least 110"
   (distractors: proportional 11 of 14 = `nonrespondents-answer-like-respondents`, "nothing" =
   `one-flaw-rejects-all-data`). Callback to the part-1 pick.
4. **Prove it**: Maya: 160 of 200 in the lunch line like the menu, so most of the 600 Eastside students do. Judge
   (right = `generalizes-beyond-sampled-group`), then a 3-line because-chain from 5 chips (2 distractors:
   `large-sample-cures-bias`, `one-flaw-rejects-all-data`); the map backs each line (population, left out, then the
   claim struck and re-scoped in lime).
5. **Practice**: every sub-goal in topic order, then mixed (runtime/practice.ts).

## Sub-goal → families (plan.ts)
| sub-goal | families | main misconceptions offered |
|---|---|---|
| name-population | namePop (explicit / "our school" implied; people, days, apples), popOrSample | confuses-sample-and-population-terms, population-description-omits-scope, target-population-assumed-measured |
| sample-vs-population | matchKind (census / part / different), whoGave | large-sample-cures-bias, target-population-assumed-measured, census-result-hedged |
| nonresponse-bias | missingWhy (unrelated / linked / unknown reason), missingWay (too high / too low / can't tell) | nonrespondents-answer-like-respondents, missingness-mechanism-does-not-matter |
| selection-bias | leftOut, biasWay (incl. large selective samples and a clear-group-unclear-direction case) | large-sample-cures-bias, generalizes-beyond-sampled-group |
| generalize-scope | scope (part / census / different / undescribed), complete (claims under every completion) | generalizes-beyond-sampled-group, census-result-hedged, no-sample-supports-population-claim |
| integrate-report | revise (duplicate, duplicate that doesn't change "most", blanks, both), audit (checklist: records, collection, scope, measurement) | generic-model-limitations, one-flaw-rejects-all-data |

All practice items are tap-to-choose (no typing); 9 study contexts (contexts.ts) and 5 sign-up sheets give the skins.
