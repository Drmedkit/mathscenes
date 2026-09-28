// interactive.ts: the kid picks how many cups of lemon they have; the ratio table and the double number line build
// step by step (Next) for THEIR number. The same blocks as the video, driven by a StepDriver instead of the clock.
//   even L:  2 : 3  --×(L/2)-->  L : ?
//   odd L:   2 : 3  --÷2-->  1 : 1½  --×L-->  L : ?        (through the unit rate)
import { begin } from '../src/core/draw';
import { StepDriver, scoped, type Progress } from '../src/core/clock';
import { type Q, qMul, rat } from '../src/core/math';
import { type Theme, THEMES } from '../src/core/theme';
import { onTexLoad, texReady } from '../src/core/tex';
import {
  frame, tryBlock, RatioTable, type RatioTableBlock, type RatioTableStep,
  DoubleNumberLine, type DoubleNumberLineBlock, type DoubleNumberLineStep,
} from '../src/blocks';
import { el, initialTheme, liveCanvas, rememberTheme, tween } from './common';

type Step = `t.${RatioTableStep}` | `d.${DoubleNumberLineStep}`;
const A = 2, B = 3, MIN = 1, MAX = 12;

let theme: Theme = initialTheme();
let L = Number(new URLSearchParams(location.search).get('cups') ?? 5);
if (!Number.isInteger(L) || L < MIN || L > MAX) L = 5;
let stage = 0, p = 0, stopTween: (() => void) | null = null;

interface Plan { ks: number[]; stages: Step[][]; say: string[] }
const fmt = (x: Q) => (x.q === 1 ? String(x.p) : x.q === 2 ? `${(x.p - 1) / 2 || ''}½` : `${x.p}/${x.q}`);

/** what to show, stage by stage, for L cups of lemon */
function plan(L: number): Plan {
  const water = qMul(rat(L), rat(B, A)), w = fmt(water), l = `<b class="l">${L} cups of lemon</b>`, ww = `<b class="w">${w} cups of water</b>`;
  const recipe: Step[] = ['t.grid', 't.head', 't.row0', 'd.lines', 'd.ticks'];
  const s0 = 'The recipe is one batch: <b class="l">2 lemon</b>, <b class="w">3 water</b>.';
  if (L === A) return { ks: [1], stages: [recipe, ['t.hl', 'd.target', 'd.answer']], say: [s0, `${l} is exactly one batch: ${ww}.`] };
  if (L % A === 0) {
    const k = L / A;
    return {
      ks: [1, k],
      stages: [recipe, ['t.arrow1', 't.row1', 'd.arcs', 'd.target'], ['t.hl', 'd.answer']],
      say: [s0, `${L} is <b class="r">${k} times</b> 2, so make <b class="r">${k} batches</b>: times ${k} on both sides.`, `${l} need ${ww}.`],
    };
  }
  const unit = L === 1;
  return {
    ks: unit ? [1, 0.5] : [1, 0.5, L / A],
    stages: unit
      ? [recipe, ['t.arrow1', 't.row1', 'd.unit', 'd.target'], ['t.hl', 'd.answer']]
      : [recipe, ['t.arrow1', 't.row1', 'd.unit'], ['t.arrow2', 't.row2', 'd.arcs', 'd.target'], ['t.hl', 'd.answer']],
    say: unit
      ? [s0, 'Half a batch: <b class="r">÷ 2</b> on both sides gives <b class="l">1 lemon</b> : <b class="w">1½ water</b>.', `${l.replace('cups', 'cup')} needs ${ww}.`]
      : [s0, `${L} is odd, so first find <b class="r">1 cup</b> of lemon: <b class="r">÷ 2</b> on both sides gives <b class="l">1</b> : <b class="w">1½</b> (the unit rate).`,
         `Now <b class="r">× ${L}</b> on both sides: ${L} × 1½ = ${w}.`, `${l} need ${ww}.`],
  };
}

const cvT = document.getElementById('table') as HTMLCanvasElement, cvD = document.getElementById('dnl') as HTMLCanvasElement;
const errT = document.getElementById('errT')!, errD = document.getElementById('errD')!;
const say = document.getElementById('say')!, dots = document.getElementById('dots')!;
const next = document.getElementById('next') as HTMLButtonElement, back = document.getElementById('back') as HTMLButtonElement;
const num = document.getElementById('num')!, quick = document.getElementById('quick')!;
const TW = 1000, TH = 860, DW = 1920, DH = 820;

let P: Plan = plan(L), driver = new StepDriver<Step>(P.stages, 0.3);
let table: RatioTableBlock | null = null, dnl: DoubleNumberLineBlock | null = null;

function build() {
  P = plan(L); driver = new StepDriver<Step>(P.stages, 0.3);
  const rt = tryBlock(() => RatioTable({ a: A, b: B, ks: P.ks, headers: ['lemon', 'water'], arrows: 'consecutive', highlight: P.ks.length - 1 }, frame(20, 20, TW - 40, TH - 40), theme));
  const count = Math.floor(L / A) + 1;
  const dn = tryBlock(() => DoubleNumberLine({ a: A, b: B, count, labels: ['lemon', 'water'], unitRate: L % A === 1, target: L }, frame(30, 20, DW - 60, DH - 40), theme));
  table = rt.ok ? rt.value : null; dnl = dn.ok ? dn.value : null;
  errT.textContent = rt.ok ? '' : rt.error; errT.classList.toggle('on', !rt.ok);
  errD.textContent = dn.ok ? '' : dn.error; errD.classList.toggle('on', !dn.ok);
  num.textContent = String(L);
  quick.querySelectorAll('button').forEach(b => b.classList.toggle('on', Number(b.textContent) === L));
}
function paint() {
  const prog: Progress<Step> = driver.at(stage, p);
  const cT = liveCanvas(cvT, theme, TW, TH), cD = liveCanvas(cvD, theme, DW, DH);
  begin(cT); begin(cD);
  table?.draw(cT, scoped(prog, 't'));
  dnl?.draw(cD, scoped(prog, 'd'));
  say.innerHTML = P.say[stage] ?? '';
  dots.replaceChildren(...P.stages.map((_, i) => el('i', i <= stage ? { class: 'on' } : {})));
  back.disabled = stage === 0;
  next.textContent = stage >= P.stages.length - 1 ? 'Again' : 'Next';
}
function play(to: number) {
  stopTween?.();
  stage = to; p = 0;
  stopTween = tween(1.5, k => { p = k; paint(); });
}
function setCups(n: number) {
  L = Math.max(MIN, Math.min(MAX, n));
  build(); play(0);
}

for (let i = MIN; i <= MAX; i++) {
  const b = el('button', {}, String(i));
  b.addEventListener('click', () => setCups(i));
  quick.append(b);
}
document.getElementById('minus')!.addEventListener('click', () => setCups(L - 1));
document.getElementById('plus')!.addEventListener('click', () => setCups(L + 1));
next.addEventListener('click', () => (stage >= P.stages.length - 1 ? play(0) : play(stage + 1)));
back.addEventListener('click', () => { stopTween?.(); stage = Math.max(0, stage - 1); p = 1; paint(); });
const btn = document.getElementById('theme') as HTMLButtonElement;
btn.addEventListener('click', () => { theme = theme.name === 'ink' ? THEMES.paper : THEMES.ink; rememberTheme(theme); btn.textContent = `theme: ${theme.name}`; build(); paint(); });
rememberTheme(theme); btn.textContent = `theme: ${theme.name}`;
window.addEventListener('resize', paint);

await texReady();
onTexLoad(() => { build(); paint(); });
build();
// ?step=n jumps straight to a finished stage (for screenshots)
const jump = new URLSearchParams(location.search).get('step');
if (jump !== null) { stage = Math.min(P.stages.length - 1, Math.max(0, Number(jump))); p = 1; paint(); } else play(0);
(window as unknown as { interactiveReady: boolean }).interactiveReady = true;
