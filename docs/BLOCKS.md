# Blocks

A **block** is one typed, parameterised piece of maths on the board (a ratio table, a number line, …). It

1. **computes its own maths** from its params with exact rationals (`src/core/math.ts`: `Q`, `qMul`, `qTex`), so
   `RatioTable({a: 2, b: 3, ks: [1, 2.5]})` itself finds 5 : 7½; it never takes an answer from the caller;
2. **validates** the params and throws a `BlockError` with a message a person understands ("with a = b adding the
   same keeps the ratio, so there is nothing wrong to strike");
3. **lays itself out** inside a `Frame` (design px, 1920 × 1080) and checks the readability rules: numbers ≥
   `theme.font.minNum` (60 px), labels ≥ `theme.font.minLabel` (44 px), no two labels overlapping, **no text on a
   line** (`hitsLines`). If the rules can't hold it throws instead of drawing something unreadable;
4. **draws from `(params, progress)` only**: `block.draw(canvas, progress)`, where `progress.k(step)` is 0..1 for
   each named build step. No hidden state: a video frame (TimeDriver) and a kid's click (StepDriver) give the same
   picture for the same progress.

Every block file exports: `XParams`, `XStep` (a string-literal union of its steps), `computeX(params)` (the maths,
unit tested without a canvas), `X(params, frame, theme)` → `Block<XStep>` (`steps`, `box`, `draw`), and a
`X_DEMO` (defaults + slider specs for `gallery.html`).

## The catalogue

### RatioTable (`src/blocks/RatioTable.ts`)
Two columns (e.g. lemon | water); row i is a·kᵢ : b·kᵢ. ×k arrows on **both** sides (the same multiplier on both
columns is the idea), each label in a column beside the row it makes; arcs route outside that column.

| param | meaning |
|---|---|
| `a`, `b` | the base ratio (whole numbers or friendly fractions, denominator ≤ 12) |
| `ks` | row multipliers, e.g. `[1, 2, 3]` or `[1, 0.5, 2.5]` (1 … 8 rows, all different) |
| `headers` | column words (plain text, no TeX specials) |
| `roles` | column colour roles (default `lemon`, `water`) |
| `accent` | colour role of the ×k arrows and the highlight (default `ratio`; the amount palette uses `link`) |
| `arrows` | `'fromFirst'` (×2, ×3 from row 1), `'consecutive'` (÷2 then ×5), `'none'` |
| `highlight` | a row index to frame (step `hl`) |
| `kHeader` | optional leading column showing k (e.g. "batches") |
| `size` | number size in px (default theme `num`, never below 60) |

Steps: `grid`, `head`, `row0`, `arrow1`, `row1`, … , `hl`, `emph` (arrows glow, 0 → 1 → 0).
Validates: a, b > 0 and friendly; 1–8 rows; no repeated multiplier; every row equivalent to a : b; highlight row
exists; header text safe. Layout: rows fit the frame height with numbers ≥ 60 px (row pitch follows the tallest ink,
so fractions get room); table + arrow columns fit the width; no label on a rule, divider or arc.

### DoubleNumberLine (`src/blocks/DoubleNumberLine.ts`)
Two aligned lines; every unit adds a on top and b below, so tick i reads i·a over i·b.

| param | meaning |
|---|---|
| `a`, `b` | per unit (whole numbers) |
| `count` | units shown (ticks 0 … count, at most 12) |
| `labels` | line names |
| `unitRate` | mark 1 : b/a (a new tick if a ≠ 1) and box it |
| `roles`, `accent` | colour roles of the two lines and of the unit box / arcs / answer (default `lemon`, `water`, `ratio`) |
| `target` | a top value to find; its bottom value is the answer (a new tick if needed) |
| `arcs` | ×n arcs from the first unit (when there is no target) |

Steps: `lines`, `ticks`, `unit`, `arcs`, `target`, `answer` (the `?` under the target turns into the answer, boxed).
Validates: whole a, b > 0; 1 ≤ count ≤ 12; target inside the line; the answer keeps the ratio (T : answer = a : b);
arcs point at existing ticks. Layout: labels on shared baselines clear of the ticks (fractions too); neighbouring
labels need 16 px of air; arcs above/below the labels; nothing written on a line.

### EquationMorph (`src/blocks/EquationMorph.ts`)
TeX A → TeX B with matched parts (`\cssId{name}{…}`). Parts in both that look the same glide to their new place;
parts that changed morph outline to outline (+ turns 45° into ×, a 5 grows the hole of a 6); parts only in A fade,
parts only in B write on. Runs of neighbouring struck parts get one strike ("+2" as a whole).

| param | meaning |
|---|---|
| `from`, `to` | the TeX sources with named parts |
| `strike` | parts of `from` struck in step `strike` (they turn coral) |
| `rot` | extra turn while a part morphs (`{opa: π/4}`) |
| `colFrom`, `colTo` | colour role per part before / after |
| `mark` | part of `to` framed in step `mark` (default all) |
| `size` | em size (shrinks to fit, never below 60 px) |
| `accent` | colour role of the mark frame (default `ratio`) |

Steps: `write`, `strike`, `morph`, `mark`.
Validates: both sources parse (bad TeX → the MathJax message); no characters without outlines; struck / rotated /
marked parts exist. The preset **`ratioFix({a, b, add, factor})`** computes its maths: *a+n : b+n = …* (struck)
→ *a×k : b×k = …*, strikes only results that are really wrong (2+2 = 4 = 2×2, so only the 5 is struck), refuses a = b
(adding keeps that ratio) and factor < 2. `roles` / `accent` choose the palette (`['first', 'second']`, `'link'`).

### RatioGraph (`src/blocks/RatioGraph.ts`)
A ratio a : b as a straight line through zero: the first amount across, the second up. Every multiple k·a : k·b is a
point on y = (b/a)·x, and the rectangle from the origin to it always has the same shape; a+n : b+n falls off the line.

| param | meaning |
|---|---|
| `a`, `b` | the ratio (whole numbers or friendly fractions) |
| `ks` | points on the line k·(a, b) (ids `p0`, `p1`, …) |
| `others` | other points `{x, y, id?}`, classified on / off the line with the exact gap (e.g. `{x: 4, y: 5, id: 'add'}`) |
| `unit` | the unit-rate point (1, b/a), id `unit` |
| `stairs` | n unit steps (1 across in the first colour, b/a up in the second) from 0; they land on (n, n·b/a), id `stairs` |
| `labels` | axis names (plain words) |
| `roles`, `accent`, `wrong` | colours (default `first`, `second`, `link`, `wrong`) |
| `xMax`, `yMax` | axis extents of the fitted view |
| `views` | named camera views `{unit, origin, xMax, yMax}` (px per unit, origin in px); each one is layout-checked |

Steps (default `draw`): `grid`, `xAxis`, `yAxis`, `rect:<id>`, `pt:<id>`, `line`, `origin`, `dir`, `gap:<id>`,
`ray:<id>`, `stairs`. `draw(c, p, view?)` takes a view (or `g.lerp('rects', 'plane', k)`: a camera move, zoom
geometric); the painters `grid`, `axes`, `rect` (bottom side in the first colour, left side in the second, drawn out of
the corner), `segment`, `line`, `dot`, `coords` (dashed guides + axis labels), `gap`, `ray`, `stairsDraw`,
`direction`, `originMark` take a `Mapper` so a scene can choreograph single elements. `compareShapes(base, other)`
computes whether two rectangles from one corner have the same shape (the shrunk copy, the gap, "squarer", the
difference and "how many times" of each).
Validates: a, b > 0 and friendly; no point listed twice; on-line points really are on the line; stairs 1 … 12; every
point inside the axes; ≤ 40 units. Layout, for EVERY view: axis labels ≥ 60 px (mixed numbers bigger, so their small
digits stay ≥ 60 px), neighbouring labels apart, no label on an axis or the line, everything inside the frame.

### RatioTiles (`src/blocks/RatioTiles.ts`)
A ratio as unit tiles: a tiles of the first amount, b of the second. One group of a + b tiles is one copy of the ratio.

| param | meaning |
|---|---|
| `a`, `b` | whole numbers of tiles (a + b ≤ 12) |
| `groups` | copies that can be stacked (1 … 6); row i totals (i+1)·a : (i+1)·b |
| `size` | tile size in px (40 … 220) |
| `roles`, `accent` | colours (default `first`, `second`, `link`) |
| `linkLabel` | words on the link arc between the amounts (e.g. `for every`) |

Steps: `a`, `b` (tiles pop in), `link` (the arc), `countA`, `countB` (braces with a and b), `join` (the gap between
the colours closes), `frame` (one group), `copy1` … (each copy slides out of the one above), `bar` (the group becomes a
bar), `whole` (brace: a + b), `partA`, `partB` (braces: a/(a+b), b/(a+b)). Style: frame colour / glow, tile glow,
per-group alpha, count / link alpha (a scene can fly the count numbers elsewhere), empty slots before the tiles.
`computeRatioTiles` also returns `partToPart` = a/b, the fraction that is NOT a part of the whole.
Validates: whole a, b > 0, a + b ≤ 12, 1 … 6 groups, safe label. Layout: labels inside the frame, none on a brace or
the arc, the two part labels apart, the stack fits the frame height.

## How to add a block

1. **Name the maths first.** Write `computeX(params)` in `src/blocks/X.ts`: exact rationals, every assumption a
   `check(cond, NAME, 'message a teacher understands')`. Return plain data (the numbers the picture will show).
2. **Write the tests** in `tests/blocks.test.ts`: a normal case with its computed values, edge cases, and one
   `toThrow(/…/)` per rule.
3. **Name the steps**: `export type XStep = 'axis' | 'ticks' | …` in build order. A step is something a narrator can
   say and a kid can click "Next" for.
4. **Lay out** in `X(params, frame, theme)`: sizes from `theme.font` (never below `minNum` / `minLabel`), measure TeX
   with `texBox`, collect every line you will draw and every label box, then `check(!hitsLines(label, lines))`, check
   the frame fits. Throw rather than squeeze.
5. **Draw** with the core painters only (`drawOn`, `arrow`, `borderFill`, `texDraw`, `morph`, …) and colour **roles**
   (`'lemon'`, `'ratio'`, …), never hex values: themes resolve them. Read progress with `p.k('step')`; no state, no
   `Math.random` (use `hash()`).
6. **Show it**: add `X_DEMO` (params + `ParamSpec` sliders) and a `card()` in `pages/gallery.ts`; export from
   `src/blocks/index.ts`. Invalid slider values must show the validation message.
7. **Use it in a scene** with a `TimeDriver<XStep>` whose beats are cue times from the lesson's `words.json`, and/or
   in an interactive page with a `StepDriver`.

## Ideas for next blocks (primary and lower-secondary maths; contributions welcome)

| block | what it shows | computes / validates |
|---|---|---|
| NumberLine | ticks, jumps (+n / −n hops), points, intervals, fractions / decimals on a line | tick spacing, landing value, labels don't collide |
| PlaceValueChart | th / h / t / o (and tenths…) columns with digits or counters, regrouping | digits from the number, exchanges 10 ↔ 1 |
| BarModel (tape) | part–whole and comparison bars with braces and ? | parts sum to the whole, scale of unequal parts |
| FractionStrip | a whole cut in n equal parts, shaded m; strips stacked for equivalence | m ≤ n (or improper as several wholes), equivalence |
| FractionCircle | pie cut in n, shaded sectors, morph between cuts | same as strip; angles |
| AreaModel | rectangle split by place value for multi-digit × (and algebra later) | partial products sum to the product |
| ArrayGrid | rows × columns of dots / squares, skip counting, commutativity | count = r × c |
| Coordinates | a general grid with axes, points, lines, polygons (RatioGraph covers quadrant I for ratios) | points inside the range, labels clear |
| Balance | a pan balance for equations (both sides the same operation) | sides equal; tilt when not |
| Clock | analogue + digital, elapsed time arcs | hands from the time, elapsed minutes |
| Coins | coins / notes laid out, making amounts, change | total of the set, fewest-coin checks |
| BarChart / Pictogram | bars or symbols with an axis and a key | scale fits the data, key value |
| LinePlot / DotPlot | data dots over a number line | counts per value |
| ColumnArithmetic | column + / − / × with carries and borrows written step by step | each digit and carry from the numbers |
| LongDivision | US layout (quotient on top, subtract, bring down) step by step | each step's product / remainder |
| AnglePro | angle between rays with a protractor, arc and degrees | the measure; acute / right / obtuse |
| ShapeMarks | polygons with tick marks (equal sides), right-angle marks, parallel arrows, labels | side / angle facts consistent |
| Measure | a ruler / measuring jug / scale with a reading | reading on a tick, unit |
| TenFrame / Rekenrek | 10-frames and bead strings for number bonds | fill ≤ 10 per frame, bond pairs |
| PercentBar | a 0–100 % bar aligned with an amount bar (a double number line variant) | percent ↔ amount |
| FunctionTable (in/out) | a rule machine with an input / output table | outputs from the rule |
