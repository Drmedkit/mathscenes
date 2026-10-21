// story.ts: the Ridgeview study of parts 1-4, built from SEEDED draws and checked at load time, so the numbers the
// narrator says are the numbers the simulation makes (change a seed and the page refuses to build).
//   Ridgeview Middle, 200 seventh graders, minutes of homework last night (the school's planner app logged all 200,
//   so here the population mean is known: 42 minutes).
//   Part 1/2: Maya draws 10 names from a hat (mean 46), Leo puts them back and draws 10 (mean 34); 18 more samples of 10.
//   Part 3:   samples of 40; the first has a total of 1,720 minutes (mean 43); 20 samples of 40.
//   Part 4:   the online poll: 60 volunteers (heavy-homework students answer more often), mean 55; 20 such polls.
import { rng } from '../../runtime/item';
import { check } from '../../../blocks/block';
import { drawIdx, farthest, mean, mostWithin, population, repeatMeans, sum } from './samplingMaths';

const NAME = 'Story';
export const N: number = 200, MU: number = 42;
export const POP = population({ N, mu: 42, sd: 18, lo: 0, hi: 100, step: 5, seed: 25, total: N * MU });
check(mean(POP) === MU, NAME, 'the Ridgeview mean must be 42');

// samples of 10 (parts 1-2)
const R10 = rng(36);
export const MAYA = drawIdx(R10, N, 10), LEO = drawIdx(R10, N, 10);
const rest10 = repeatMeans(POP, 10, 18, R10);
export const vals = (I: readonly number[]) => I.map(i => POP[i]!);
export const MAYA_MEAN = mean(vals(MAYA)), LEO_MEAN = mean(vals(LEO)), MAYA_SUM = sum(vals(MAYA));
check(MAYA_MEAN === 46 && LEO_MEAN === 34 && MAYA_SUM === 460, NAME, `Maya and Leo must get 46 and 34 (got ${MAYA_MEAN}, ${LEO_MEAN})`);
/** the tempting 'halfway' answer of part 1 is NOT the population mean */
export const HALFWAY = (MAYA_MEAN + LEO_MEAN) / 2;
check(HALFWAY === 40 && HALFWAY !== MU, NAME, 'halfway must be 40, not the population mean');
export const MEANS10 = [MAYA_MEAN, LEO_MEAN, ...rest10.means];
export const MEANS10_LO = Math.min(...MEANS10), MEANS10_HI = Math.max(...MEANS10);
export const MOST10 = mostWithin(MEANS10, MU);
check(MEANS10_LO === 34 && MEANS10_HI === 50.5 && MOST10 === 6, NAME, `the 20 means of 10 must run 34 to 50.5, most within 6 (got ${MEANS10_LO}, ${MEANS10_HI}, ${MOST10})`);
check(MEANS10.filter(m => m !== MU).length >= 18, NAME, 'the means must not sit on 42');

// samples of 40 (part 3)
const R40 = rng(23);
const s40 = repeatMeans(POP, 40, 20, R40);
export const S40 = s40.idx[0]!, S40_SUM = sum(vals(S40)), S40_MEAN = mean(vals(S40));
check(S40_SUM === 1720 && S40_MEAN === 43, NAME, `the first sample of 40 must total 1,720 (got ${S40_SUM})`);
export const MEANS40 = s40.means;
export const MOST40 = mostWithin(MEANS40, MU);
check(MOST40 === 3, NAME, `most means of 40 must lie within 3 of 42 (got ${MOST40})`);
check(farthest(MEANS40, MU) < farthest(MEANS10, MU), NAME, 'means of 40 must spread less than means of 10');

// the online poll (part 4): volunteers, weighted toward students with lots of homework
function volunteers(R: () => number, n: number): number[] {
  const w = POP.map(v => Math.pow(v + 5, 3));
  const left = POP.map((_, i) => i), out: number[] = [];
  for (let k = 0; k < n; k++) {
    const tot = left.reduce((a, i) => a + w[i]!, 0);
    let u = R() * tot, j = 0;
    while (u > w[left[j]!]! && j < left.length - 1) { u -= w[left[j]!]!; j++; }
    out.push(left[j]!); left.splice(j, 1);
  }
  return out;
}
const RP = rng(37);
export const POLLS = Array.from({ length: 20 }, () => mean(vals(volunteers(RP, 60))));
export const POLL_MEAN = POLLS[0]!;
export const POLL_LO = Math.min(...POLLS), POLL_HI = Math.max(...POLLS);
check(POLL_MEAN === 55, NAME, `the poll must give 55 (got ${POLL_MEAN})`);
check(POLL_LO > MU + 10, NAME, 'every poll must miss 42 by more than 10 (the bias the proof shows)');
/** rounded to the half for the dot plot of means (the plot stacks by half minutes) */
export const POLL_CENTER = Math.round(mean(POLLS));
check(POLL_CENTER === 55, NAME, `the polls must center near 55 (got ${POLL_CENTER})`);
