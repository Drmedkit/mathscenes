// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows, `say` is the same
// line written to be read aloud (no digits, no symbols). pages/lessons/function-families/voice/lines.json holds the
// `say` texts; the test keeps the two in step.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A sensor logs a quantity <i>y</i> once a second: ${a('2, 4, 8, 14, 22')}. Linear, quadratic or exponential? Pick one, and say how sure you are.`, say: 'A sensor logs a quantity y once a second: two, four, eight, fourteen, twenty two. Linear, quadratic or exponential? Pick one, and say how sure you are.' },
  // 2. Worked example
  'e.intro': { html: 'Three tests, after one check. Press each step: the table changes first, then the notation.', say: 'Three tests, after one check. Press each step. The table changes first, then the notation.' },
  'e.step0': { html: `First the inputs: every x-step is ${b('+1')}. Equal steps, so differences and ratios compare equal intervals. Without that, no test means anything.`, say: 'First the inputs. Every x step is plus one. Equal steps, so differences and ratios compare equal intervals. Without that, no test means anything.' },
  'e.step1': { html: `Ratios of neighbours: ×2, ×2, then ×1.75 and about ×1.57. The doubling stops after two steps, so the table is ${s('not exponential')}: a factor has to hold on every step.`, say: 'Ratios of neighbours: times two, times two, then times one point seven five, and about times one point five seven. The doubling stops after two steps, so the table is not exponential. A factor has to hold on every step.' },
  'e.step2': { html: '1st differences: +2, +4, +6, +8. Not equal, so it is not linear either. But look: they grow by the same amount each time.', say: 'First differences: plus two, plus four, plus six, plus eight. Not equal, so it is not linear either. But look: they grow by the same amount each time.' },
  'e.step3': { html: `2nd differences: +2, +2, +2. Constant and not 0: the table is consistent with a ${s('quadratic')} function. In fact <i>y</i> = <i>x</i><sup>2</sup> + <i>x</i> + 2 fits every row.`, say: 'Second differences: plus two, plus two, plus two. Constant, and not zero. The table is consistent with a quadratic function. In fact, y equals x squared plus x plus two fits every row.' },
  'e.why': { html: 'Quick check: why did the doubling in the first rows not prove “exponential”?', say: 'Quick check: why did the doubling in the first rows not prove exponential?' },
  'e.why.ok': { html: 'Yes. A family test is about EVERY pair of neighbouring rows. Two equal ratios are a start, not a pattern: the third one breaks it.', say: 'Yes. A family test is about every pair of neighbouring rows. Two equal ratios are a start, not a pattern. The third one breaks it.' },
  'e.why.even': { html: 'Even numbers have nothing to do with it. 14 ÷ 8 is 1.75, not 2: the factor changes.', say: 'Even numbers have nothing to do with it. Fourteen divided by eight is one point seven five, not two. The factor changes.' },
  'e.why.start': { html: 'Exponential tables can start anywhere. The problem is that the ratio does not stay the same.', say: 'Exponential tables can start anywhere. The problem is that the ratio does not stay the same.' },
  // 3. Your turn
  't.intro': { html: `Your turn, with all three tests. A new table: ${xIs('0, 2, 4, 6, 8')} and ${a('y = 3, 6, 12, 24, 48')}.`, say: 'Your turn, with all three tests. A new table: x is zero, two, four, six, eight, and y is three, six, twelve, twenty four, forty eight.' },
  't.step': { html: 'Check the inputs first. Which is true?', say: 'Check the inputs first. Which is true?' },
  't.step.ok': { html: 'Right: every x-step is +2. Equal steps of any size are fine.', say: 'Right. Every x step is plus two. Equal steps of any size are fine.' },
  't.step.one': { html: 'The steps do not have to be +1. They have to be equal, and these are all +2.', say: 'The steps do not have to be plus one. They have to be equal, and these are all plus two.' },
  't.step.uneq': { html: 'Subtract neighbours: 2 − 0, 4 − 2, 6 − 4, 8 − 6. All +2: equal.', say: 'Subtract neighbours. Two minus zero, four minus two, and so on. All plus two: equal.' },
  't.d1': { html: 'Type the 1st difference from <i>x</i> = 2 to <i>x</i> = 4.', say: 'Type the first difference from x equals two to x equals four.' },
  't.d1.ok': { html: 'Yes: 12 − 6 = 6. The 1st differences are +3, +6, +12, +24: not equal, so not linear.', say: 'Yes. Twelve minus six is six. The first differences are plus three, plus six, plus twelve, plus twenty four. Not equal, so not linear.' },
  't.d1.ratio': { html: 'That is the ratio 12 ÷ 6. A difference subtracts: 12 − 6.', say: 'That is the ratio, twelve divided by six. A difference subtracts: twelve minus six.' },
  't.d1.other': { html: 'Subtract the y-values: the one at <i>x</i> = 4 minus the one at <i>x</i> = 2.', say: 'Subtract the y values: the one at x equals four, minus the one at x equals two.' },
  't.quad': { html: 'The 1st differences keep changing. Is the table quadratic, then?', say: 'The first differences keep changing. Is the table quadratic, then?' },
  't.quad.ok': { html: 'Right, check before you claim. 2nd differences: +3, +6, +12. Not constant: not quadratic.', say: 'Right. Check before you claim. Second differences: plus three, plus six, plus twelve. Not constant: not quadratic.' },
  't.quad.no': { html: 'Changing 1st differences only rule out linear. Exponential tables have them too. The 2nd differences decide: +3, +6, +12.', say: 'Changing first differences only rule out linear. Exponential tables have them too. The second differences decide: plus three, plus six, plus twelve.' },
  't.ratio': { html: 'Last test: type the ratio of neighbours 12 ÷ 6.', say: 'Last test. Type the ratio of neighbours, twelve divided by six.' },
  't.ratio.ok': { html: 'Yes: ×2. And 6 ÷ 3, 24 ÷ 12, 48 ÷ 24 are ×2 too: every ratio is the same.', say: 'Yes, times two. And six over three, twenty four over twelve, forty eight over twenty four are times two too. Every ratio is the same.' },
  't.ratio.diff': { html: '6 is the difference. The ratio divides: 12 ÷ 6.', say: 'Six is the difference. The ratio divides: twelve divided by six.' },
  't.ratio.other': { html: 'Divide the later value by the earlier one: 12 ÷ 6.', say: 'Divide the later value by the earlier one: twelve divided by six.' },
  't.fam': { html: 'So what is the table consistent with?', say: 'So what is the table consistent with?' },
  't.fam.ok': { html: `Right: ${s('exponential')}, ×2 for every step of 2 in x. Per single unit of x the factor is smaller (it takes two units to double).`, say: 'Right. Exponential, times two for every step of two in x. Per single unit of x, the factor is smaller: it takes two units to double.' },
  't.fam.unit': { html: 'The x-steps are +2, so ×2 is the factor per step of 2, not per 1 unit of x.', say: 'The x steps are plus two, so times two is the factor per step of two, not per one unit of x.' },
  't.fam.quad': { html: 'The 2nd differences were +3, +6, +12: not constant. The ratios are the test that passes.', say: 'The second differences were plus three, plus six, plus twelve: not constant. The ratios are the test that passes.' },
  'q.cb.right': { html: 'At the start you picked quadratic, and the tests agree: constant 2nd differences of +2.', say: 'At the start you picked quadratic, and the tests agree: constant second differences of plus two.' },
  'q.cb.exp': { html: 'At the start you picked exponential. The first rows double, but the ratio test fails at 14 ÷ 8. A test must hold on every step.', say: 'At the start you picked exponential. The first rows double, but the ratio test fails at fourteen over eight. A test must hold on every step.' },
  'q.cb.lin': { html: 'At the start you picked linear. The 1st differences are +2, +4, +6, +8: not equal. The 2nd differences settle it: quadratic.', say: 'At the start you picked linear. The first differences are plus two, plus four, plus six, plus eight: not equal. The second differences settle it: quadratic.' },
  'q.cb.none': { html: 'Check equal x-steps, then 1st differences, 2nd differences and ratios: one test (or none) passes on every step.', say: 'Check equal x steps, then first differences, second differences and ratios. One test, or none, passes on every step.' },
  // 4. Prove it
  'p.intro': { html: `Sam’s table of <i>f</i>(<i>x</i>) has 1st differences +3, +3, +3, +3. “So the rule is linear. Proved,” says Sam. Is it?`, say: 'Sam’s table of f of x has first differences plus three, plus three, plus three, plus three. So the rule is linear, proved, says Sam. Is it?' },
  'p.test': { html: `Look at <i>g</i>: it agrees with the line on all five rows, and at <i>x</i> = 5 it gives 46, not 16. A table is only ${s('consistent')} with a family.`, say: 'Look at g. It agrees with the line on all five rows, and at x equals five it gives forty six, not sixteen. A table is only consistent with a family.' },
  'p.build': { html: 'Right: a table is only consistent with a family. What IS always true goes the other way: every linear function gives equal differences. Prove it: fill each “because”.', say: 'Right. A table is only consistent with a family. What is always true goes the other way: every linear function gives equal differences. Prove it. Fill each because.' },
  'p.build2': { html: 'Now the direction that IS always true: every linear function gives equal differences. Prove it: fill each “because”.', say: 'Now the direction that is always true: every linear function gives equal differences. Prove it. Fill each because.' },
  'p.c1': { html: 'Right. f(x + h) means: the rule with x + h in place of x.', say: 'Right. f of x plus h means: the rule, with x plus h in place of x.' },
  'p.c2': { html: 'Right. m(x + h) = mx + mh; the mx and the c cancel, leaving mh.', say: 'Right. m times x plus h is m x plus m h. The m x and the c cancel, leaving m h.' },
  'p.c3': { html: 'Right. mh has no x in it, so it is the same wherever the step starts.', say: 'Right. m h has no x in it, so it is the same wherever the step starts.' },
  'p.no.examples': { html: 'That is Sam’s argument: rows are examples. The claim is about every x.', say: 'That is Sam’s argument. Rows are examples. The claim is about every x.' },
  'p.no.shift': { html: 'f(x + h) is the rule with x + h put in, not f(x) plus h.', say: 'f of x plus h is the rule with x plus h put in, not f of x, plus h.' },
  'p.no.converse': { html: 'That is the other direction, and g just showed it is false.', say: 'That is the other direction, and g just showed it is false.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes THIS line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'Proved: a linear function gives the same difference, mh, for every step of size h. The table can only show consistency; the rule guarantees the pattern.', say: 'Proved. A linear function gives the same difference, m h, for every step of size h. A table can only show consistency. The rule guarantees the pattern.' },
};
function xIs(v: string): string { return `<i>x</i> = ${v}`; }
