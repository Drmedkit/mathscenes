# Polish list (after all 63 topics went live, 2026-10-21)

Small things seen in review that did not block shipping. None is a wrong answer or a broken page.

## Voice
- 29 topics are live without audio ("VOICE PENDING" in STATUS.md): ElevenLabs credits ran out (0 of 603,503).
  When credits are back: `python tools/lesson-voice.py <slug>` per topic (cached by text hash, so partial
  topics like irrational-numbers only generate the missing lines), then commit the mp3s.

## Pictures
- proportional-relationships: a leader makes a long S-curve.
- fraction-of-quantity: a Prove-it leader crosses a denominator.
- ratio-tables-and-proportions: a leader runs close to 1.5.
- simple-interest: practice tapes are small for the stage.
- percents-and-ratios: several practice families are slate-only (threeStep, multiplierToPercent, roundingTip,
  audit, percentThenRate); the ChainTape could draw them.
- multi-step-equations: the practice balance is small; most items are a notation slate.
- dilations-and-similarity: label crowding inside small figures in ratioK; most practice boards hold one line.
- reading-maps: ruler items (cm) leave the map small.
- sampling-and-inference: some sub-goals are board-only (statistic vs parameter, bias direction).
- composite-area-volume: up to ~4% of practice pictures drop one optional label.
- pythagorean-theorem: Prove-it triangle sits high in the frame with empty space below.

## Checks now in the tools
- `node tools/walk-practice.mjs <slug>` measures panel overflow in practice AND in parts 1-4 (after clicking an
  answer); `--parts-only` for a quick check. All 63 topics measured at 0 (dilations-and-similarity: 3 px).

## From the quality layer (2026-10-23)
- rotations: the digit-to-word rule in `script.ts` had literal backspace bytes instead of `\b`, so 6 lines were voiced
  with digits (t.b-one, t.b-count, t.cb-right, t.cb-center, t.cb-flip, t.cb-none). Fixed, lines.json updated; re-voice
  them with `python tools/lesson-voice.py rotations` when the credits are back (2026-11-03).
- REMOVE-ME ``, so 6 lines were voiced
  with digits (t.b-one, t.b-count, t.cb-right, t.cb-center, t.cb-flip, t.cb-none). Fixed, lines.json updated; re-voice
  them with `python tools/lesson-voice.py rotations` when the credits are back (2026-11-03).
- The steps card can push the practice panel over its height (up to 255 px in rotations, ~100 px in the pilot).
