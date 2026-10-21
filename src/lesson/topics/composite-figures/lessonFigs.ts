// lessonFigs.ts: the figures of parts 1-4 and the model frame, shared by the page and the tests (pure).
import { frame } from '../../../blocks/block';
import { edgeNotch, rectSemi, track } from './figMaths';
import type { FigParams } from './PlanFigure';

/** the model's frame: the left of the stage (the board starts at x = 1240; leaders need the gap) */
export const MF = frame(30, 60, 1150, 960);

export const LESSON_FIGS = {
  /** 1-2: a patio, a 12 ft x 8 ft rectangle with a half circle on one 8 ft end */
  patio: { fig: rectSemi(12, 8), unit: 'ft', dims: [{ id: 'w' }, { id: 'h' }, { id: 'r' }] },
  /** 3: a flower bed shaped like a running track, 14 ft x 8 ft with a half circle on each end */
  bed: { fig: track(14, 8), unit: 'ft', dims: [{ id: 'w' }, { id: 'h' }] },
  /** 4: a 10 ft x 6 ft table top with a half circle of radius 2 ft cut from one long side */
  table: { fig: edgeNotch(10, 6, 2), unit: 'ft', dims: [{ id: 'top' }, { id: 'h' }, { id: 'd' }] },
} satisfies Record<string, FigParams>;
