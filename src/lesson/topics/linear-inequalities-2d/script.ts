// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// s = the answer / the boundary, lime; a = the first inequality, amber; b = the second, teal), `say` is the same line
// written to be read aloud (no digits or symbols). pages/lessons/linear-inequalities-2d/voice/lines.json holds the
// `say` texts (the test keeps the two in step). The page shows a line and speaks it with ctx.say(id).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const I = (x: string) => `<i>${x}</i>`, X = I('x'), Y = I('y');

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question ----------
  'q.intro': { html: `Which points (${X}, ${Y}) make ${s(`${Y} &gt; ${X} + 1`)} true? Picture ALL of them on the plane. Pick an answer, and say how sure you are.`,
    say: 'Which points make y greater than x plus one true? Picture all of them on the plane. Pick an answer, and say how sure you are.' },

  // ---------- 2. Worked example ----------
  'e.intro': { html: 'Four steps from single points to the whole picture. Press each step: the plane moves first, then the notation.', say: 'Four steps from single points to the whole picture. Press each step: the plane moves first, then the notation.' },
  'e.step0': { html: `Put points in. (0, 3): 3 &gt; 1, ${s('true')}. (3, 1): 1 &gt; 4, false. (−2, 0.5): 0.5 &gt; −1, ${s('true')}: a point between grid lines counts too. (2, 3): 3 &gt; 3 is false, the two sides are EQUAL.`,
    say: 'Put points in. Zero, three: three is greater than one, true. Three, one: one is greater than four, false. Negative two, zero point five: zero point five is greater than negative one, true. A point between grid lines counts too. Two, three: three is greater than three is false. The two sides are equal.' },
  'e.step1': { html: `Every point where the sides are equal lies on one line: ${s(`${Y} = ${X} + 1`)}, the <b>boundary</b>. The sign is &gt;, so equal is NOT enough: the boundary is drawn <b>dashed</b>, and (2, 3) is left out.`,
    say: 'Every point where the sides are equal lies on one line: y equals x plus one, the boundary. The sign is greater than, so equal is not enough: the boundary is drawn dashed, and the point two, three is left out.' },
  'e.step2': { html: `Now one <b>test point</b> off the line: (0, 0) gives 0 &gt; 1, false. So the solutions are on the OTHER side: ${s('above')} the line. Shade it.`,
    say: 'Now one test point off the line. Zero, zero gives zero is greater than one, false. So the solutions are on the other side: above the line. Shade it.' },
  'e.step3': { html: `Why above? At ${X} = 3 the line is at ${Y} = 4, and ${Y} &gt; 3 + 1 means ${Y} &gt; 4: everything straight up from the line. The same at every ${X}. So the solutions fill a <b>half-plane</b>: every point above, decimals too, with no end.`,
    say: 'Why above? At x equals three the line is at y equals four, and y greater than three plus one means y greater than four: everything straight up from the line. The same at every x. So the solutions fill a half-plane: every point above, decimals too, with no end.' },
  'e.why': { html: 'Quick check: why does ONE test point decide the whole side?', say: 'Quick check: why does one test point decide the whole side?' },
  'e.why.ok': { html: 'Yes. To switch from false to true you would have to pass a point where the sides are equal, and those are all on the line. No crossing, no switch.', say: 'Yes. To switch from false to true you would have to pass a point where the sides are equal, and those are all on the line. No crossing, no switch.' },
  'e.why.trick': { html: 'It is more than a rule. The sides can only change order where they are equal, and that is only on the line.', say: 'It is more than a rule. The sides can only change order where they are equal, and that is only on the line.' },
  'e.why.many': { html: 'More tests would all agree. Two points on one side are joined by a path that never meets the line, so the answer cannot change.', say: 'More tests would all agree. Two points on one side are joined by a path that never meets the line, so the answer cannot change.' },

  // ---------- 3. Your turn ----------
  't.intro': { html: `Your turn: graph ${s(`3${X} − 2${Y} ≥ 6`)}. The x-intercept is done for you: ${Y} = 0 gives 3${X} = 6, so (2, 0).`,
    say: 'Your turn: graph three x minus two y is greater than or equal to six. The x-intercept is done for you: y equals zero gives three x equals six, so the point two, zero.' },
  't.y': { html: `Now the y-intercept: put ${X} = 0. ${Y} = ?`, say: 'Now the y-intercept: put x equal to zero. What is y?' },
  't.y.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.y.ok': { html: `Yes: −2${Y} = 6, so ${Y} = −3. The boundary runs through (2, 0) and (0, −3).`, say: 'Yes: negative two y equals six, so y equals negative three. The boundary runs through two, zero and zero, negative three.' },
  't.y.swap': { html: `2 is the x-intercept. For the y-intercept, ${X} is 0: −2${Y} = 6.`, say: 'Two is the x-intercept. For the y-intercept, x is zero: negative two y equals six.' },
  't.y.sign': { html: `Mind the sign: −2${Y} = 6, and 6 divided by −2 is −3.`, say: 'Mind the sign: negative two y equals six, and six divided by negative two is negative three.' },
  't.y.no': { html: `Put ${X} = 0: −2${Y} = 6. Divide by −2.`, say: 'Put x equal to zero: negative two y equals six. Divide by negative two.' },
  't.st': { html: 'Is the boundary solid or dashed?', say: 'Is the boundary solid or dashed?' },
  't.st.ok': { html: 'Yes: ≥ lets equal in, so the points on the line are solutions: solid.', say: 'Yes: greater than or equal lets equal in, so the points on the line are solutions: solid.' },
  't.st.no': { html: '≥ means greater than OR EQUAL. On the line the two sides are equal, and that counts: solid.', say: 'Greater than or equal means greater than, or equal. On the line the two sides are equal, and that counts: solid.' },
  't.side': { html: `Test (0, 0): 3(0) − 2(0) = 0, and 0 ≥ 6 is ${b('false')}. Which side do you shade?`, say: 'Test zero, zero: three times zero minus two times zero is zero, and zero is greater than or equal to six is false. Which side do you shade?' },
  't.side.ok': { html: `Yes: (0, 0) is above the line and fails, so shade ${s('below')}. Check (4, 0): 12 ≥ 6 ✓. The ≥ sign said “above”, the test point said below: with −2${Y}, the sign alone does not tell.`,
    say: 'Yes: zero, zero is above the line and fails, so shade below. Check four, zero: twelve is greater than or equal to six. It checks. The sign said above, the test point said below: with negative two y, the sign alone does not tell.' },
  't.side.above': { html: `≥ only means “above” when ${Y} is alone with a plus sign. Here it is −2${Y}. Trust the test point: (0, 0) is above and false.`,
    say: 'Greater than or equal only means above when y is alone with a plus sign. Here it is negative two y. Trust the test point: zero, zero is above and false.' },
  't.side.origin': { html: '(0, 0) made it FALSE. A false test point means: shade the other side.', say: 'Zero, zero made it false. A false test point means: shade the other side.' },
  'q.cb.right': { html: 'At the start you picked “every point above, not the line”, and you were right. Now you know why: the boundary is where the sides are equal, and one test point picks the side.', say: 'At the start you picked every point above, not the line, and you were right. Now you know why: the boundary is where the sides are equal, and one test point picks the side.' },
  'q.cb.line': { html: 'At the start you picked “only the points on the line”. Those are the points where the sides are EQUAL. Greater than asks for a whole side of the plane.', say: 'At the start you picked only the points on the line. Those are the points where the sides are equal. Greater than asks for a whole side of the plane.' },
  'q.cb.incl': { html: 'At the start you picked “above, and the line too”. The line is where y = x + 1 exactly, and &gt; leaves equal out: dashed.', say: 'At the start you picked above, and the line too. The line is where y equals x plus one exactly, and greater than leaves equal out: dashed.' },
  'q.cb.none': { html: 'Boundary first, dashed or solid from the sign, then one test point picks the side.', say: 'Boundary first, dashed or solid from the sign, then one test point picks the side.' },

  // ---------- 4. Prove it ----------
  'p.intro': { html: `Jordan graphs the system ${a(`${Y} ≥ 2${X} + 1`)} and ${b(`${Y} ≤ 2${X} − 3`)} and shades the strip between the lines: “Two inequalities always make a region.” Is Jordan right?`,
    say: 'Jordan graphs the system y is greater than or equal to two x plus one, and y is less than or equal to two x minus three, and shades the strip between the lines. Two inequalities always make a region. Is Jordan right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. (0, −1) sits in Jordan’s strip, but −1 ≥ 1 is false. A shaded point that fails is evidence the strip is wrong.', say: 'Right. Zero, negative one sits in the strip of Jordan, but negative one is greater than or equal to one is false. A shaded point that fails is evidence the strip is wrong.' },
  'p.c2': { html: 'Right. The first one shades ABOVE the upper line, the second BELOW the lower line: they point away from each other.', say: 'Right. The first one shades above the upper line, the second below the lower line: they point away from each other.' },
  'p.c3': { html: 'Right. Both at once would need 2x + 1 ≤ y ≤ 2x − 3, so 2x + 1 ≤ 2x − 3, and that is 1 ≤ −3: false for every x.', say: 'Right. Both at once would need two x plus one to be at most y, and y at most two x minus three. So one would be at most negative three: false for every x.' },
  'p.no.always': { html: 'That is Jordan’s claim, not a reason. Parallel boundaries can face away from each other, and then nothing is shared.', say: 'That is the claim of Jordan, not a reason. Parallel boundaries can face away from each other, and then nothing is shared.' },
  'p.no.one': { html: 'A solution of a SYSTEM must make every inequality true at the same point.', say: 'A solution of a system must make every inequality true at the same point.' },
  'p.no.example': { html: 'One failing point does not prove that every point fails. That needs a reason that covers all x.', say: 'One failing point does not prove that every point fails. That needs a reason that covers all x.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: a counterexample in the strip, the two half-planes facing away, and an argument for every x. The system has no solution, and nothing should be shaded.', say: 'That’s a proof: a counterexample in the strip, the two half-planes facing away, and an argument for every x. The system has no solution, and nothing should be shaded.' },
};
