// lessonPics.ts: the pictures of parts 1-4 (MapLines params), shared by the page and the test.
import type { MapLinesParams } from './MapSheet';

/** parts 1, 2: an Alaska map at 1 : 63,360; the trailhead-to-lake line is 2.5 in -> 158,400 in -> 2.5 mi */
export const ALASKA: MapLinesParams = {
  card: { tag: '1 : 63{,}360', len: 2.5, from: 'trailhead', to: 'lake', cap: 'Alaska map' },
  lines: {
    rows: [{ unit: 'map, in', step: 1 }, { unit: 'ground, in', step: 63360 }, { unit: 'ground, mi', step: 1 }], n: 3, sub: 2,
    given: { row: 0, v: 2.5 }, via: { row: 1, v: 158400 }, ask: { row: 2, v: 2.5 },
  },
};
/** part 3: a 1 : 24,000 topo map; parking to summit is 3.5 in -> 84,000 in -> 7,000 ft */
export const TOPO: MapLinesParams = {
  card: { tag: '1 : 24{,}000', len: 3.5, from: 'parking', to: 'summit', cap: 'topo map' },
  lines: {
    rows: [{ unit: 'map, in', step: 1 }, { unit: 'ground, in', step: 24000 }, { unit: 'ground, ft', step: 2000 }], n: 4, sub: 2,
    given: { row: 0, v: 3.5 }, via: { row: 1, v: 84000 }, ask: { row: 2, v: 7000 },
  },
};
/** part 4: Jo puts a 6,000 ft trail on the 1 : 24,000 map: 6,000 ÷ 24,000 = 0.25 "in" (wrong); 72,000 in -> 3 in */
export const JO: MapLinesParams = {
  card: { tag: '1 : 24{,}000', len: 3, from: 'camp', to: 'falls', cap: 'topo map' },
  lines: {
    rows: [{ unit: 'map, in', step: 1 }, { unit: 'ground, in', step: 24000 }, { unit: 'ground, ft', step: 2000 }], n: 4, sub: 4,
    given: { row: 2, v: 6000 }, via: { row: 1, v: 72000 }, ask: { row: 0, v: 3 }, wrong: { row: 0, v: 0.25 },
  },
};
export const LESSON_PICS: Record<string, MapLinesParams> = { ALASKA, TOPO, JO };
