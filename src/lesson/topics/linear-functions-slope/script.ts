// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the run / changes in x, amber; b = the rise / changes in y, teal; s = the answer / an equation, lime), `say` is
// the same line written to be read aloud (no digits or symbols). pages/lessons/linear-functions-slope/voice/lines.json
// holds the `say` texts (the test keeps the two in step). The page shows a line and speaks it with ctx.say(id).
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const I = (x: string) => `<i>${x}</i>`, X = I('x'), Y = I('y');
const m32 = `−${fr(3, 2)}`;

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question ----------
  'q.intro': { html: `A line passes through ${s('A(−2, 7)')} and ${s('B(4, −2)')}. What is its slope? Pick an answer, and say how sure you are.`,
    say: 'A line passes through the point A, negative two, seven, and the point B, four, negative two. What is its slope? Pick an answer, and say how sure you are.' },

  // ---------- 2. Worked example ----------
  'e.intro': { html: 'Four steps, one line, three ways to write it. Press each step: the graph moves first, then the notation.', say: 'Four steps, one line, three ways to write it. Press each step: the graph moves first, then the notation.' },
  'e.step0': { html: `Go from A to B. Run: 4 − (−2) = ${a('6')}. Rise: −2 − 7 = ${b('−9')}. B minus A on top AND bottom: m = ${b('−9')} ÷ ${a('6')} = ${s(m32)}.`,
    say: 'Go from A to B. The run is four minus negative two, which is six. The rise is negative two minus seven, which is negative nine. B minus A on top and on the bottom: the slope is negative nine over six, which is negative three halves.' },
  'e.step1': { html: `Now take ANY point P(${X}, ${Y}) on the line. From A to P the slope is ${m32} too: a line has one slope everywhere. Multiply both sides by (${X} + 2): ${s(`${Y} − 7 = ${m32}(${X} + 2)`)}. That is <b>point-slope form</b>: a point and the slope, in one equation.`,
    say: 'Now take any point P, x, y, on the line. From A to P the slope is negative three halves too: a line has one slope everywhere. Multiply both sides by x plus two, and you get y minus seven equals negative three halves times x plus two. That is point-slope form: a point and the slope, in one equation.' },
  'e.step2': { html: `Get ${Y} alone. ${m32} multiplies BOTH terms in the bracket: ${Y} − 7 = ${m32}${X} − 3. Add 7: ${s(`${Y} = ${m32}${X} + 4`)}. That is <b>slope-intercept form</b>, and the 4 is the y-intercept: the line crosses at ${s('(0, 4)')}.`,
    say: 'Get y alone. Negative three halves multiplies both terms in the bracket: y minus seven equals negative three halves x, minus three. Add seven: y equals negative three halves x, plus four. That is slope-intercept form, and the four is the y-intercept: the line crosses at zero, four.' },
  'e.step3': { html: `For <b>standard form</b>, clear the fraction: times 2, then put ${X} and ${Y} on one side. ${s(`3${X} + 2${Y} = 8`)}. Set ${Y} = 0 and you get the zero, ${X} = ${fr(8, 3)}. Check B: 3(4) + 2(−2) = 8. ✓`,
    say: 'For standard form, clear the fraction: multiply by two, then put x and y on one side. Three x plus two y equals eight. Set y to zero and you get the zero, x equals eight thirds. Check B: three times four, plus two times negative two, is eight. It checks.' },
  'e.why': { html: 'Quick check: why could ANY point P(x, y) of the line go into the slope formula with A?', say: 'Quick check: why could any point P of the line go into the slope formula with A?' },
  'e.why.ok': { html: 'Yes. That one fact gives point-slope form: the slope from a known point to every other point of the line is m.', say: 'Yes. That one fact gives point-slope form: the slope from a known point to every other point of the line is m.' },
  'e.why.first': { html: `Try it with B: ${Y} + 2 = ${m32}(${X} − 4). Get ${Y} alone: ${Y} = ${m32}${X} + 4 again. Any point of the line works, and the equations look different but name one line.`,
    say: 'Try it with B: y plus two equals negative three halves times x minus four. Get y alone, and it is y equals negative three halves x plus four again. Any point of the line works, and the equations look different but name one line.' },
  'e.why.slots': { html: `${X} and ${Y} stay letters: they stand for every point of the line. A's numbers go in the slots ${X}₁ and ${Y}₁.`, say: 'x and y stay letters: they stand for every point of the line. The numbers of A go in the slots x one and y one.' },

  // ---------- 3. Your turn ----------
  't.intro': { html: `Your turn: the line through ${s('C(−1, 5)')} and ${s('D(3, −3)')}. The slope is done for you: run ${a('4')}, rise ${b('−8')}, m = ${s('−2')}.`,
    say: 'Your turn: the line through C, negative one, five, and D, three, negative three. The slope is done for you: run four, rise negative eight, so the slope is negative two.' },
  't.ps': { html: 'Write the line in point-slope form, using C.', say: 'Write the line in point-slope form, using C.' },
  't.ps.ok': { html: `Yes: ${Y} − 5 = −2(${X} + 1). C's numbers go in with flipped signs, because point-slope form subtracts them.`, say: 'Yes: y minus five equals negative two times x plus one. The numbers of C go in with flipped signs, because point-slope form subtracts them.' },
  't.ps.sign': { html: `Point-slope form subtracts the point: ${Y} − 5 and ${X} − (−1), which is ${X} + 1. Your signs are flipped the other way.`, say: 'Point-slope form subtracts the point: y minus five, and x minus negative one, which is x plus one. Your signs are flipped the other way.' },
  't.ps.mix': { html: `That mixes C's ${Y} with D's ${X}. Keep one point together: C is (−1, 5).`, say: 'That mixes the y of C with the x of D. Keep one point together: C is negative one, five.' },
  't.b': { html: `Now get ${Y} alone: ${Y} = −2${X} + b. What is b?`, say: 'Now get y alone: y equals negative two x plus b. What is b?' },
  't.b.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.b.ok': { html: `Yes: ${Y} − 5 = −2${X} − 2, so ${Y} = −2${X} + 3. The line crosses the y-axis at (0, 3).`, say: 'Yes: y minus five equals negative two x minus two, so y equals negative two x plus three. The line crosses the y-axis at zero, three.' },
  't.b.first': { html: `5 is C's output, at ${X} = −1, not at 0. Distribute the −2, then add 5.`, say: 'Five is the output of C, at x equals negative one, not at zero. Distribute the negative two, then add five.' },
  't.b.part': { html: '−2 multiplies BOTH terms in the bracket: −2 times +1 is −2, not +1.', say: 'Negative two multiplies both terms in the bracket: negative two times one is negative two, not one.' },
  't.b.sign': { html: `Moving the − 5 across the = sign makes it + 5: ${Y} = −2${X} − 2 + 5.`, say: 'Moving the minus five across the equals sign makes it plus five: y equals negative two x, minus two, plus five.' },
  't.b.no': { html: 'Distribute −2 to x and to 1, then add 5 to both sides.', say: 'Distribute negative two to x and to one, then add five to both sides.' },
  't.std': { html: `Last one: which is the standard form A${X} + B${Y} = C?`, say: 'Last one: which is the standard form, A x plus B y equals C?' },
  't.std.ok': { html: `Yes: 2${X} + ${Y} = 3. Set ${Y} = 0: the zero is ${X} = ${fr(3, 2)}. Check D: 2(3) + (−3) = 3. ✓`, say: 'Yes: two x plus y equals three. Set y to zero, and the zero is x equals three halves. Check D: two times three, plus negative three, is three. It checks.' },
  't.std.sign': { html: `Moving −2${X} across the = sign makes it +2${X}.`, say: 'Moving negative two x across the equals sign makes it plus two x.' },
  't.std.alone': { html: `That is slope-intercept form. Standard form has ${X} and ${Y} together on one side.`, say: 'That is slope-intercept form. Standard form has x and y together on one side.' },
  'q.cb.right': { html: `At the start you picked ${m32}, and you were right. Now you know why the order matters: B minus A, top and bottom.`, say: 'At the start you picked negative three halves, and you were right. Now you know why the order matters: B minus A, top and bottom.' },
  'q.cb.inv': { html: `At the start you picked −${fr(2, 3)}. That puts the run on top. Slope is rise over run: the change in ${Y} first.`, say: 'At the start you picked negative two thirds. That puts the run on top. Slope is rise over run: the change in y first.' },
  'q.cb.order': { html: `At the start you picked ${fr(3, 2)}. That subtracts in opposite orders on top and bottom, which flips the sign. The line falls, so its slope is negative.`, say: 'At the start you picked three halves. That subtracts in opposite orders on top and bottom, which flips the sign. The line falls, so its slope is negative.' },
  'q.cb.none': { html: 'Slope: same order on top and bottom. Then one point and the slope give every form of the line.', say: 'Slope: the same order on top and bottom. Then one point and the slope give every form of the line.' },

  // ---------- 4. Prove it ----------
  'p.intro': { html: `Riley finds the slope of the line through ${s('P(2, 5)')} and ${s('Q(2, −1)')}: (−1 − 5) ÷ (2 − 2) = 0. “Slope 0, so it is a flat line, and a function.” Is Riley right?`,
    say: 'Riley finds the slope of the line through P, two, five, and Q, two, negative one: negative one minus five, divided by two minus two, is zero. Slope zero, so it is a flat line, and a function. Is Riley right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. The run is 0, and no number times 0 gives −6: the slope is undefined, not 0.', say: 'Right. The run is zero, and no number times zero gives negative six: the slope is undefined, not zero.' },
  'p.c2': { html: 'Right. A flat line has rise 0 over a real run: 0 ÷ 4 = 0. Riley’s points do not lie on a flat line.', say: 'Right. A flat line has a rise of zero over a real run: zero divided by four is zero. The points of Riley do not lie on a flat line.' },
  'p.c3': { html: `Right. Every point has ${X} = 2: the line is ${X} = 2, vertical. One input with two outputs: not a function.`, say: 'Right. Every point has x equal to two: the line is x equals two, a vertical line. One input with two outputs: not a function.' },
  'p.no.k0': { html: '6 ÷ 0 is not 0. If it were, 0 × 0 would be 6. Dividing by 0 has no answer.', say: 'Six divided by zero is not zero. If it were, zero times zero would be six. Dividing by zero has no answer.' },
  'p.no.none': { html: '“No slope” mixes two different things. Slope 0 is a flat line; an undefined slope is a vertical line.', say: 'No slope mixes up two different things. Slope zero is a flat line, and an undefined slope is a vertical line.' },
  'p.no.const': { html: `A rule like ${Y} = 5 IS a function: every input gets the one output 5. That is not the problem here.`, say: 'A rule like y equals five is a function: every input gets the one output five. That is not the problem here.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the graph backs every one. Zero slope is flat and a function; undefined slope is vertical and not a function.', say: 'That’s a proof: three claims, each with its reason, and the graph backs every one. Zero slope is flat and a function. Undefined slope is vertical, and not a function.' },
};
