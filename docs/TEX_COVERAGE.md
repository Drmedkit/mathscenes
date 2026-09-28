# LaTeX via MathJax: coverage check

**Engine:** MathJax **4.1.3** (`@mathjax/src`, Apache-2.0) + the **New Computer Modern** font (`@mathjax/mathjax-newcm-font`),
TeX input → SVG output with `fontCache: 'none'` (every glyph is its own `<path>`, so we can draw it on, recolour, move and
morph it per glyph). Test: `node tools/tex-coverage.mjs` (163 expressions in 15 groups) → `out/tex-coverage.html`;
`node tools/tex-zoom.mjs out/zoom.html "<tex>" …` renders single expressions big.

## Result: 163 / 163 render correctly

With these extra packages switched on (they ship with MathJax, but are not loaded by default):
`units` (\nicefrac), `gensymb` (\degree), `textcomp` (\textcent), `cancel`, `enclose`, `mathtools`, `html`
(\cssId / \class: how we name parts of a formula), `extpfeil`, `physics`.

Covered (all checked visually):
- **Arithmetic:** + − × ÷ ·, ±, thousands separators `1{,}000`, decimals, repeating decimals `0.\overline{3}`, ≠ < >.
- **Fractions:** \frac \dfrac \tfrac, mixed numbers `2\tfrac12`, nested, slanted `\nicefrac`, cancelling (\cancel,
  \bcancel, \xcancel, \cancelto).
- **Written arithmetic:** column addition/multiplication with `array` + `\hline`, carries with `\overset`, long division
  bracket `\enclose{longdiv}`.
- **Structure:** \underbrace / \overbrace with labels (place value!), all bracket sizes, |x|, floor.
- **Powers/roots/scientific notation**, **percent**, **money** ($, ¢), **ratios** (2 : 3, 2:3 = 4:6).
- **Units/measure:** ft, in, ft², m², °, \degree, °F (both `^\circ\mathrm{F}` and ℉), mph, mi/h.
- **Geometry:** ∠, ∡, △, \overline{AB}, lines/rays/vectors over letters, ∥, ⊥, ≅, ∼, □, π.
- **Relations/logic/sets**, **algebra** (aligned solving steps, cases, the quadratic formula, functions, sin, log, lim),
  **statistics/chance** (x̄, Σ, σ, binomial, P(A|B)), **vectors/matrices**.
- **Arrows & annotation:** \xrightarrow{\times 2} (arrows labelled with the operation!), \overset, ↷, ↻, \boxed,
  \bbox, \fbox, \enclose{circle} (circling an answer), strike-throughs (\enclose{horizontalstrike}{+2}).
- **Text & colour:** \text (incl. ’ and é), bold/italic, \color / \textcolor, \cssId, \phantom (alignment), sizes.
- **Symbols kids meet:** ✓ ★ ♡ △ ○ ■ ∞ … # &.

## Gaps and how we fill them (MathJax is open source: add what you need)
| Gap | Fix |
|---|---|
| `\sfrac` (xfrac) not in MathJax | our own macro: `\sfrac{1}{2}` → `{}^{1}\!/\!{}_{2}` (tested, renders fine) |
| `\qty{5}{ft}` / `\unit{}` (siunitx) not in MathJax; `\qty` from *physics* means brackets | our own macros `\qty{5}{ft}` → `5\,\text{ft}`, `\unit{ft}` → `\text{ft}` (override physics) |
| Real US long division (quotient on top, subtraction steps) is fiddly in TeX | a **block** (LongDivision) that lays out digits itself and animates each step; TeX only for the bracket/digits |
| Column arithmetic with animated carries/borrows | a **block** (ColumnArithmetic), same reason |
| Number lines, bar models, fraction strips, ratio tables, grids | **blocks** (drawn geometry, TeX only for labels) |

## What the renderer must support (from the SVG MathJax emits)
`<path>` (618 in the test, filled glyphs), `<rect>` (22: fraction bars, rules, boxes), `<line>` (9: strikes/cancel,
stroked, stroke-width ≈ 67 em-units), `<polygon>` (4: arrow heads), `<ellipse>` (1: \enclose{circle}, stroked).
Filled vs stroked is honoured per element (`src/core/tex.ts`).
