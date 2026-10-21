// plan.ts: the practice walk for "Convert fractions, decimals, and percents: extended", one entry per sub-goal of the
// topic JSON, in its order (the two enrichment sub-goals included).
import type { SubgoalPlan } from '../../runtime/practice';

export const PLAN: SubgoalPlan[] = [
  { id: 'place-value-ten-thousandths', title: 'Place value to ten-thousandths', families: ['placeValue', 'compareDec'] },
  { id: 'terminating-means-zeros', title: 'Terminating: only zeros after', families: ['terminates'] },
  { id: 'bar-notation', title: 'Bar notation', families: ['barForm'] },
  { id: 'prefix-and-block', title: 'Digits before the repeating block', families: ['barForm'] },
  { id: 'truncation-not-equal', title: 'Cut off is not equal: = and ≈', families: ['approx'] },
  { id: 'fraction-to-terminating-by-division', title: 'Divide until the remainder is 0', families: ['divide', 'ladderStep'] },
  { id: 'fraction-to-repeating-by-remainders', title: 'A remainder comes back: it repeats', families: ['divide', 'ladderStep', 'digitTrap'] },
  { id: 'classify-fractions-by-remainder', title: 'Stops or repeats, and why', families: ['classify'] },
  { id: 'terminating-decimal-to-fraction', title: 'Decimal to fraction', families: ['decToFrac'] },
  { id: 'decimal-percent-small-and-decimal', title: 'Percents below 1% and with decimals', families: ['decPct'] },
  { id: 'decimal-percent-to-fraction', title: 'Decimal percent to fraction', families: ['pctToFrac'] },
  { id: 'beyond-one-whole', title: 'Above one whole, above 100%', families: ['beyondOne'] },
  { id: 'repeating-decimal-percent', title: 'Repeating decimals as percents', families: ['repPct'] },
  { id: 'mixed-number-percent', title: 'Mixed-number percents', families: ['mixedPct'] },
  { id: 'common-equivalents-recall', title: 'Eighths, thirds and sixths', families: ['recall'] },
  { id: 'finite-remainders-argument', title: 'Why it must stop or repeat', families: ['remainders'] },
  { id: 'denominator-two-five-test', title: 'The 2-and-5 test', families: ['twoFive'] },
  { id: 'exact-vs-approx-symbols', title: 'Exact or approximate?', families: ['approx'] },
  { id: 'round-to-reporting-precision', title: 'Round once, at the end', families: ['roundFinal'] },
  { id: 'calculator-display', title: 'What a calculator shows', families: ['calcDisplay'] },
  { id: 'rounding-error-grows', title: 'Rounding errors grow', families: ['roundingError'] },
  { id: 'round-only-at-end', title: 'Keep it exact, report sensibly', families: ['roundEnd'] },
  { id: 'signed-forms', title: 'Negative fractions, decimals, percents', families: ['signed', 'signedCompare'] },
];
