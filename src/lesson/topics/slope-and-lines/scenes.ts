// scenes.ts: the pictures and board notation of parts 1-4, as data (the page draws them; the test lays every graph out
// and scans every TeX string for control characters). The numbers are asserted from the exact maths at import, so a
// wrong edit here cannot render.
//   lesson  y = 2/3 x + 1: Jo's small slope triangle (0, 1) -> (3, 3), Kai's big one (3, 3) -> (9, 7)
//   derive  the same line: the triangle from (0, 1) to a general point (x, y): run x, rise y - 1
//   turn    a candle 6 in tall burning 1/2 in per hour: y = -1/2 x + 6, a segment from 0 to 12 hours
//   prove   Riley's y = 2x + 3: two slope triangles (slope 2), dashed rays from (0, 0) (y/x = 5 and 3)
import type { SlopeGridParams } from './SlopeGrid';
import * as S from './slopeMaths';

const need = (c: boolean, what: string) => { if (!c) throw new Error('slope-and-lines scenes: ' + what); };
const L = S.lineThrough([3, 3], [9, 7]);
need(S.qEq(L.m, S.rat(2, 3)) && S.qEq(L.b, S.rat(1)) && S.onLine(L.m, L.b, 0, 1) && S.onLine(L.m, L.b, 6, 5), 'the lesson line is y = 2/3 x + 1');
need(S.qEq(S.slopeQ([0, 1], [3, 3])!, S.slopeQ([3, 3], [9, 7])!), "Jo's and Kai's slopes are equal");
const C = S.lineThrough([2, 5], [8, 2]);
need(S.qEq(C.m, S.rat(-1, 2)) && S.qEq(C.b, S.rat(6)) && S.onLine(C.m, C.b, 12, 0), 'the candle line is y = -1/2 x + 6');
need(S.qEq(S.slopeQ([1, 5], [3, 9])!, S.rat(2)) && !S.qEq(S.ratioQ(1, 5)!, S.ratioQ(3, 9)!), "Riley's line: slope 2, y/x changes");

const lessonBase = (): SlopeGridParams => ({ x0: 0, x1: 10, y0: 0, y1: 8, xStep: 1, yStep: 1, lines: [{ id: 'L', m: 2 / 3, b: 1 }] });
export const SCENES = {
  graphs: {
    lesson: {
      ...lessonBase(),
      points: [{ id: 'J0', x: 0, y: 1 }, { id: 'J1', x: 3, y: 3, label: true }, { id: 'K1', x: 9, y: 7, label: true }],
      tris: [{ id: 'jo', a: [0, 1], b: [3, 3], run: '3', rise: '2' }, { id: 'kai', a: [3, 3], b: [9, 7], run: '6', rise: '4' }],
    },
    derive: {
      ...lessonBase(),
      points: [{ id: 'J0', x: 0, y: 1 }, { id: 'G', x: 6, y: 5, label: '(x, y)' }],
      tris: [{ id: 'gen', a: [0, 1], b: [6, 5], run: 'x', rise: 'y − 1' }],
    },
    turn: {
      x0: 0, x1: 12, y0: 0, y1: 7, xStep: 1, yStep: 1, xName: 'time (h)', yName: 'height (in)',
      lines: [{ id: 'L', m: -1 / 2, b: 6, ends: 'segment', from: 0, to: 12 }],
      points: [{ id: 'S', x: 0, y: 6 }, { id: 'A', x: 2, y: 5, label: true }, { id: 'B', x: 8, y: 2, label: true }],
      tris: [{ id: 'sm', a: [0, 6], b: [2, 5], run: '2', rise: '−1' }, { id: 'bg', a: [2, 5], b: [8, 2], run: '6', rise: '−3' }],
    },
    prove: {
      x0: 0, x1: 6, y0: 0, y1: 16, xStep: 1, yStep: 2,
      lines: [{ id: 'L', m: 2, b: 3, from: 0, ends: 'ray' }],
      rays: [{ id: 'p', through: [1, 5], role: 'pick' }, { id: 'q', through: [3, 9], role: 'second' }],
      points: [{ id: 'B', x: 0, y: 3, role: 'pick' }, { id: 'P', x: 1, y: 5, label: 'P' }, { id: 'Q', x: 3, y: 9, label: 'Q' }],
      tris: [{ id: 't1', a: [1, 5], b: [3, 9], run: '2', rise: '4' }, { id: 't2', a: [3, 9], b: [5, 13], run: '2', rise: '4' }],
    },
  } satisfies Record<string, SlopeGridParams>,
  /** every board line of parts 1-4 (TeX; \cssId parts are coloured by the page) */
  tex: {
    'q.jo': '\\text{Jo: } m = \\frac{\\cssId{n}{2}}{\\cssId{d}{3}}',
    'q.kai': '\\text{Kai: } m = \\,?',
    'e.L1': '\\text{slope} = \\frac{\\cssId{ri}{\\text{rise}}}{\\cssId{ru}{\\text{run}}} = \\frac{\\cssId{n}{2}}{\\cssId{d}{3}}',
    'e.L2': '\\triangle_{\\text{Jo}} \\sim \\triangle_{\\text{Kai}}',
    'e.L3': '\\frac{\\cssId{n}{4}}{\\cssId{d}{6}} = \\frac{2}{3}',
    'e.L4': '\\frac{\\cssId{n}{y - 1}}{\\cssId{d}{x}} = \\frac{2}{3}',
    'e.L5': 'y - 1 = \\tfrac{2}{3}x',
    'e.L6': 'y = \\cssId{m}{\\tfrac{2}{3}}x + \\cssId{b}{1}',
    't.L1': 'm = \\frac{\\cssId{n}{-1}}{\\cssId{d}{2}} = -\\tfrac{1}{2}',
    't.L2': 'm = \\frac{\\cssId{n}{\\text{rise}}}{\\cssId{d}{6}}',
    't.L2a': 'm = \\frac{\\cssId{n}{-3}}{\\cssId{d}{6}}',
    't.L2b': 'm = \\frac{\\cssId{n}{-3}}{\\cssId{d}{6}} = -\\tfrac{1}{2}',
    't.L3': 'y = \\cssId{m}{-\\tfrac{1}{2}}x + \\cssId{b}{6}',
    'p.R': '\\text{Riley: } y = 2x + 3',
    'p.PQ': 'P(1,\\ 5),\\quad Q(3,\\ 9)',
    'p.S': '\\text{slope } 2 \\ \\Rightarrow\\ \\tfrac{y}{x} \\text{ constant?}',
    'p.L1': 'm = \\frac{\\cssId{n}{4}}{\\cssId{d}{2}} = 2',
    'p.L2': '\\tfrac{5}{1} = 5 \\ne \\tfrac{9}{3} = 3',
    'p.L3': 'b = 3 \\ne 0',
  } as Record<string, string>,
};
