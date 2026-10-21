// lessonMap.ts: the one calm map of parts 1-4 (map units = inches, 1 inch represents 2 miles).
//   Millbrook (town) -- highway east 4 in -- junction -- road north 3 in -- Lake Camp: by road 7 in = 14 mi,
//   straight across Cedar Lake 5 in = 10 mi (3-4-5). Lake Camp -- road west 2 in -- north 1 1/2 in -- Pinecrest:
//   by road 3 1/2 in = 7 mi, straight 2 1/2 in = 5 mi. The trail Millbrook -- north 3 in -- Pinecrest (2 1/2 in):
//   5 1/2 in = 11 mi. Each part gets the same base map with its own overlays (layout is checked per part).
import type { MapPic, Overlay, Pt, Role, Target } from './mapMaths';

export const MB: Pt = [0.9, 5.1], JN: Pt = [4.9, 5.1], LC: Pt = [4.9, 2.1], BEND: Pt = [2.9, 2.1], PC: Pt = [2.9, 0.6], TB: Pt = [0.9, 2.1];
export const ROUTE_Q: Pt[] = [MB, JN, LC];
export const ROUTE_T: Pt[] = [LC, BEND, PC];
export const TRAIL: Pt[] = [MB, TB, PC];

function lakeBlob(): Pt[] {
  const c: Pt = [2.9, 3.6], n = 16;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = 1 + 0.08 * Math.sin(a * 3 + 1) + 0.05 * Math.cos(a * 5);
    return [c[0] + Math.cos(a) * 1.15 * w, c[1] + Math.sin(a) * 0.78 * w] as Pt;
  });
}
function forestBlob(): Pt[] {
  const c: Pt = [5.72, 0.9], n = 12;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2, w = 1 + 0.1 * Math.sin(a * 4 + 2);
    return [c[0] + Math.cos(a) * 0.38 * w, c[1] + Math.sin(a) * 0.42 * w] as Pt;
  });
}

const BASE: Omit<MapPic, 'ov'> = {
  unit: 'in',
  places: [
    { id: 'MB', name: 'Millbrook', at: MB, kind: 'town' },
    { id: 'LC', name: 'Lake Camp', at: LC, kind: 'camp' },
    { id: 'PC', name: 'Pinecrest', at: PC, kind: 'town' },
  ],
  roads: [
    { pts: [[0, 5.1], [6.27, 5.1]], kind: 'highway' },
    { pts: [JN, LC, BEND, PC], kind: 'road' },
    { pts: TRAIL, kind: 'trail' },
  ],
  areas: [{ kind: 'lake', pts: lakeBlob() }, { kind: 'forest', pts: forestBlob() }],
  key: ['town', 'camp', 'highway', 'road', 'trail', 'lake'],
  bar: { step: 2, len: 1, n: 3, real: 'mi' },
};

const ring = (id: string, t: Target, col: Role = 'pick'): Overlay => ({ id, k: 'ring', t, col });
const SHARED: Overlay[] = [
  ring('kTown', { key: 'town' }), ring('kCamp', { key: 'camp' }), ring('kTrail', { key: 'trail' }),
  ring('rMB', { place: 'MB' }), ring('rLC', { place: 'LC' }), ring('rPC', { place: 'PC' }),
  ring('i0', { span: [0, 1] }, 'second'), ring('i1', { span: [1, 2] }, 'second'), ring('i2', { span: [2, 3] }, 'second'),
];

export function lessonMap(part: 'q' | 'e' | 't' | 'p'): MapPic {
  const ov: Overlay[] = [...SHARED];
  if (part === 'q' || part === 'e') {
    ov.push({ id: 'route', k: 'route', pts: ROUTE_Q });
    if (part === 'e') ov.push(
      { id: 'cp1', k: 'copies', pts: [MB, JN], len: 1 },
      { id: 'cp2', k: 'copies', pts: [JN, LC], len: 1 },
      { id: 'leg1', k: 'leg', a: MB, b: JN, text: '8 mi', col: 'second' },
      { id: 'leg2', k: 'leg', a: JN, b: LC, text: '6 mi', col: 'second' },
      { id: 'str', k: 'straight', a: MB, b: LC, col: 'ink' },
      { id: 'cpS', k: 'copies', pts: [MB, LC], len: 1 },
      { id: 'legS', k: 'leg', a: MB, b: LC, text: '10 mi', col: 'pick' },
    );
  }
  if (part === 't') ov.push(
    { id: 'route', k: 'route', pts: ROUTE_T },
    { id: 'cp', k: 'copies', pts: ROUTE_T, len: 1, sub: 2 },
    { id: 'leg', k: 'tag', at: BEND, text: '7 mi', col: 'link', r: 20 },
    { id: 'str', k: 'straight', a: LC, b: PC, col: 'ink' },
    { id: 'cpS', k: 'copies', pts: [LC, PC], len: 1, sub: 2 },
    { id: 'legS', k: 'leg', a: LC, b: PC, text: '5 mi', col: 'pick' },
  );
  if (part === 'p') ov.push(
    { id: 'route', k: 'route', pts: TRAIL },
    { id: 'cp', k: 'copies', pts: TRAIL, len: 1, sub: 2 },
    { id: 'tag', k: 'tag', at: TB, text: '11 mi', col: 'link', r: 20 },
  );
  return { ...BASE, ov };
}
