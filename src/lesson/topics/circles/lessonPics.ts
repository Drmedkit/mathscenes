// lessonPics.ts: the pictures of parts 1-4 (checked for layout in the tests).
//   PIZZA   a 12-inch pizza: 16 wedges that become a near-rectangle 6 pi long and 6 tall (parts 1-2)
//   RUG     a round rug 10 ft across: the same steps, the kid does the last two (part 3)
//   PIZZAS  Sam's claim: one 16-inch pizza against two 8-inch pizzas, with the 2 x 2 quad (part 4)
import type { Pic } from './circleMaths';

export const LF = { x: 60, y: 70, w: 940, h: 940 } as const;
export const PIZZA: Pic = { kind: 'wedges', look: 'pizza', n: 16, dTag: '12\\text{ in}', rTag: '6\\text{ in}', topTag: '6\\pi', htTag: '6' };
export const RUG: Pic = { kind: 'wedges', look: 'rug', n: 16, dTag: '10\\text{ ft}', rTag: '5\\text{ ft}', topTag: '5\\pi', htTag: '5' };
export const PIZZAS: Pic = { kind: 'pair', look: 'pizza', r1: 8, r2: 4, tags: ['16\\text{ in}', '8\\text{ in}'], seg: 'diameter', copies: 2 };
export const LESSON_PICS: Record<string, Pic> = { PIZZA, RUG, PIZZAS };
