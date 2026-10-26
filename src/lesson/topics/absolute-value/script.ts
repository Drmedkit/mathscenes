// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows, `say` is the same
// line written to be read aloud (no digits, no symbols). pages/lessons/absolute-value/voice/lines.json holds the `say`
// texts; the test keeps the two in step.
const s = (x: string) => `<b class="s">${x}</b>`;
const x = '<i>x</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `Which numbers ${x} make |${x} − 4| = 3 true? Pick an answer, and say how sure you are.`, say: 'Which numbers x make the absolute value of x minus four equal to three? Pick an answer, and say how sure you are.' },
  'q.cb.right': { html: `You said ${x} = 1 or ${x} = 7, and you were right: both are 3 away from 4.`, say: 'You said x is one or seven, and you were right. Both are three away from four.' },
  'q.cb.one': { html: `You said only ${x} = 7. It works, but so does 1: |1 − 4| = |−3| = 3. The inside can be −3 too.`, say: 'You said only seven. It works, but so does one. One minus four is negative three, and its absolute value is three. The inside can be negative three too.' },
  'q.cb.pm': { html: `You said 3 or −3. Those are values of the INSIDE, ${x} − 4. Then ${x} − 4 = 3 or −3 gives ${x} = 7 or ${x} = 1.`, say: 'You said three or negative three. Those are values of the inside, x minus four. Then x minus four is three or negative three, so x is seven or one.' },
  'q.cb.none': { html: `${x} = 1 or ${x} = 7: the two numbers 3 away from 4.`, say: 'x is one or seven: the two numbers three away from four.' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the graph moves first, then the notation.', say: 'Four steps. Press each one. The graph moves first, then the notation.' },
  'e.step0': { html: `Inside first. The bars change their rule where the inside is 0: ${x} − 4 = 0 at ${x} = 4. That is the vertex of y = |${x} − 4|, the point (4, 0).`, say: 'Inside first. The bars change their rule where the inside is zero. x minus four is zero at x equals four. That is the vertex of the graph, the point four, zero.' },
  'e.step1': { html: `Right of 4 the inside is positive, so |${x} − 4| = ${x} − 4. Left of 4 it is negative, so the bars take its opposite: 4 − ${x}. Two straight pieces: a V.`, say: 'Right of four the inside is positive, so the bars change nothing: x minus four. Left of four it is negative, so the bars take its opposite: four minus x. Two straight pieces make a V.' },
  'e.step2': { html: `Where is the V at height 3? The line y = 3 meets it twice, once on each piece. So there are two solutions.`, say: 'Where is the V at height three? The line y equals three meets it twice, once on each piece. So there are two solutions.' },
  'e.step3': { html: `Solve each piece: ${x} − 4 = 3 gives ${x} = 7, and 4 − ${x} = 3 gives ${x} = 1. ${s(`${x} = 1 or ${x} = 7`)}: both 3 away from 4.`, say: 'Solve each piece. x minus four equals three gives seven. Four minus x equals three gives one. So x is one or seven, both three away from four.' },
  'e.why': { html: `Quick check: why does 4 − ${x} = 3 count too?`, say: 'Quick check: why does four minus x equals three count too?' },
  'e.why.ok': { html: `Yes. Left of 4 the bars ARE 4 − ${x}, so that piece must equal 3 as well. Same as ${x} − 4 = −3.`, say: 'Yes. Left of four the bars are four minus x, so that piece must equal three as well. It is the same as x minus four equals negative three.' },
  'e.why.parts': { html: `The bars act on the whole inside, not on each part. |${x} − 4| is not ${x} + 4.`, say: 'The bars act on the whole inside, not on each part. The absolute value of x minus four is not x plus four.' },
  'e.why.always': { html: 'Not always two: |…| = 0 has one solution and |…| = −3 none. Here the V meets y = 3 twice.', say: 'Not always two. An absolute value equal to zero has one solution, and equal to a negative number, none. Here the V meets the line twice.' },
  // 3. Your turn
  't.intro': { html: `Your turn: solve 2|${x} − 2| − 4 = 6. The graph shows y = 2|${x} − 2| − 4.`, say: 'Your turn. Solve two times the absolute value of x minus two, minus four, equals six. The graph shows the left side.' },
  't.iso': { html: 'First step: what do you get when the absolute value is alone?', say: 'First step: what do you get when the absolute value is alone?' },
  't.iso.ok': { html: `Right: add 4, then divide by 2. |${x} − 2| = 5.`, say: 'Right. Add four, then divide by two. The absolute value of x minus two is five.' },
  't.iso.split': { html: 'Not yet. Get the bars alone first; only then split into two cases.', say: 'Not yet. Get the bars alone first. Only then split into two cases.' },
  't.iso.sub': { html: `Undo the − 4 by adding 4: 2|${x} − 2| = 10, then divide by 2.`, say: 'Undo the minus four by adding four. Then divide by two.' },
  't.sol': { html: `Now split |${x} − 2| = 5 and solve both cases.`, say: 'Now split it into two cases and solve both.' },
  't.sol.ok': { html: `Right: ${x} − 2 = 5 gives 7, and ${x} − 2 = −5 gives −3. The line y = 6 meets the V right there.`, say: 'Right. x minus two equals five gives seven, and x minus two equals negative five gives negative three. The line y equals six meets the V right there.' },
  't.sol.pm': { html: `5 and −5 are values of ${x} − 2. Add 2 in each case.`, say: 'Five and negative five are values of x minus two. Add two in each case.' },
  't.sol.other': { html: `${x} − 2 = 5 or ${x} − 2 = −5. Solve each one.`, say: 'x minus two equals five, or x minus two equals negative five. Solve each one.' },
  // 4. Prove it
  'p.intro': { html: `Jordan solves |2${x} − 3| = −5 by splitting: 2${x} − 3 = −5 gives ${x} = −1, and 2${x} − 3 = 5 gives ${x} = 4. He says the solutions are −1 and 4. Is Jordan right?`, say: 'Jordan solves the absolute value of two x minus three equals negative five by splitting. Two x minus three equals negative five gives negative one, and two x minus three equals five gives four. He says the solutions are negative one and four. Is Jordan right?' },
  'p.test': { html: 'Test his answers on the graph. Build the argument: tap a reason for each claim.', say: 'Test his answers on the graph. Build the argument: tap a reason for each claim.' },
  'p.build': { html: 'Build the argument: tap a reason for each claim.', say: 'Build the argument: tap a reason for each claim.' },
  'p.c1': { html: `Yes: at ${x} = −1 the inside is −5, so the case 2${x} − 3 ≥ 0 does not hold there. |−5| = 5, not −5.`, say: 'Yes. At negative one the inside is negative five, so that case does not hold there. The absolute value is five, not negative five.' },
  'p.c2': { html: `Yes: at ${x} = 4 the inside is 5, so the case 2${x} − 3 &lt; 0 does not hold. |5| = 5 again.`, say: 'Yes. At four the inside is five, so the case where it is negative does not hold. The absolute value is five again.' },
  'p.c3': { html: 'Yes: the V never dips below the x-axis, so it never meets y = −5.', say: 'Yes. The V never dips below the x axis, so it never meets the line y equals negative five.' },
  'p.no.algebra': { html: 'Correct algebra inside a case only counts where that case holds. Test the condition.', say: 'Correct algebra inside a case only counts where that case holds. Test the condition.' },
  'p.no.positive': { html: 'You may not drop the minus: |2x − 3| = 5 is a different equation, with different solutions.', say: 'You may not drop the minus. Equal to five is a different equation, with different solutions.' },
  'p.no.both': { html: 'No number meets both conditions at once. A candidate only has to meet its own case’s condition.', say: 'No number meets both conditions at once. A candidate only has to meet the condition of its own case.' },
  'p.no.other': { html: 'True, but it does not back up this claim. Try it on another one.', say: 'True, but it does not back up this claim. Try it on another one.' },
  'p.done': { html: `Jordan is wrong: ${s('no solution')}. An absolute value is a distance, and a distance is never negative.`, say: 'Jordan is wrong. There is no solution. An absolute value is a distance, and a distance is never negative.' },
};
