# Style: colour, readability and motion

The look: a calm dark board (or light paper), crisp vector geometry that draws on, proper TeX notation, a restrained
palette where every colour means something, smooth morphs instead of cuts. Everything below is enforced where it can
be (blocks throw a `BlockError` when a layout rule cannot hold) and checked by eye in the review loop where it can't.

Design space: **1920 × 1080 design px** (the video frame). Interactive pages draw the same design px scaled to fit.

## Colour roles

Never write a hex value in a block or a scene: ask the theme for a **role** (`'first'`, `'link'`, …) and a use
(`fill` / `line` / `text`). Themes (`src/core/theme.ts`): `ink` (dark, default) and `paper` (light). A role means the
same thing everywhere in a video: in the picture, in the digits and in the words.

| role | ink colour | meaning |
|---|---|---|
| `first` | orange | the first amount (tiles, the first column, the x axis, its digits) |
| `second` | green | the second amount |
| `link` | lavender | what ties them together: the ratio, equivalence, the line through zero, ×k arrows, frames around a key insight |
| `wrong` | rose | wrong or struck; never confusable with orange |
| `ink` / `dim` / `faint` | cream / greys | plain text, neutral numbers, outlines, grids |
| `lemon`, `water`, `ratio` | yellow, blue, green | an alternative two-amount palette (a recipe: lemon juice and water; `ratio` = the ratio / answers) |
| `pick` | violet | a chosen / highlighted option |
| `brown` | brown | containers and frames |

Rules:
- **Two amounts, two colours, all the way through.** If orange is "the first amount" in the tiles, it is orange in
  the table header, on the x axis and in "2" of 2 : 3.
- Right answers are shown as right by position and a check mark, not by a new colour; wrong uses `wrong` and a strike.
- A new theme = a new `Theme` object with the same roles; blocks and scenes don't change.
- Never copy a third party's look (their palette, their fonts). Make your own.

## Readability (at 1080p)

| rule | value | enforced by |
|---|---|---|
| numbers | **≥ 60 px** font size (`theme.font.minNum`); default 76 (`num`), big 140 | blocks throw below it |
| labels (words) | **≥ 44 px** (`theme.font.minLabel`); default 52 | blocks throw below it |
| margins | **≥ 80 px** from every frame edge for anything that matters (top-most text too) | scene frames (`frame(80, 80, 1760, 920)`) |
| text over lines | **never**: no label on a rule, axis, arc, brace or the line | `hitsLines()` in every block |
| overlapping labels | never; neighbours keep ≥ 16 px air | block layout checks |
| behind digits | calm: no grids, textures or busy shapes behind numbers | review |

- **One idea on screen at a time.** When a section's idea is done, clear it (fade, or morph it into the next idea).
  A full board is a board nobody reads.
- The maths gets the frame: centre the object being talked about; nothing decorative competes with it.
- Fractions and mixed numbers need more height: size by the ink, not by the font size (the blocks do).
- Text is drawn above everything else. Never let a moving object pass in front of a label; hide the label before.

## Motion

- **Each beat on ITS word.** If the narrator says "two orange, three green", the orange tiles appear on "two", the green
  ones on "three". Bind every beat to a cue or a word from `words.json`, never to the line start or a guessed time.
- **Start slightly before the word** (0.05–0.3 s): the change then reads as caused by the word.
- **The think pause reveals nothing.** During the pause after a "Your turn" question nothing new appears; at most a
  gentle pulse on the question itself.
- **Transform, don't cut.** Objects turn into the next idea: tiles close into a group, the counts fly up into 2 : 3,
  the tallies slide into the table, rectangles become points on a graph, + turns into ×. A cut throws away the
  viewer's context.
- **Draw on** lines and shapes (`drawOn`, `borderFill`, `arrow`), **write on** TeX glyph by glyph (`texDraw` with `k`),
  **morph** numbers and formulas (`morph`, `EquationMorph`, `texMorphAt`).
- **Easing**: `E.smooth` (default, calm in and out); `E.back` for a small overshoot on pop-ins; `E.lin` only for
  holds and sweeps. Typical durations: pop-in 0.5–0.8 s, a draw-on 0.8–1.2 s, a morph 1.0–1.4 s, a camera move
  1.5–3 s.
- **Camera**: move it to where the idea is (`withCam`, `lerpCam`: zoom interpolates geometrically, so it feels even).
  One camera move at a time; never move the camera while the viewer must read.
- **Glow and emphasis are rare**: a glow pulse (`E.bump`) marks THE moment of a section (the shapes match, the line
  appears), not every event.
- Motion is calm, never frantic: no shaking, no bouncing loops, no spin for its own sake.
- **Pure frames.** A frame is a function of `t` only: no state between frames, no `Math.random` (use `hash()`), so any
  frame renders the same in any order, in the video and in the browser.

## Hard-won rules (each one was a real bug)

- A visual that appears on the line start instead of on its word reads as "early"; viewers notice it at 0.3 s.
  Check every beat against `word()` / `cue()`.
- Something new during the think pause gives the answer away. The pause is empty on purpose.
- A label that an object passes in front of flickers and becomes unreadable: text is above all paint, or hidden
  before the object moves.
- Lines, grids or patterns behind digits make them hard to read at small sizes (phones). Keep the maths area calm.
- Top-most text closer than ~60–80 px to the frame edge gets cropped on some players. Keep the margins.
- Large glows make blotches and wash out colours. Small and rare only.
- A struck equation that turns red **before** the picture has shown why feels like a verdict, not a discovery:
  keep it neutral until the test is visible, then strike it.
- Nested screens / panels that are not filled show ghost lines through each other: fill a panel before drawing inside it.
- Scene boundaries must be continuous: render ± 0.03 s around every section change and check nothing jumps.
- Colour roles that change meaning halfway (green = second amount, later green = correct) confuse; one meaning per
  colour per video.
- Frames must stay fast (well under ~500 ms each) or long renders crawl: cache TeX outlines and morph shapes (the
  engine does), don't rebuild blocks per frame.
