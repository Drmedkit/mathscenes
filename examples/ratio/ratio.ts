// ratio.ts: "What Is a Ratio, Really?" (3:54, one narrator). The whole video as one scene: every beat is
// bound to its word in data/words.json, and objects turn into the next idea instead of cutting:
//
//   hook   0    three 16:9 screens (phone, laptop, cinema) slide onto each other and match; 16 : 9
//   every  20.9 2 orange + 3 green tiles; "for every" link; the counts fly up into 2 : 3; ghost copies (how many?)
//   scale  48.9 the 5 tiles close into ONE group; copies stack up (4:6, 6:9, 8:12); the totals slide into a ratio
//               table (×2 ×3 ×4 on both sides); "equivalent ratios"
//   add    79.3 2 : 3 → 2+2 : 3+2 = 4 : 5 (neutral); rectangles on a unit grid: 2×3, ×2 → 4×6 (same shape: the
//               shrunk copy fits, one diagonal), +2 → 4×5 (squarer: the shrunk copy falls short) → only now the
//               equation turns rose and is struck; difference stays 1, "how many times" 1.5 → 1.25; + morphs into ×
//   line   121.9 the camera pulls back, axes grow out of the shared corner: the corners ARE the points (2,3) (4,6)
//               (6,9) (8,12); the line through zero; a ratio is a direction; 4 : 5 off the line (gap, own ray)
//   unit   154.7 a bead walks back to (1, 1½): the unit rate; 5 unit steps climb to (5, 7½)
//   whole  172.5 the group as a bar: 5 in all, 2/5 orange, 3/5 green; "2/3 of the tiles" struck, 2 out of 5
//   recap  187.8 three lines; the screens return as rectangles from the origin, corners on one line (16 : 9)
//   try    211.3 10 : 15 ? and 5 : 6 ? (a think pause: nothing moves), then ✓ ×5 on the line, ✗ +3 off it
//
// Colours are theme roles: first (orange) and second (green) amounts, link (lavender: the ratio, equivalence, the
// line, insights), wrong (rose). Frames are a pure function of t.
import { ap, E } from '../../src/core/easing';
import { type Box, type Pt, box, clamp, lerp, pulse, qNum, rat, unionBox } from '../../src/core/math';
import { rectPts } from '../../src/core/pts';
import { type Canvas, arrow, drawOn, fillPts, halo, strike, withAlpha } from '../../src/core/draw';
import { TimeDriver } from '../../src/core/clock';
import { type Paint, type Theme } from '../../src/core/theme';
import { type Formula, tex, texBox, texDraw } from '../../src/core/tex';
import { frame } from '../../src/blocks/block';
import { RatioTable, type RatioTableStep } from '../../src/blocks/RatioTable';
import { EquationMorph, ratioFix, type EquationMorphStep } from '../../src/blocks/EquationMorph';
import { RatioGraph, type GraphView, lerpView, mapper, compareShapes } from '../../src/blocks/RatioGraph';
import { RatioTiles, type RatioTilesStep } from '../../src/blocks/RatioTiles';
import { RATIO } from './cues';
import {
  type Cam, type Rect, CAM0, camPt, card, checkMark, crossMark, deviceBody, frameAround, lerpCam, lerpRect,
  miniPlane, miniRects, miniTiles, partShift, screen, texMorphAt, vis, withCam,
} from './ratioWorld';
import type { SceneDef } from '../../src/scenes/scene';

const w = (sec: string, word: string, after = 0) => RATIO.word(sec, word, after);
const cue = RATIO.cue.bind(RATIO);
export const RATIO_END = 233.9;

/** every beat time, from the narration's words */
function beats() {
  const T = {
    // hook
    phone: w('hook', 'phone'), laptop: w('hook', 'laptop'), cinema: w('hook', 'cinema'), sizes: cue('sizes'),
    same0: cue('same'), sameW: w('hook', 'same', 8), why: cue('why'), ratio: cue('ratio'), ratioW: w('hook', 'ratio', 13),
    once: w('hook', 'once'), start: w('hook', 'start'), everywhere: w('hook', 'everywhere'),
    // every
    tiles: cue('tiles'), two: cue('two'), three: cue('three'), rule: cue('rule'), links: w('every', 'links'),
    forevery: cue('forevery'), fe2: w('every', 'two', cue('forevery')), fe3: w('every', 'three', cue('forevery')),
    write: cue('write'), r23: cue('r23'), to: w('every', 'to', cue('r23')), r23b: w('every', 'three', cue('r23')),
    tilesW: w('every', 'tiles'), notamount: cue('notamount'), howmany: w('every', 'how', cue('notamount')),
    belong0: cue('belong'), belong: w('every', 'belong', cue('belong')), together: w('every', 'together'),
    // scale
    group: cue('group'), five: w('scale', 'five'), groupW: w('scale', 'group', cue('group') + 1), copy: w('scale', 'copy'),
    r46: cue('r46'), six46: w('scale', 'six', cue('r46')), samerule: cue('samerule'), sr2: w('scale', 'two', cue('samerule')),
    sr3: w('scale', 'three', cue('samerule')), copy2: cue('copy2'), r69: cue('r69'), nine: w('scale', 'nine'),
    r812: cue('r812'), twelve: w('scale', 'twelve'), table: cue('table'), pattern: w('scale', 'pattern'),
    times: cue('times'), both: w('scale', 'both'), multiplied: w('scale', 'multiplied'), sameN: w('scale', 'same', cue('times')),
    equiv: cue('equiv'), sameR: w('scale', 'same', cue('equiv')), equivalent: w('scale', 'equivalent'),
    // add
    tempt: cue('tempt'), why2: cue('why2'), addW: w('add', 'add'), add: cue('add'), plus1: w('add', 'plus'),
    plus2: w('add', 'plus', cue('add') + 0.5), three2: w('add', 'three', cue('add')), r45: cue('r45'), five45: w('add', 'five', cue('r45')),
    fair: cue('fair'), shape: cue('shape'), rect23: cue('rect23'), rectW: w('add', 'rectangle'), wide: w('add', 'wide'),
    two23: w('add', 'two', cue('rect23')), three23: w('add', 'three', cue('rect23')), tall: w('add', 'tall'),
    rect46: cue('rect46'), four46: w('add', 'four', cue('rect46')), six46b: w('add', 'six', cue('rect46')),
    bigger: cue('bigger'), bigger1: w('add', 'bigger', cue('bigger')), sameS: w('add', 'same', cue('bigger')), shapeS: w('add', 'shape', cue('bigger') + 1),
    rect45: cue('rect45'), add45: w('add', 'add', cue('rect45')), both45: w('add', 'both', cue('rect45')),
    four45: w('add', 'four', cue('rect45')), five45b: w('add', 'five', cue('rect45')),
    squarer: cue('squarer'), squarerW: w('add', 'squarer'), changed: w('add', 'changed'),
    diff: cue('diff'), difference: w('add', 'difference'), sameD: w('add', 'same', cue('diff')), butD: w('add', 'but', cue('diff') + 1),
    howmany2: cue('howmany'), timesW: w('add', 'times', cue('howmany')), biggerW: w('add', 'bigger', cue('howmany')), other: w('add', 'other'),
    // line
    plot: cue('plot'), axes: cue('axes'), orangeW: w('line', 'orange'), greenW: w('line', 'green'),
    pt23: cue('pt23'), thisW: w('line', 'this'), pt46: cue('pt46'), pt69: cue('pt69'), pt812: cue('pt812'),
    line: cue('line'), lineW: w('line', 'line', cue('line')), origin: cue('origin'), zero: w('line', 'zero'),
    online: cue('online'), sameL: w('line', 'same', cue('online')), direction: cue('direction'), directionW: w('line', 'direction', cue('direction')),
    pt45: cue('pt45'), four4: w('line', 'four', cue('pt45')), five4: w('line', 'five', cue('pt45')), off: w('line', 'off'),
    adding: w('line', 'adding'), pushed: w('line', 'pushed'), different: w('line', 'different'),
    // unit
    back: cue('back'), walk: w('unit', 'walk'), tile1: w('unit', 'tile'), unitpt: cue('unitpt'), oneHalf: w('unit', 'one', cue('unitpt') + 0.5),
    half1: w('unit', 'half'), unitrate: cue('unitrate'), unitW: w('unit', 'unit'), every1: w('unit', 'every'), one1: w('unit', 'one', cue('unitrate') + 1.5),
    oneHalf2: w('unit', 'one', cue('unitrate') + 2), anyamount: cue('anyamount'), point1: w('unit', 'point'),
    five1: cue('five'), fivex: cue('fivex'), times1: w('unit', 'times'), seven: cue('seven'), greenU: w('unit', 'green', cue('seven')),
    // whole
    total: cue('total'), wholeW: w('whole', 'whole'), of5: cue('of5'), five5: w('whole', 'five'), twofifths: cue('twofifths'),
    threefifths: cue('threefifths'), careful: cue('careful'), nottwothirds: cue('nottwothirds'), notW: w('whole', 'not'),
    thirds: w('whole', 'thirds'), orangeWh: w('whole', 'orange', cue('nottwothirds')), twooffive: cue('twooffive'), fiveW: w('whole', 'five', cue('twooffive')),
    // recap
    recap: cue('recap'), rec1: cue('rec1'), rec2: cue('rec2'), rec3: cue('rec3'), zeroR: w('recap', 'zero'),
    screens2: cue('screens2'), screenW: w('recap', 'screen'), sameR2: w('recap', 'same', cue('screens2')), sixteen: cue('sixteen'),
    nineR: w('recap', 'nine'), further: cue('further'), pointR: w('recap', 'point'), lineR: w('recap', 'line', cue('further')),
    // try
    tryq: cue('tryq'), q1: cue('q1'), q2: cue('q2'), think0: 218.0, a1: cue('a1'), yes: w('try', 'yes'),
    two9: w('try', 'two', cue('a1')), times9: w('try', 'times', cue('a1')), five9: w('try', 'five', cue('a1') + 1),
    a2: cue('a2'), no: w('try', 'no'), three9: w('try', 'three', cue('a2')), added: w('try', 'added'), offline: cue('offline'), off9: w('try', 'off', cue('offline')),
  };
  return T;
}
export type RatioBeats = ReturnType<typeof beats>;

// ---------- layout constants (design px) ----------
const HOOK: Record<'phone' | 'laptop' | 'cinema', Rect> = {
  phone: { x: 116, y: 624, w: 224, h: 126 },
  laptop: { x: 508, y: 472, w: 448, h: 252 },
  cinema: { x: 1112, y: 306, w: 704, h: 396 },
};
const MATCH: Rect = { x: 560, y: 236, w: 800, h: 450 };          // where the three screens meet
const DEVICES = ['cinema', 'laptop', 'phone'] as const;          // back to front

const TILE_FRAME = frame(200, 100, 800, 800);                    // RatioTiles: group 0 at y 250
const CAM_TILES: Cam = { x: 600, y: 330, z: 1.3 };             // the tiles alone, centred
const CAM_EVERY: Cam = { x: 770, y: 330, z: 1.3 };              // room on the right for 2 : 3
const CAM_GHOST: Cam = { x: 800, y: 520, z: 1 };

const EQ_TOP: Pt = [960, 150];
const EQ_MID: Pt = [960, 470];

export const ratioVideo: SceneDef = {
  id: 'ratio', title: 'What Is a Ratio, Really?',
  t0: 0, t1: RATIO_END,
  audio: { file: 'examples/ratio/media/final_mix.wav', offset: 0 },
  build(th: Theme) {
    const T = beats();
    const S = (src: string) => tex(src);

    // =============================== blocks ===============================
    const tiles = RatioTiles({ a: 2, b: 3, groups: 4, size: 96, linkLabel: 'for every' }, TILE_FRAME, th);
    const tilesTime = new TimeDriver<RatioTilesStep>({
      a: { at: T.two - 0.05, dur: 0.7 }, b: { at: T.three - 0.05, dur: 0.8 },
      link: { at: T.links - 0.2, dur: 1.1 },
      countA: { at: T.fe2 - 0.1, dur: 0.8 }, countB: { at: T.fe3 - 0.1, dur: 0.8 },
      join: { at: T.five - 0.3, dur: 1.0 }, frame: { at: T.groupW - 0.35, dur: 0.9 },
      copy1: { at: T.copy, dur: 1.2 }, copy2: { at: T.copy2 + 0.05, dur: 1.1 }, copy3: { at: T.r812 - 0.25, dur: 0.95 },
    });
    // ghost copies ("it doesn't say how many"): the same copies, faint, earlier
    const ghostTime = new TimeDriver<RatioTilesStep>({
      a: { at: 0, dur: 0.01 }, b: { at: 0, dur: 0.01 },
      copy1: { at: T.howmany - 0.1, dur: 0.9 }, copy2: { at: T.howmany + 0.25, dur: 0.9 }, copy3: { at: T.howmany + 0.6, dur: 0.9 },
    });

    const table = RatioTable({ a: 2, b: 3, ks: [1, 2, 3, 4], headers: ['orange', 'green'], roles: ['first', 'second'], accent: 'link', arrows: 'fromFirst', size: 84 },
      frame(620, 130, 1220, 820), th);
    const landT = T.table + 1.15;                                   // the tallies land in the table
    const tableTime = new TimeDriver<RatioTableStep>({
      grid: { at: T.table + 0.75, dur: 0.8 }, head: { at: T.table + 0.95, dur: 0.9 },
      row0: { at: landT, dur: 0.01 }, row1: { at: landT, dur: 0.01 }, row2: { at: landT, dur: 0.01 }, row3: { at: landT, dur: 0.01 },
      arrow1: { at: T.times + 0.05, dur: 1.0 }, arrow2: { at: T.times + 0.9, dur: 1.0 }, arrow3: { at: T.both, dur: 1.0 },
      emph: { at: T.multiplied, dur: T.sameN + 1.0 - T.multiplied, ease: E.lin },
    });

    // the equation of the tempting mistake (neutral until the picture proves it)
    const fix0 = ratioFix({ a: 2, b: 3, add: 2, factor: 2, roles: ['first', 'second'], accent: 'link' });
    const tagColon = (src: string) => src.replace(' : ', ' \\cssId{col}{:} ');
    const fix = { ...fix0, from: tagColon(fix0.from), to: tagColon(fix0.to), size: 80,
      colFrom: { ...fix0.colFrom, col: 'link' as const }, colTo: { ...fix0.colTo, col: 'link' as const } };
    const eq = EquationMorph(fix, frame(EQ_TOP[0] - 500, EQ_TOP[1] - 60, 1000, 120), th);
    const eqMoveT = T.shape + 0.1;
    const eqTime = new TimeDriver<EquationMorphStep>({
      write: { at: 0, dur: 0.01 }, strike: { at: T.changed - 0.15, dur: 0.9 }, morph: { at: T.other + 0.2, dur: 1.3 },
    });
    const EQ_BIG = 112;

    // the graph: rectangles (section add), the plane (line), the unit rate (unit); one block, three camera views
    const ORG: Pt = [520, 900];
    const VIEWS = {
      rects: { unit: 100, origin: ORG, xMax: 4.8, yMax: 6.8 },
      plane: { unit: 60, origin: ORG, xMax: 9.5, yMax: 12.8 },
      unit: { unit: 88, origin: ORG, xMax: 6.5, yMax: 8.5 },
    } satisfies Record<string, GraphView>;
    const G = RatioGraph({ a: 2, b: 3, ks: [1, 2, 3, 4], others: [{ x: 4, y: 5, id: 'add' }], unit: true, stairs: 5, labels: ['orange', 'green'], views: VIEWS },
      frame(80, 80, 1760, 920), th);
    const cmpDouble = compareShapes([2, 3], [4, 6]), cmpAdd = compareShapes([2, 3], [4, 5]);
    if (!cmpDouble.same || cmpAdd.same || !cmpAdd.squarer) throw new Error('ratio scene: the shape comparison is not what the script says');
    const shrunkAddH = qNum(cmpAdd.shrunk[1]);                     // 4×5 shrunk to width 2 is 2 × 2.5

    // screens on a plane (recap): 16 : 9 at a quarter, half and full size
    const G2 = RatioGraph({ a: 16, b: 9, ks: [0.25, 0.5, 1], labels: ['width', 'height'],
      views: { s: { unit: 72, origin: [250, 900], xMax: 18.8, yMax: 10.4 } } }, frame(80, 80, 1760, 920), th);
    // your turn: 10 : 15 on the line, 5 : 6 off it
    const G3 = RatioGraph({ a: 2, b: 3, ks: [1], others: [{ x: 10, y: 15, id: 'ten' }, { x: 5, y: 6, id: 'five' }], labels: ['orange', 'green'],
      views: { v: { unit: 44, origin: [1150, 930], xMax: 11.5, yMax: 17 } } }, frame(1000, 80, 840, 920), th);
    if (G3.point('ten').kind !== 'on' || G3.point('five').kind !== 'off') throw new Error('ratio scene: 10:15 must be on the line and 5:6 off it');

    // whole: the group as a bar
    const bar = RatioTiles({ a: 2, b: 3, size: 150 }, frame(400, 110, 1120, 640), th);
    const barTime = new TimeDriver<RatioTilesStep>({
      a: { at: T.total + 0.05, dur: 0.7 }, b: { at: T.total + 0.35, dur: 0.8 }, join: { at: 0, dur: 0.01 },
      frame: { at: T.total + 0.6, dur: 0.8 }, bar: { at: T.wholeW - 0.35, dur: 0.9 },
      whole: { at: T.five5 - 0.3, dur: 0.9 }, partA: { at: T.twofifths - 0.1, dur: 0.9 }, partB: { at: T.threefifths + 0.15, dur: 0.9 },
    });

    // =============================== TeX ===============================
    const R23 = S('\\cssId{a}{2} \\cssId{c}{:} \\cssId{b}{3}');
    const TALLY = [R23, S('\\cssId{a}{4} \\cssId{c}{:} \\cssId{b}{6}'), S('\\cssId{a}{6} \\cssId{c}{:} \\cssId{b}{9}'), S('\\cssId{a}{8} \\cssId{c}{:} \\cssId{b}{12}')] as const;
    const TALLY_SIZE = 84, R23_BIG = 124;
    const R23_POS: Pt = [1000, 317];                                // left-aligned, right of group 0 (world)
    const tallyPos = (i: number): Pt => [tiles.tallyAt(i)[0] + 20, tiles.tallyAt(i)[1]];
    const HOW = [S('5\\,?'), S('10\\,?'), S('15\\,?'), S('20\\,?')];
    const R169 = S('\\cssId{a}{16} : \\cssId{b}{9}');
    const EQUIV = S('\\text{equivalent ratios}');

    // =============================== helpers ===============================
    const ab = (k: number, extra: Record<string, object> = {}) => ({ a: { col: 'first' as Paint, k }, b: { col: 'second' as Paint, k }, '#3A': { col: 'link' as Paint, k }, ...extra });

    // ---------------------------------------------------------------- 1. hook
    function hook(c: Canvas, t: number) {
      const out = 1 - ap(t, T.why + 9.6, 1.0);                     // fades as "every" begins
      if (out <= 0) return;
      withAlpha(c, out, () => {
        const kIn = { phone: ap(t, T.phone - 0.4, 0.8), laptop: ap(t, T.laptop - 0.2, 0.85), cinema: ap(t, T.cinema - 0.15, 1.0) };
        const lift = ap(t, T.same0 + 0.1, 0.6);                    // bodies fade as the screens lift
        const bodyA = 1 - lift;
        const kMove = (i: number) => ap(t, T.same0 + 0.25 + i * 0.12, 1.55);
        const matched = ap(t, T.sameW - 0.25, 0.5);
        DEVICES.forEach((d, i) => {
          if (bodyA > 0) deviceBody(c, d, HOOK[d], kIn[d], bodyA);
        });
        // the screens (drawn back to front), moving onto the match rectangle
        DEVICES.forEach((d, i) => {
          const km = E.smooth(kMove(i));
          const R = lerpRect(HOOK[d], MATCH, km);
          const pic = km > 0 && km < 1 ? 0.55 + 0.45 * (i === 2 ? 1 : 0) : 1;
          screen(c, R, kIn[d], { outline: km >= 1 ? 'link' : 'dim', pic: matched > 0 && i < 2 ? 1 - matched : pic, lw: km >= 1 ? th.lw.base : th.lw.thin });
        });
        // matched: one lavender outline glows
        const glowK = pulse(t, T.sameW - 0.15, 1.3);
        if (matched > 0) {
          const R = rectPts(MATCH.x, MATCH.y, MATCH.w, MATCH.h, 13, 3);
          drawOn(c, R, 1, { col: 'link', lw: th.lw.base, closed: true, glow: 8 + 22 * glowK, glowCol: 'link', alpha: matched });
          halo(c, MATCH.x + MATCH.w / 2, MATCH.y + MATCH.h / 2, 520, 'link', 0.1 * glowK);
        }
        // 16 × 9 squares, the side numbers and the ratio
        const kg = ap(t, T.ratioW - 0.1, 1.3);
        if (kg > 0) {
          const u = MATCH.w / 16;
          for (let i = 1; i < 16; i++) drawOn(c, [[MATCH.x + i * u, MATCH.y + MATCH.h], [MATCH.x + i * u, MATCH.y]], clamp(kg * 1.6 - i * 0.04), { col: 'ink', lw: 1.5, alpha: 0.22 });
          for (let j = 1; j < 9; j++) drawOn(c, [[MATCH.x, MATCH.y + j * u], [MATCH.x + MATCH.w, MATCH.y + j * u]], clamp(kg * 1.6 - j * 0.06), { col: 'ink', lw: 1.5, alpha: 0.22 });
          drawOn(c, [[MATCH.x, MATCH.y + MATCH.h], [MATCH.x + MATCH.w, MATCH.y + MATCH.h]], kg, { col: 'first', lw: th.lw.bold, glow: 10, glowCol: 'first' });
          drawOn(c, [[MATCH.x, MATCH.y + MATCH.h], [MATCH.x, MATCH.y]], kg, { col: 'second', lw: th.lw.bold, glow: 10, glowCol: 'second' });
          texDraw(c, S('16'), MATCH.x + MATCH.w / 2, MATCH.y + MATCH.h + 58, { size: 72, align: 'center', col: 'first', k: ap(t, T.ratioW + 0.2, 0.7) });
          texDraw(c, S('9'), MATCH.x - 34, MATCH.y + MATCH.h / 2, { size: 72, align: 'right', col: 'second', k: ap(t, T.ratioW + 0.45, 0.7) });
        }
        texDraw(c, R169, 960, 905, { size: 110, align: 'center', lag: 0.5, tags: ab(ap(t, T.once, 1.1, E.lin)) });
        // "spotting them everywhere": the same shape at other sizes, all from one corner (a first look at the line)
        const ke = ap(t, T.start - 0.1, 1.6);
        if (ke > 0) {
          [0.25, 0.5, 0.75].forEach((f, i) => {
            const k = clamp(ke * 1.5 - i * 0.22);
            drawOn(c, rectPts(MATCH.x, MATCH.y + MATCH.h * (1 - f), MATCH.w * f, MATCH.h * f, 6, 2), k, { col: 'link', lw: th.lw.thin, closed: true, alpha: 0.85, glow: 8, glowCol: 'link' });
          });
          drawOn(c, [[MATCH.x, MATCH.y + MATCH.h], [MATCH.x + MATCH.w, MATCH.y]], clamp(ke * 1.3 - 0.3), { col: 'link', lw: th.lw.thin, alpha: 0.7, dash: [12, 10], cap: 'butt' });
        }
      });
    }

    // ---------------------------------------------------------------- 2 + 3. every, scale
    const CAM_G1: Cam = { x: 790, y: 380, z: 1.12 }, CAM_G3: Cam = { x: 800, y: 470, z: 1.04 }, CAM_G4: Cam = { x: 810, y: 540, z: 1 };
    const camAt = (t: number): Cam => {
      if (t < T.write) return CAM_TILES;
      if (t < T.notamount + 2.2) return lerpCam(CAM_TILES, CAM_EVERY, ap(t, T.write - 0.1, 1.3));
      if (t < T.group) return lerpCam(CAM_EVERY, CAM_GHOST, ap(t, T.notamount + 2.3, 1.4));
      if (t < T.copy2) return lerpCam(CAM_GHOST, CAM_G1, ap(t, T.group + 0.1, 1.8));
      if (t < T.r812 - 0.4) return lerpCam(CAM_G1, CAM_G3, ap(t, T.copy2, 1.4));
      if (t < T.table - 0.1) return lerpCam(CAM_G3, CAM_G4, ap(t, T.r812 - 0.4, 1.3));
      return lerpCam(CAM_G4, CAM0, ap(t, T.table - 0.05, 1.2));
    };
    // the stack slides left and shrinks so each group sits beside its table row
    const r0 = table.cell('a', 0), r1 = table.cell('a', 1);
    const g0 = tiles.groupBox(0), g1 = tiles.groupBox(1);
    const stackS = (r1[1] - r0[1]) / (g1.cy - g0.cy);
    const stackTo = { s: stackS, dx: 120 + (g0.w * stackS) / 2 - g0.cx * stackS, dy: r0[1] - g0.cy * stackS };
    const stackK = (t: number) => ap(t, T.table - 0.05, 1.2);
    const stackPt = (t: number, p: Pt): Pt => { const k = stackK(t), s = lerp(1, stackTo.s, k); return [p[0] * s + stackTo.dx * k, p[1] * s + stackTo.dy * k]; };

    // the counts under the tiles fly up into "2 : 3" as it is said
    const flyA = T.r23 - 0.2, flyB = T.r23b - 0.2, FLY = 0.75;
    function everyScale(c: Canvas, t: number) {
      if (t < T.tiles - 0.5 || t > T.tempt + 1.2) return;
      const cam = camAt(t);
      const out = 1 - ap(t, T.tempt - 0.4, 0.9);                  // all but row 0 of the table leave as "add" begins
      // ---- tiles (world, through the camera) ----
      withCam(c, cam, () => withAlpha(c, out, () => {
        const k = stackK(t), s = lerp(1, stackTo.s, k);
        c.g.save(); c.g.translate(stackTo.dx * k, stackTo.dy * k); c.g.scale(s, s);
        // ghost copies: faint, only while "how many?" is asked
        const ghostA = vis(t, T.howmany - 0.2, T.belong - 0.3, 0.4, 0.9);
        if (ghostA > 0 && t < T.copy) {
          withAlpha(c, ghostA * 0.3, () => tiles.draw(c, ghostTime.at(t), { braces: false, groupAlpha: i => (i === 0 ? 0 : 1) }));
          HOW.forEach((F, i) => texDraw(c, F, 250, tiles.groupBox(i).cy, { size: 64, align: 'right', col: 'dim', k: ap(t, T.howmany + 0.1 + i * 0.3, 0.6), alpha: ghostA }));
        }
        // the real group(s)
        const p = tilesTime.at(t);
        const lav = ap(t, T.samerule - 0.1, 0.6) * (1 - ap(t, T.copy2 - 0.3, 0.8)) + ap(t, T.sameR - 0.3, 0.8);
        const frameGlow = 6 + 14 * (pulse(t, T.samerule, 1.4) + pulse(t, T.sameR, 1.2));
        // the link arc steps back while "how many?" is asked and returns, glowing, on "belong together"
        const linkA = 1 - vis(t, T.howmany - 0.4, T.belong - 0.5, 0.5, 0.7);
        tiles.draw(c, p, {
          frameCol: lav > 0.5 ? 'link' : 'dim', frameGlow: lav * frameGlow,
          glowA: pulse(t, T.sr2 - 0.1, 1.0) + pulse(t, T.two - 0.1, 0.9) * 0.6, glowB: pulse(t, T.sr3 - 0.1, 1.0) + pulse(t, T.three - 0.1, 0.9) * 0.6,
          countAlpha: 1 - ap(t, T.notamount - 0.2, 0.8), countLabels: [t < flyA, t < flyB],
          linkAlpha: linkA, linkGlow: 20 * pulse(t, T.belong - 0.1, 1.5),
          slotAlpha: ap(t, T.tilesW - 0.1, 0.7),                  // "here are some tiles": five empty places first
        });
        c.g.restore();
      }));
      // ---- the ratio and the running totals (screen space, following the camera / stack) ----
      withAlpha(c, 1, () => {
        const kGroup = ap(t, T.groupW - 0.2, 1.0);                    // 2 : 3 settles as row 0's total
        const toTable = ap(t, T.table + 0.15, 1.0);
        TALLY.forEach((F, i) => {
          const o = { size: TALLY_SIZE, align: 'left' as const };
          let at: Pt, size = TALLY_SIZE, kA = 1, kB = 1, kC = 1;
          if (i === 0) {
            const big = camPt(cam, R23_POS), small = camPt(cam, tallyPos(0));
            at = [lerp(big[0], small[0], kGroup), lerp(big[1], small[1], kGroup)];
            size = lerp(R23_BIG * cam.z, TALLY_SIZE, kGroup);
            kA = t >= flyA + FLY ? 1 : 0; kC = ap(t, T.to - 0.1, 0.5, E.lin); kB = t >= flyB + FLY ? 1 : 0;
            // the flying digits (count label to ratio)
            const o0 = { size: R23_BIG * cam.z, align: 'left' as const };
            const bigAt = camPt(cam, R23_POS);
            ([['a', flyA, tiles.anchors.countA, 'first'], ['b', flyB, tiles.anchors.countB, 'second']] as const).forEach(([tag, f0, from, col]) => {
              const k = ap(t, f0, FLY);
              if (k <= 0 || k >= 1) return;
              const to = texBox(F, bigAt[0], bigAt[1], o0, tag), e = E.smooth(k);
              // a curve that runs under the tiles and rises beside them (never across a tile)
              const fp = camPt(cam, from), cp: Pt = [to.cx, fp[1] + 30], u = 1 - e;
              const x = u * u * fp[0] + 2 * u * e * cp[0] + e * e * to.cx, y = u * u * fp[1] + 2 * u * e * cp[1] + e * e * to.cy;
              texDraw(c, tex(tag === 'a' ? '2' : '3'), x, y, { size: lerp(tiles.numSize * cam.z, R23_BIG * cam.z, e), align: 'center', valign: 'center', col, glow: 14 * E.bump(k) });
            });
            if (kA <= 0 && kC <= 0 && kB <= 0) return;
          } else {
            at = camPt(cam, tallyPos(i));
            const [ta, tb] = i === 1 ? [T.r46, T.six46] : i === 2 ? [T.r69, T.nine - 0.2] : [T.r812, T.twelve - 0.1];
            kA = ap(t, ta - 0.05, 0.6, E.lin); kB = ap(t, tb - 0.05, 0.6, E.lin); kC = kA;
          }
          at = stackK(t) > 0 && i >= 0 ? [at[0], at[1]] : at;
          if (i > 0 && kA <= 0) return;
          // into the table: the numbers slide to their cells, the colon fades
          const cellA = table.cell('a', i), cellB = table.cell('b', i);
          const bA = texBox(F, at[0], at[1], { ...o, size }, 'a'), bB = texBox(F, at[0], at[1], { ...o, size }, 'b');
          const e = E.smooth(toTable);
          const fadeTally = out < 1 && i === 0 ? 1 : out;
          if (t >= landT) return;                                     // the table draws them now
          const glowRow = 18 * pulse(t, i === 0 ? T.r23b : -9, 1);
          const glowC = i === 0 ? 20 * pulse(t, T.belong - 0.1, 1.5) : 0;
          texDraw(c, F, at[0], at[1], { ...o, size, lag: 0.5, alpha: fadeTally, tags: {
            a: { col: 'first', k: kA, dx: (cellA[0] - bA.cx) * e, dy: (cellA[1] - bA.cy) * e, glow: glowRow },
            b: { col: 'second', k: kB, dx: (cellB[0] - bB.cx) * e, dy: (cellB[1] - bB.cy) * e, glow: glowRow },
            c: { col: 'link', k: kC, alpha: 1 - e, glow: glowC, s: 1 + 0.25 * glowC / 20 },
          } });
        });
        // the counts under the tiles fly up into the ratio (section every): drawn by the block; here the "write"
        // moment gets a soft light on the ratio
        if (t > T.write && t < T.group) halo(c, ...camPt(cam, [R23_POS[0] + 110, R23_POS[1]]), 190, 'link', 0.12 * vis(t, T.write + 0.4, T.notamount, 0.8, 1));
        // the colon glows on "belong together"
      });
      // ---- the table ----
      if (t >= T.table - 0.2) withAlpha(c, out, () => {
        table.draw(c, tableTime.at(t));
        // "these are all the same ratio": one lavender frame around the rows; "equivalent ratios"
        const kf = ap(t, T.sameR - 0.35, 1.0);
        if (kf > 0) {
          const top = table.cell('a', 0), bot = table.cell('b', 3);
          const B = box(top[0] - 70, top[1] - 42, bot[0] + 70, bot[1] + 46);
          frameAround(c, B, kf, { pad: 6, glow: 10 + 16 * pulse(t, T.sameR, 1.3) });
          texDraw(c, EQUIV, (B.x0 + B.x1) / 2, B.y1 + 78, { size: 56, align: 'center', col: 'link', k: ap(t, T.equivalent - 0.1, 1.0) });
        }
      });
    }

    // row 0 of the table lives on: its 2 and 3 glide to the middle as "2 : 3" (the equation takes over from there)
    const eqStart = T.add - 0.6;
    function centreRatio(c: Canvas, t: number) {
      if (t < T.tempt - 0.6 || t >= eqStart) return;
      const k = ap(t, T.tempt - 0.5, 1.3);
      const o = { size: R23_BIG, align: 'center' as const };
      const cellA = table.cell('a', 0), cellB = table.cell('b', 0);
      const bA = texBox(R23, EQ_MID[0], EQ_MID[1], o, 'a'), bB = texBox(R23, EQ_MID[0], EQ_MID[1], o, 'b');
      const e = 1 - E.smooth(k), s = lerp(1, TALLY_SIZE / R23_BIG, e);
      texDraw(c, R23, EQ_MID[0], EQ_MID[1], { ...o, tags: {
        a: { col: 'first', dx: (cellA[0] - bA.cx) * e, dy: (cellA[1] - bA.cy) * e, s },
        b: { col: 'second', dx: (cellB[0] - bB.cx) * e, dy: (cellB[1] - bB.cy) * e, s },
        c: { col: 'link', k: ap(t, T.tempt + 0.4, 0.6) },
      } });
    }

    // ---------------------------------------------------------------- 4. add (equation + rectangles)
    const A = eq.A;
    // untagged glyphs of A: 0 the first colon, 1 '=', 2 the second colon
    const eqStyle = (t: number) => {
      const kOpA = ap(t, T.plus1 - 0.05, 0.4), kNA = ap(t, T.plus1 + 0.22, 0.4);
      const kOpB = ap(t, T.plus2 - 0.05, 0.4), kNB = ap(t, T.plus2 + 0.22, 0.4);
      const kEq = ap(t, T.r45 - 0.25, 0.35), kRA = ap(t, T.r45 - 0.05, 0.45), kC2 = ap(t, T.r45 + 0.2, 0.3), kRB = ap(t, T.five45 - 0.05, 0.45);
      return { kOpA, kNA, kOpB, kNB, kEq, kRA, kC2, kRB };
    };
    // the glide from "2 : 3" to the equation's 2 and 3
    const shiftA = partShift(R23, EQ_MID, { size: R23_BIG, align: 'center' }, 'a', A, EQ_MID, { size: EQ_BIG, align: 'center' });
    const shiftB = partShift(R23, EQ_MID, { size: R23_BIG, align: 'center' }, 'b', A, EQ_MID, { size: EQ_BIG, align: 'center' });
    const shiftC = partShift(R23, EQ_MID, { size: R23_BIG, align: 'center' }, 'c', A, EQ_MID, { size: EQ_BIG, align: 'center' }, 'col');

    function addEquation(c: Canvas, t: number) {
      if (t < eqStart || t > T.plot + 1.2) return;
      const out = 1 - ap(t, T.plot, 0.8);
      withAlpha(c, out, () => {
        if (t < eqMoveT + 1.0) {
          // written part by part in the middle, then it rises to the top
          const kIn = ap(t, T.add - 0.55, 0.8);                     // 2 and 3 glide apart as "two plus two" begins
          const kUp = ap(t, eqMoveT, 1.0);
          const x = lerp(EQ_MID[0], EQ_TOP[0], kUp), y = lerp(EQ_MID[1], EQ_TOP[1], kUp), size = lerp(EQ_BIG, eq.size, kUp);
          const st = eqStyle(t);
          const e = 1 - E.smooth(kIn);
          const s0 = R23_BIG / EQ_BIG;
          texDraw(c, A, x, y, { size, align: 'center', glyph: g => {
            if (g.tag === null) return { col: g.pi === 0 ? 'dim' : 'link', k: g.pi === 0 ? st.kEq : st.kC2 };
            switch (g.tag) {
              case 'a': return { col: 'first', dx: -shiftA[0] * e, dy: -shiftA[1] * e, s: lerp(1, s0, e) };
              case 'b': return { col: 'second', dx: -shiftB[0] * e, dy: -shiftB[1] * e, s: lerp(1, s0, e) };
              case 'col': return { col: 'link', dx: -shiftC[0] * e, dy: -shiftC[1] * e, s: lerp(1, s0, e) };
              case 'opa': return { col: 'dim', k: st.kOpA };
              case 'na': return { col: 'dim', k: st.kNA };
              case 'opb': return { col: 'dim', k: st.kOpB };
              case 'nb': return { col: 'dim', k: st.kNB };
              case 'ra': return { col: 'first', k: st.kRA };
              case 'rb': return { col: 'second', k: st.kRB };
              default: return undefined;
            }
          } });
          // "that feels fair": a calm glow, nothing marked wrong
          if (t > T.fair - 0.2 && t < eqMoveT) halo(c, x, y, 420, 'ink', 0.05 * pulse(t, T.fair - 0.1, 1.6));
        } else {
          eq.draw(c, eqTime.at(t));
        }
      });
    }

    // side labels of the rectangles
    const sideW = (m: ReturnType<typeof mapper>, w: number): Pt => [m.px(w / 2, 0)[0], m.origin[1] + 58];
    const sideH = (m: ReturnType<typeof mapper>, h: number): Pt => [m.origin[0] - 34, m.px(0, h / 2)[1]];
    const LAB = 72;

    function rects(c: Canvas, t: number, v: GraphView) {
      if (t < T.shape - 0.2 || t > T.plot + 2.2) return;
      const m = mapper(v);
      const zoomOut = ap(t, T.plot + 0.2, 1.6);
      const labA = 1 - ap(t, T.plot, 0.6);
      // the grid
      G.grid(c, m, ap(t, T.shape + 0.4, 1.4), 1.3 - 0.5 * zoomOut);
      // --- 2 × 3 ---
      const k2 = { bottom: ap(t, T.two23 - 0.05, 0.6), left: ap(t, T.three23 - 0.05, 0.6), close: ap(t, T.tall, 0.6), fill: ap(t, T.tall + 0.2, 0.8) };
      // the solid rectangle: 2×3, grows to 4×6, back to 2×3, then +2 +2 to 4×5
      const kDbl = ap(t, T.rect46 + 0.2, 1.3);
      const kUndo = ap(t, T.rect45 - 0.05, 0.55);
      const kAddW = ap(t, T.add45 + 0.1, 0.8), kAddH = ap(t, T.both45 - 0.1, 0.8);
      let rw = 2, rh = 3;
      if (t < T.rect45 - 0.05) { rw = lerp(2, 4, E.smooth(kDbl)); rh = lerp(3, 6, E.smooth(kDbl)); }
      else if (kAddW <= 0) { rw = lerp(4, 2, E.smooth(kUndo)); rh = lerp(6, 3, E.smooth(kUndo)); }
      else { rw = lerp(2, 4, E.smooth(kAddW)); rh = lerp(3, 5, E.smooth(kAddH)); }
      // ghost of 2 × 3 (dashed) once it starts to grow
      const ghost23 = t > T.rect46 ? 1 : 0;
      const fit = pulse(t, T.sameS - 0.3, 1.4);                      // the shrunk 4×6 lands exactly on 2×3
      if (ghost23) G.rect(c, m, 2, 3, 1, { fill: null, bottom: 'first', left: 'second', rest: 'dim', dash: [10, 8], lw: th.lw.thin, alpha: 0.9 * (1 - zoomOut), glow: 20 * fit, glowCol: 'link' });
      // ghost of 4 × 6 once 4×5 is made
      const g46 = ap(t, T.rect45 - 0.05, 0.5);
      if (g46 > 0) G.rect(c, m, 4, 6, 1, { fill: null, bottom: 'link', left: 'link', rest: 'link', dash: [10, 8], lw: th.lw.thin, alpha: 0.55 * g46 * (1 - zoomOut) });
      // the solid one
      const add45 = kAddW > 0;
      G.rect(c, m, rw, rh, t < T.rect46 ? k2 : 1, { fillAlpha: 0.13, alpha: add45 ? 1 - zoomOut : 1, fill: 'ink' });
      // the diagonal of 2×3 through to 4×6 (the same shape shares one diagonal)
      const kDiag = ap(t, T.sameS - 0.6, 1.0);
      G.segment(c, m, [0, 0], [4, 6], kDiag, { col: 'link', lw: th.lw.base, glow: 10 + 14 * fit, alpha: 1 - zoomOut });
      // the shrunk copy of 4×6: half as big, lands on 2×3
      const kShr = ap(t, T.bigger1 + 0.7, 1.0), shrA = vis(t, T.bigger1 + 0.6, T.rect45 - 0.4, 0.3, 0.5);
      if (shrA > 0) { const f = lerp(1, 0.5, E.smooth(kShr)); G.rect(c, m, 4 * f, 6 * f, 1, { fill: 'link', fillAlpha: 0.12, bottom: 'link', left: 'link', rest: 'link', lw: th.lw.base, alpha: shrA, glow: 8 + 16 * fit }); }
      // 4×5: its own diagonal, and its shrunk copy falls short of 2×3
      const kD45 = ap(t, T.squarer + 0.1, 0.8);
      const gone = 1 - zoomOut;
      if (add45) G.segment(c, m, [0, 0], [4, 5], kD45, { col: 'ink', lw: th.lw.thin + 0.5, alpha: 0.85 * gone });
      const kS45 = ap(t, T.squarerW + 0.3, 1.0), s45A = vis(t, T.squarerW + 0.2, T.diff - 0.2, 0.3, 0.6);
      if (s45A > 0) { const f = lerp(1, 0.5, E.smooth(kS45)); G.rect(c, m, 4 * f, 5 * f, 1, { fill: 'ink', fillAlpha: 0.1, bottom: 'ink', left: 'ink', rest: 'ink', lw: th.lw.base, alpha: s45A }); }
      // the gap: 2 × 2.5 against 2 × 3, in rose once "the shape has changed"
      const kGap = ap(t, T.changed - 0.4, 0.7);
      if (kGap > 0 && s45A > 0) {
        const A0 = m.px(0, shrunkAddH), A1 = m.px(2, shrunkAddH), B0 = m.px(0, 3), B1 = m.px(2, 3);
        fillPts(c, [A0, A1, B1, B0], 'wrong', 0.28 * kGap * s45A);
        drawOn(c, [A0, A1], kGap, { col: 'wrong', lw: th.lw.base, alpha: s45A, glow: 12, glowCol: 'wrong' });
      }
      // side labels (morphing numbers)
      if (labA > 0) withAlpha(c, labA, () => {
        const kw = ap(t, T.two23, 0.6), kh = ap(t, T.three23, 0.6);
        let wA = '2', wB = '2', hA = '3', hB = '3', km = 0;
        if (t < T.rect45 - 0.05) { wB = '4'; hB = '6'; km = ap(t, T.four46 - 0.3, 0.7); }
        else if (!add45) { wA = '4'; hA = '6'; km = kUndo; }
        else { wB = '4'; hB = '5'; km = ap(t, T.four45 - 0.35, 0.7); }
        if (kw > 0) texMorphAt(c, wA, wB, ...sideW(m, rw), LAB, km, 'first', { alpha: kw });
        if (kh > 0) texMorphAt(c, hA, hB, ...sideH(m, rh), LAB, km, 'second', { align: 'right', alpha: kh });
        if (km < 1 && add45) {
          // "+2" on the growing sides
          const kp = vis(t, T.add45, T.four45, 0.3, 0.5);
          texDraw(c, S('+2'), m.px(3.1, 0)[0], m.origin[1] + 58, { size: 60, align: 'center', col: 'dim', alpha: kp * kAddW });
          texDraw(c, S('+2'), m.origin[0] - 34, m.px(0, 4.1)[1], { size: 60, align: 'right', col: 'dim', alpha: kp * kAddH });
        }
      });
    }

    // the difference / how-many-times panel
    const PX = 1110;
    const DROWS = [
      { lab: S('\\cssId{a}{2} : \\cssId{b}{3}'), d: S('\\cssId{b}{3} - \\cssId{a}{2} = \\cssId{r}{1}'), m: S('\\cssId{b}{3} \\div \\cssId{a}{2} = \\cssId{r}{1.5}'), y: 470, good: true },
      { lab: S('\\cssId{a}{4} : \\cssId{b}{5}'), d: S('\\cssId{b}{5} - \\cssId{a}{4} = \\cssId{r}{1}'), m: S('\\cssId{b}{5} \\div \\cssId{a}{4} = \\cssId{r}{1.25}'), y: 640, good: false },
    ];
    const PS = 64;
    const labW = Math.max(...DROWS.map(r => texBox(r.lab, 0, 0, { size: PS }).w));
    const dW = Math.max(...DROWS.map(r => texBox(r.d, 0, 0, { size: PS }).w));
    const mW = Math.max(...DROWS.map(r => texBox(r.m, 0, 0, { size: PS }).w));
    const colD = PX, colM = colD + dW + 90;
    void labW;
    if (colM + mW > 1840) throw new Error(`ratio scene: the difference panel is ${Math.round(colM + mW)} px wide (limit 1840)`);
    const HD = S('\\text{difference}'), HM = S('\\text{how many times}');

    function diffPanel(c: Canvas, t: number) {
      if (t < T.diff - 0.3 || t > T.plot + 1) return;
      const out = 1 - ap(t, T.plot - 0.1, 0.8);
      withAlpha(c, out, () => {
        const dimD = 1 - 0.6 * ap(t, T.butD + 0.3, 0.8);
        texDraw(c, HD, colD + dW / 2, 360, { size: 48, align: 'center', col: 'dim', k: ap(t, T.difference - 0.1, 0.8), alpha: dimD });
        texDraw(c, HM, colM + mW / 2, 360, { size: 48, align: 'center', col: 'link', k: ap(t, T.timesW - 0.4, 0.8) });
        DROWS.forEach((r, i) => {
          const kd = ap(t, T.difference + i * 0.35, 0.8), same = pulse(t, T.sameD - 0.1, 1.3);
          texDraw(c, r.d, colD, r.y, { size: PS, align: 'left', col: 'dim', k: kd, alpha: dimD, tags: { a: { col: 'first' }, b: { col: 'second' }, r: { col: 'ink', glow: 20 * same } } });
          const km = ap(t, T.timesW - 0.1 + i * 0.55, 0.8), hi = pulse(t, T.biggerW + 0.3 + i * 0.3, 1.2);
          texDraw(c, r.m, colM, r.y, { size: PS, align: 'left', col: 'dim', k: km, tags: { a: { col: 'first' }, b: { col: 'second' }, r: { col: r.good ? 'link' : 'wrong', glow: 22 * hi } } });
        });
      });
    }

    // ---------------------------------------------------------------- 5 + 6. line, unit (the plane)
    const viewAt = (t: number): GraphView => {
      if (t < T.plot + 0.2) return VIEWS.rects;
      if (t < T.back) return lerpView(VIEWS.rects, VIEWS.plane, E.smooth(ap(t, T.plot + 0.2, 1.7, E.lin)));
      return lerpView(VIEWS.plane, VIEWS.unit, E.smooth(ap(t, T.back + 0.2, 1.8, E.lin)));
    };
    const P = (id: string) => G.point(id);
    const PTS = [
      { id: 'p0', rect: T.pt23 - 0.2, pop: T.thisW - 0.1 },
      { id: 'p1', rect: T.pt46 - 0.25, pop: T.pt46 + 0.45 },
      { id: 'p2', rect: T.pt69 - 0.25, pop: T.pt69 + 0.45 },
      { id: 'p3', rect: T.pt812 - 0.25, pop: T.pt812 + 0.5 },
    ];
    const BEAD = S('\\cssId{a}{2} : \\cssId{b}{3}');
    const UNITR = S('\\cssId{a}{1} : \\cssId{b}{1\\tfrac{1}{2}}');
    const FIVEX = S('\\cssId{a}{5} \\times \\cssId{u}{1\\tfrac{1}{2}} = \\cssId{b}{7\\tfrac{1}{2}}');
    const DIRL = S('\\text{a direction}'), UNITL = S('\\text{unit rate}');

    function plane(c: Canvas, t: number) {
      if (t < T.plot - 0.1 || t > T.total + 0.6) return;
      const v = viewAt(t), m = mapper(v);
      const out = 1 - ap(t, T.total - 0.3, 0.8);
      withAlpha(c, out, () => {
        // grid continues from the rectangles; axes grow out of the shared corner
        if (t > T.plot + 2.2) G.grid(c, m, 1, 0.8);
        G.axes(c, m, ap(t, T.orangeW - 0.2, 1.1), ap(t, T.greenW - 0.2, 1.1));
        const past = (x: number) => ap(t, x, 0.6);
        // the old rectangles fade once their point is there; 4×5 returns (rose) for "four to five?"
        const offA = vis(t, T.four4 - 0.3, T.back - 0.6, 0.4, 0.7);
        const fadeLate = 1 - ap(t, T.back - 0.6, 0.7);                // (6,9) (8,12) and 4:5 leave before the zoom in
        PTS.forEach((q, i) => {
          const p = P(q.id), x = qNum(p.x), y = qNum(p.y);
          const kr = i === 0 ? 1 : ap(t, q.rect, 0.8);
          const dim = ap(t, q.pop + 0.4, 1.2);
          const rectA = (i === 0 ? 1 - 0.75 * dim : 1 - 0.75 * dim) * (1 - ap(t, T.line - 0.4, 0.8));
          // 2×3 is the rectangle of the add section, now solid again as the camera pulls back
          const inA = i === 0 ? ap(t, T.plot + 0.1, 0.9) : 1;
          if (t < T.line + 0.6) G.rect(c, m, x, y, kr, { fill: 'ink', fillAlpha: 0.13, alpha: rectA * inA });
        });
        // the line through zero
        const kLine = ap(t, T.lineW - 0.75, 1.1);
        const dirK = ap(t, T.directionW - 0.6, 1.0);
        G.line(c, m, kLine, { glow: 8 + 18 * pulse(t, T.directionW - 0.2, 1.6) + 10 * pulse(t, T.sameL - 0.5, 1.5) });
        // "runs through zero": a light travels down the line and lands on 0
        const kz = ap(t, T.zero - 1.0, 1.0, E.inOut);
        if (kz > 0 && kz < 1) {
          const x1 = Math.min(v.xMax, v.yMax / 1.5), x = lerp(x1, 0, kz);
          halo(c, ...m.px(x, x * 1.5), 70, 'link', 0.6);
        }
        G.originMark(c, m, ap(t, T.zero - 0.1, 0.6), pulse(t, T.zero, 1.2));
        // "every point on this line is the same ratio": a bead rides the line, its rectangle keeps its shape
        const kb = vis(t, T.online + 0.1, T.direction - 0.4, 0.4, 0.6);
        if (kb > 0) {
          const u = E.inOut(ap(t, T.online + 0.2, 2.2, E.lin));
          const x = lerp(0.8, 8.2, u < 0.5 ? u * 2 : 2 - u * 2) ;
          G.rect(c, m, x, G.lineAt(x), 1, { fill: 'link', fillAlpha: 0.1, bottom: 'link', left: 'link', rest: 'link', lw: th.lw.thin, alpha: kb * 0.9 });
          G.dot(c, m, x, G.lineAt(x), 1, { col: 'link', r: 13, glow: 0.6, alpha: kb });
        }
        // a ratio is a direction
        const dA = 1 - ap(t, T.pt45 - 0.3, 0.7);
        if (dirK > 0 && dA > 0) {
          const nx = 0.832, ny = 0.555, off = 46;          // unit normal to the line, towards lower right (screen)
          const a0 = m.px(0.7, 1.05), a1 = m.px(7.4, 11.1);
          arrow(c, [[a0[0] + nx * off, a0[1] + ny * off], [a1[0] + nx * off, a1[1] + ny * off]], dirK, { col: 'link', lw: th.lw.bold, head: 30, glow: 10 + 20 * pulse(t, T.directionW - 0.1, 1.8), glowCol: 'link', alpha: dA });
        }
        withAlpha(c, vis(t, T.directionW - 0.4, T.back - 0.8, 0.8, 0.7), () => {
          texDraw(c, BEAD, 1330, 330, { size: 104, align: 'center', lag: 0.5, tags: ab(ap(t, T.directionW - 0.5, 0.9, E.lin)) });
          texDraw(c, DIRL, 1330, 450, { size: 56, align: 'center', col: 'link', k: ap(t, T.directionW - 0.2, 0.9) });
        });
        // 4 : 5 off the line
        if (offA > 0) {
          const q = P('add');
          G.rect(c, m, 4, 5, ap(t, T.four4 - 0.2, 0.9), { fill: 'wrong', fillAlpha: 0.1, bottom: 'wrong', left: 'wrong', rest: 'wrong', lw: th.lw.thin + 0.5, alpha: offA * 0.8 });
          G.ray(c, m, 'add', ap(t, T.pushed - 0.1, 1.2), offA);
          G.gap(c, m, 'add', ap(t, T.off - 0.1, 0.7), offA);
          G.coords(c, m, q.x, q.y, ap(t, T.five4 - 0.3, 0.8), { x: false, alpha: offA });
          G.dot(c, m, 4, 5, ap(t, T.five4 - 0.1, 0.6), { col: 'wrong', alpha: offA, glow: pulse(t, T.off, 1.2) });
        }
        // the points (corners) with their coordinates
        PTS.forEach((q, i) => {
          const p = P(q.id), k = ap(t, q.pop - 0.35, 0.8);
          if (k <= 0) return;
          const late = i >= 2 ? fadeLate : 1 - 0.55 * ap(t, T.back - 0.6, 0.7);
          G.coords(c, m, p.x, p.y, k, { alpha: late, guides: t < T.line + 0.4 ? true : false });
          G.dot(c, m, qNum(p.x), qNum(p.y), ap(t, q.pop - 0.1, 0.6), { col: 'link', alpha: late, glow: pulse(t, T.lineW - 0.3, 1.2) * 0.8 });
        });
        // ---- unit: walk back to (1, 1½), the unit rate, five unit steps to (5, 7½) ----
        const walkA = vis(t, T.walk - 0.1, T.unitpt + 0.2, 0.4, 0.6);
        if (walkA > 0) {
          const x = lerp(2, 1, E.inOut(ap(t, T.walk + 0.2, T.tile1 - T.walk, E.lin)));
          G.rect(c, m, x, G.lineAt(x), 1, { fill: 'link', fillAlpha: 0.1, bottom: 'link', left: 'link', rest: 'link', lw: th.lw.thin, alpha: walkA * 0.9 });
          G.dot(c, m, x, G.lineAt(x), 1, { col: 'link', r: 13, glow: 0.7, alpha: walkA });
        }
        const u = P('unit');
        const kU = ap(t, T.unitpt - 0.1, 0.6);
        const unitA = 1 - ap(t, T.total - 0.3, 0.6);
        if (kU > 0) {
          G.rect(c, m, 1, 1.5, 1, { fill: 'link', fillAlpha: 0.14, bottom: 'first', left: 'second', rest: 'link', lw: th.lw.base, alpha: 0.9 * (1 - ap(t, T.fivex - 0.2, 0.6) * 0.6) });
          G.coords(c, m, u.x, u.y, ap(t, T.oneHalf - 0.3, 0.9), { glow: 14 * pulse(t, T.half1, 1.2) });
          G.dot(c, m, 1, 1.5, kU, { col: 'link', glow: pulse(t, T.unitpt, 1.2), alpha: unitA });
        }
        // the unit rate, written beside the plane
        withAlpha(c, vis(t, T.unitW - 0.3, T.total - 0.5, 0.5, 0.6), () => {
          texDraw(c, UNITL, 1450, 300, { size: 56, align: 'center', col: 'link', k: ap(t, T.unitW - 0.2, 0.8) });
          texDraw(c, UNITR, 1450, 420, { size: 104, align: 'center', lag: 0.5, tags: {
            a: { col: 'first', k: ap(t, T.one1 - 0.1, 0.5, E.lin) }, '#3A': { col: 'link', k: ap(t, T.one1 + 0.1, 0.4, E.lin) },
            b: { col: 'second', k: ap(t, T.oneHalf2 - 0.05, 0.7, E.lin) } } });
          const bx = texBox(UNITR, 1450, 420, { size: 104, align: 'center' });
          frameAround(c, unionBox([bx, texBox(UNITL, 1450, 300, { size: 56, align: 'center' })]), ap(t, T.oneHalf2 + 0.5, 1.0), { pad: 34, glow: 8 + 14 * pulse(t, T.oneHalf2 + 0.9, 1.2) });
        });
        // "any point on the line": the line lights up
        const anyK = pulse(t, T.point1 - 0.6, 1.4);
        if (anyK > 0) G.line(c, m, 1, { glow: 26 * anyK, alpha: 0.6 * anyK, lw: th.lw.heavy });
        // five orange: a guide up from 5; five steps of (1 across, 1½ up)
        const kFive = vis(t, T.five1 - 0.1, T.total - 0.5, 0.5, 0.6);
        if (kFive > 0) {
          const [x5, y0] = m.px(5, 0), top = m.px(5, 7.5)[1];
          drawOn(c, [[x5, y0], [x5, top]], ap(t, T.five1, 0.8), { col: 'first', lw: th.lw.thin, dash: [8, 9], cap: 'butt', alpha: kFive * 0.7 });
          G.coords(c, m, rat(5), rat(15, 2), ap(t, T.five1 - 0.1, 0.8), { y: false, guides: false, alpha: kFive });
        }
        G.stairsDraw(c, m, ap(t, T.times1 - 0.3, T.seven - T.times1 + 0.2, E.lin), 1 - ap(t, T.total - 0.5, 0.6));
        const kSev = ap(t, T.seven - 0.05, 0.6);
        if (kSev > 0) {
          const s = P('stairs');
          G.coords(c, m, s.x, s.y, ap(t, T.seven - 0.2, 0.9), { x: false, glow: 16 * pulse(t, T.greenU - 0.3, 1.2), alpha: unitA });
          G.dot(c, m, 5, 7.5, kSev, { col: 'link', glow: pulse(t, T.seven, 1.2), alpha: unitA });
        }
        withAlpha(c, vis(t, T.times1 - 0.3, T.total - 0.5, 0.4, 0.6), () => {
          texDraw(c, FIVEX, 1450, 660, { size: 92, align: 'center', lag: 0.4, tags: {
            a: { col: 'first', k: ap(t, T.fivex - 0.1, 0.5, E.lin) }, u: { col: 'second', k: ap(t, T.times1 + 0.2, 0.7, E.lin) },
            '#D7': { col: 'dim', k: ap(t, T.times1 - 0.1, 0.4, E.lin) }, '#3D': { col: 'dim', k: ap(t, T.seven - 0.3, 0.3, E.lin) },
            b: { col: 'second', k: ap(t, T.seven - 0.1, 0.7, E.lin), glow: 16 * pulse(t, T.greenU - 0.3, 1.2) } } });
        });
      });
    }

    // ---------------------------------------------------------------- 7. whole
    const NOT23 = S('\\dfrac{\\cssId{a}{2}}{\\cssId{b}{3}}\\text{ of the tiles}');
    const OUT5 = S('\\cssId{a}{2}\\text{ out of }\\cssId{w}{5}');
    function whole(c: Canvas, t: number) {
      if (t < T.total - 0.4 || t > T.recap + 0.8) return;
      withAlpha(c, (1 - ap(t, T.recap - 0.8, 0.8)), () => {
        const p = barTime.at(t);
        bar.draw(c, p, { frameCol: 'dim', glowA: pulse(t, T.twofifths, 1) + pulse(t, T.fiveW - 0.6, 1.2), glowB: pulse(t, T.threefifths + 0.2, 1) });
        const y = 865;
        // "does not mean two thirds of the tiles": written, then struck
        const kN = ap(t, T.thirds - 0.4, 0.9);
        const L: Pt = [620, y];
        texDraw(c, NOT23, ...L, { size: 72, align: 'center', col: 'dim', k: kN, tags: { a: { col: 'first' }, b: { col: 'second' } } });
        const nb = texBox(NOT23, ...L, { size: 72, align: 'center' });
        strike(c, nb.x0 - 12, nb.cy + 14, nb.x1 + 12, nb.cy - 14, ap(t, T.orangeWh - 0.2, 0.6));
        // "it's two out of five"
        const R: Pt = [1320, y];
        texDraw(c, OUT5, ...R, { size: 76, align: 'center', col: 'dim', k: ap(t, T.twooffive + 0.2, 1.0), tags: { a: { col: 'first' }, w: { col: 'ink' } } });
        frameAround(c, texBox(OUT5, ...R, { size: 76, align: 'center' }), ap(t, T.fiveW - 0.2, 0.9), { pad: 26, glow: 8 + 14 * pulse(t, T.fiveW, 1.2) });
      });
    }

    // ---------------------------------------------------------------- 8. recap
    const REC = [
      { F: S('\\cssId{a}{2} : \\cssId{b}{3}\\quad\\text{for every 2 orange, there are 3 green}'), y: 320, at: T.rec1, icon: 0 },
      { F: S('\\cssId{a}{2} : \\cssId{b}{3} = \\cssId{c}{4} : \\cssId{d}{6}\\quad\\text{multiply both, never add}'), y: 540, at: T.rec2, icon: 1 },
      { F: S('\\text{one line through }\\cssId{z}{0}'), y: 760, at: T.rec3, icon: 2 },
    ];
    const REC_X = 460, REC_S = 64;
    REC.forEach(r => { const b = texBox(r.F, REC_X, r.y, { size: REC_S, align: 'left' }); if (b.x1 > 1840) throw new Error(`ratio scene: recap line is ${Math.round(b.x1)} px wide`); });
    const M2 = mapper(G2.view('s'));
    const SCR = ['p0', 'p1', 'p2'].map(id => { const p = G2.point(id); return { x: qNum(p.x), y: qNum(p.y) }; });
    const scrRect = (i: number): Rect => { const s = SCR[i]!; const [x0, y0] = M2.px(0, s.y); return { x: x0, y: y0, w: s.x * M2.unit, h: s.y * M2.unit }; };
    const HOOK_OF = [HOOK.phone, HOOK.laptop, HOOK.cinema];

    function recap(c: Canvas, t: number) {
      if (t < T.recap - 0.3 || t > T.tryq + 0.8) return;
      const linesA = 1 - ap(t, T.screens2 - 0.5, 0.7);
      withAlpha(c, linesA, () => {
        REC.forEach((r, i) => {
          const k = ap(t, r.at - 0.1, 1.6, E.lin);
          if (k <= 0) return;
          const icA = ap(t, r.at - 0.2, 0.9);
          if (r.icon === 0) miniTiles(c, 170, r.y, 34, icA);
          else if (r.icon === 1) miniRects(c, 200, r.y + 70, 22, icA);
          else miniPlane(c, 190, r.y + 70, 150, icA);
          texDraw(c, r.F, REC_X, r.y, { size: REC_S, align: 'left', col: 'ink', k, lag: 0.25, tags: {
            a: { col: 'first' }, b: { col: 'second' }, c: { col: 'first' }, d: { col: 'second' }, z: { col: 'link' }, '#3A': { col: 'link' } } });
          void i;
        });
      });
      // the screens return: rectangles from the origin, corners on one line through zero
      const kS = ap(t, T.screens2 - 0.2, 0.8);
      if (kS <= 0) return;
      withAlpha(c, 1 - ap(t, T.tryq - 0.6, 0.7), () => {
        const m = M2;
        G2.axes(c, m, ap(t, T.screens2 - 0.1, 0.9), ap(t, T.screens2 + 0.1, 0.9));
        // back to front: cinema, laptop, phone; they fly in from where they were in the hook
        [2, 1, 0].forEach(i => {
          const k = ap(t, T.screenW - 0.4 + (2 - i) * 0.18, 1.3);
          if (k <= 0) return;
          const R = lerpRect(HOOK_OF[i]!, scrRect(i), E.smooth(k));
          screen(c, R, clamp(k * 3), { outline: 'dim', pic: 0.8, alpha: 1, lw: th.lw.thin + 0.5, solid: true });
        });
        const kL = ap(t, T.sameR2 - 0.2, 1.2);
        G2.line(c, m, kL, { glow: 8 + 20 * pulse(t, T.lineR - 0.3, 1.4) + 14 * pulse(t, T.sameR2, 1.2) });
        G2.originMark(c, m, ap(t, T.sameR2, 0.6));
        SCR.forEach((s, i) => G2.dot(c, m, s.x, s.y, ap(t, T.sameR2 + 0.2 + i * 0.2, 0.6), { col: 'link' }));
        // sixteen to nine
        const p2 = G2.point('p2');
        G2.coords(c, m, p2.x, p2.y, ap(t, T.sixteen - 0.1, 0.9), { glow: 12 * pulse(t, T.nineR, 1), guides: false });
        const R16: Pt = [1705, 560];
        texDraw(c, R169, ...R16, { size: 96, align: 'center', lag: 0.5, tags: ab(ap(t, T.sixteen - 0.05, 0.9, E.lin)) });
        // every size is a point further along the same line
        const kb = vis(t, T.pointR - 1.3, T.tryq - 0.8, 0.3, 0.5);
        if (kb > 0) {
          const u = E.inOut(ap(t, T.pointR - 1.2, 2.3, E.lin));
          const x = lerp(1, 18.2, u), y = G2.lineAt(x);
          const [x0, y0] = m.px(0, y);
          screen(c, { x: x0, y: y0, w: x * m.unit, h: y * m.unit }, 1, { outline: 'link', pic: 0, alpha: kb, lw: th.lw.base, glow: 10 });
          G2.dot(c, m, x, y, 1, { col: 'link', r: 14, glow: 0.8, alpha: kb });
        }
      });
    }

    // ---------------------------------------------------------------- 9. try
    const Q1 = S('\\cssId{a}{10} : \\cssId{b}{15} \\;\\overset{?}{=}\\; \\cssId{c}{2} : \\cssId{d}{3}');
    const Q2 = S('\\cssId{a}{5} : \\cssId{b}{6} \\;\\overset{?}{=}\\; \\cssId{c}{2} : \\cssId{d}{3}');
    const A1 = S('\\cssId{c}{2}\\cssId{x}{{\\times}5} : \\cssId{d}{3}\\cssId{y}{{\\times}5}');
    const A2 = S('\\cssId{c}{2}\\cssId{x}{{+}3} : \\cssId{d}{3}\\cssId{y}{{+}3}');
    const TURN = S('\\text{Your turn}');
    const C1 = box(140, 250, 940, 520), C2 = box(140, 590, 940, 860);
    const M3 = mapper(G3.view('v'));
    const qTags = (k: number) => ({ a: { col: 'first' as Paint, k }, b: { col: 'second' as Paint, k }, c: { col: 'first' as Paint, k }, d: { col: 'second' as Paint, k } });
    function tryIt(c: Canvas, t: number) {
      if (t < T.tryq - 0.3) return;
      const end = 1 - ap(t, RATIO_END - 1.5, 1.4);
      withAlpha(c, end, () => {
        texDraw(c, TURN, 140, 160, { size: 60, align: 'left', col: 'dim', k: ap(t, T.tryq, 0.9) });
        card(c, C1, ap(t, T.q1 - 0.2, 0.8));
        texDraw(c, Q1, 540, 345, { size: 84, align: 'center', col: 'dim', lag: 0.3, k: ap(t, T.q1, 1.8, E.lin), tags: qTags(ap(t, T.q1, 1.8, E.lin)) });
        card(c, C2, ap(t, T.q2 - 0.2, 0.8));
        texDraw(c, Q2, 540, 685, { size: 84, align: 'center', col: 'dim', lag: 0.3, k: ap(t, T.q2, 1.4, E.lin), tags: qTags(ap(t, T.q2, 1.4, E.lin)) });
        // ---- the think pause (218.0 → a1): nothing new ----
        // answers
        checkMark(c, 870, 345, 44, ap(t, T.yes - 0.15, 0.6));
        texDraw(c, A1, 540, 450, { size: 64, align: 'center', col: 'dim', lag: 0.3, tags: {
          c: { col: 'first', k: ap(t, T.two9 - 0.1, 0.5) }, d: { col: 'second', k: ap(t, T.two9 + 0.1, 0.5) }, '#3A': { col: 'dim', k: ap(t, T.two9, 0.5) },
          x: { col: 'link', k: ap(t, T.times9, 0.6) }, y: { col: 'link', k: ap(t, T.times9 + 0.2, 0.6) } } });
        crossMark(c, 870, 685, 40, ap(t, T.no - 0.15, 0.6));
        texDraw(c, A2, 540, 790, { size: 64, align: 'center', col: 'dim', lag: 0.3, tags: {
          c: { col: 'first', k: ap(t, T.three9 - 0.2, 0.5) }, d: { col: 'second', k: ap(t, T.three9, 0.5) }, '#3A': { col: 'dim', k: ap(t, T.three9 - 0.1, 0.5) },
          x: { col: 'wrong', k: ap(t, T.added - 0.1, 0.6) }, y: { col: 'wrong', k: ap(t, T.added + 0.15, 0.6) } } });
        // the plane: 10 : 15 on the line, 5 : 6 off it
        const kP = ap(t, T.a1 - 0.1, 0.9);
        if (kP > 0) {
          const m = M3;
          G3.axes(c, m, kP, kP);
          G3.line(c, m, ap(t, T.a1 + 0.3, 0.9), { glow: 8 });
          const ten = G3.point('ten'), five = G3.point('five'), base = G3.point('p0');
          G3.dot(c, m, 2, 3, ap(t, T.two9 - 0.1, 0.5), { col: 'link', r: 10 });
          G3.coords(c, m, ten.x, ten.y, ap(t, T.yes - 0.2, 0.8), { guides: true });
          G3.dot(c, m, 10, 15, ap(t, T.yes - 0.1, 0.6), { col: 'link', glow: pulse(t, T.yes, 1.2) });
          // ×5 along the line (just beside it, so it never covers it)
          const ka = ap(t, T.times9 - 0.1, 1.0);
          if (ka > 0) {
            const n = [-0.83, -0.55], off = 30;              // unit normal to the line (up-left in screen)
            const a0 = m.px(2.5, 3.75), a1 = m.px(9.5, 14.25);
            arrow(c, [[a0[0] + n[0]! * off, a0[1] + n[1]! * off], [a1[0] + n[0]! * off, a1[1] + n[1]! * off]], ka, { col: 'link', lw: th.lw.base, head: 18 });
            const mid = m.px(6, 9);
            texDraw(c, S('\\times 5'), mid[0] + n[0]! * 90, mid[1] + n[1]! * 90, { size: 64, align: 'center', col: 'link', k: clamp((ka - 0.3) / 0.7) });
          }
          void base;
          G3.coords(c, m, five.x, five.y, ap(t, T.no - 0.1, 0.8), { guides: true });
          G3.dot(c, m, 5, 6, ap(t, T.no, 0.6), { col: 'wrong', glow: pulse(t, T.off9, 1.2) });
          G3.gap(c, m, 'five', ap(t, T.off9 - 0.3, 0.7));
        }
      });
    }

    return {
      draw(c: Canvas, t: number) {
        hook(c, t);
        everyScale(c, t);
        centreRatio(c, t);
        addEquation(c, t);
        const v = viewAt(t);
        rects(c, t, v);
        diffPanel(c, t);
        plane(c, t);
        whole(c, t);
        recap(c, t);
        tryIt(c, t);
      },
    };
  },
};
