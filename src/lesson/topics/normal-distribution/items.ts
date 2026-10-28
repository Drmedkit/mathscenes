// items.ts: every practice family of "The normal distribution" (famA: density, shape, parameters, benchmarks; famB:
// z-scores, table areas, the calculator, inverse; famC: fit, standardizing, facts vs estimates, variation, precision).
import { FAM_A, NAMES_A } from './famA';
import { FAM_B, NAMES_B } from './famB';
import { FAM_C, NAMES_C } from './famC';
import type { Gen } from './common';

export { MC, type NItem, type NPic } from './common';
export const GENERATORS: Record<string, Gen> = { ...FAM_A, ...FAM_B, ...FAM_C };
export const FAMILY_NAMES: Record<string, string> = { ...NAMES_A, ...NAMES_B, ...NAMES_C };
