// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the run / input amber, b = the rise / output teal, s = the answer lime, w = wrong red), `say` is the same line
// written to be read aloud (no digits, no symbols). pages/lessons/slope-and-lines/voice/lines.json holds the `say`
// texts; the test keeps the two in step. No imports.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const f = (n: string, d: string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const X = '<i>x</i>', Y = '<i>y</i>';

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: Jo's small triangle and Kai's big triangle on one line
  'q.intro': { html: `A line, and two slope triangles on it. Jo's small triangle goes ${a('3 across')} and ${b('2 up')}: a slope of ${f('2', '3')}.`, say: "A line, and two slope triangles on it. Jo's small triangle goes three across and two up: a slope of two thirds." },
  'q.ask': { html: `Kai draws a bigger triangle on the same line: ${a('6 across')}, ${b('4 up')}. What slope does Kai's triangle show? Pick one, and say how sure you are.`, say: "Kai draws a bigger triangle on the same line: six across, four up. What slope does Kai's triangle show? Pick one, and say how sure you are." },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s0': { html: `Jo's triangle: ${a('3 across')} (the run) and ${b('2 up')} (the rise). Slope = rise ÷ run = ${s(f('2', '3'))}: the line climbs ${f('2', '3')} for every 1 across.`, say: "Jo's triangle: three across, the run, and two up, the rise. Slope is rise divided by run: two thirds. The line climbs two thirds for every one across." },
  'e.s1': { html: `The bottom legs are both horizontal, so they are parallel. The line crosses them at the same angle (corresponding angles), and both triangles have a right angle. Two equal angles: ${s('the triangles are similar')}.`, say: 'The bottom legs are both horizontal, so they are parallel. The line crosses them at the same angle, corresponding angles, and both triangles have a right angle. Two equal angles: the triangles are similar.' },
  'e.s2': { html: `Similar triangles keep their sides in the same ratio. Kai's: ${b('4 up')} for ${a('6 across')}, and ${f('4', '6')} = ${s(f('2', '3'))}. The same slope, anywhere on the line.`, say: "Similar triangles keep their sides in the same ratio. Kai's: four up for six across, and four sixths is two thirds. The same slope, anywhere on the line." },
  'e.s3': { html: `Take any point (${X}, ${Y}) on the line. Its triangle from (0, 1) has run ${a(X)} and rise ${b(`${Y} − 1`)}, and its slope is ${f('2', '3')} too. So ${Y} − 1 = ${f('2', '3')}${X}, and ${s(`${Y} = ${f('2', '3')}${X} + 1`)}.`, say: 'Take any point x, y on the line. Its triangle from the point where the line meets the y axis has run x and rise y minus one, and its slope is two thirds too. So y minus one is two thirds x, and y equals two thirds x plus one.' },
  'e.why': { html: "Quick check: why does Kai's big triangle give the same slope as Jo's small one?", say: "Quick check: why does Kai's big triangle give the same slope as Jo's small one?" },
  'e.why.ok': { html: `Yes. Same angles, so the sides keep the same ratio: rise ÷ run stays ${f('2', '3')}.`, say: 'Yes. Same angles, so the sides keep the same ratio: rise divided by run stays two thirds.' },
  'e.why.look': { html: 'They do look alike, but looks can fool you. The reason is the equal angles: the corresponding angles at the parallel legs, and the right angles.', say: 'They do look alike, but looks can fool you. The reason is the equal angles: the corresponding angles at the parallel legs, and the right angles.' },
  'e.why.size': { html: `Then a bigger triangle would show a bigger slope, and it doesn't: ${f('4', '6')} = ${f('2', '3')}. Size does not change the ratio.`, say: "Then a bigger triangle would show a bigger slope, and it doesn't: four sixths is two thirds. Size does not change the ratio." },
  // 3. Your turn: a candle burning down
  't.intro': { html: `A candle is ${b('6 inches')} tall and burns down at a steady rate. The graph shows its height for 12 hours. The first step is done for you.`, say: 'A candle is six inches tall and burns down at a steady rate. The graph shows its height for twelve hours. The first step is done for you.' },
  't.s0': { html: `From (0, 6) to (2, 5): run ${a('2')}, rise ${b('−1')}. Slope = ${s(`−${f('1', '2')}`)}.`, say: 'From the start to the point two, five: run two, rise negative one. The slope is negative one half.' },
  't.rise': { html: `Now a big triangle on the same line, from (2, 5) to (8, 2). Its run is ${a('6')}. What is its ${b('rise')}? Use a minus sign if it goes down.`, say: 'Now a big triangle on the same line, from two, five to eight, two. Its run is six. What is its rise? Use a minus sign if it goes down.' },
  't.rise.ok': { html: `Yes: down 3, so the rise is ${b('−3')}.`, say: 'Yes: down three, so the rise is negative three.' },
  't.rise.sign': { html: 'The candle gets shorter: the height goes DOWN 3. A drop is a negative rise: −3.', say: 'The candle gets shorter: the height goes down three. A drop is a negative rise: negative three.' },
  't.rise.no': { html: 'Count the squares from a height of 5 down to 2.', say: 'Count the squares from a height of five down to two.' },
  't.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.slope': { html: 'So what slope does the big triangle show?', say: 'So what slope does the big triangle show?' },
  't.slope.ok': { html: `Yes: −3 ÷ 6 = ${s(`−${f('1', '2')}`)}, the same as the small triangle. The candle loses half an inch each hour.`, say: 'Yes: negative three divided by six is negative one half, the same as the small triangle. The candle loses half an inch each hour.' },
  't.slope.sign': { html: `The height goes down, so the slope is negative: −${f('1', '2')}.`, say: 'The height goes down, so the slope is negative: negative one half.' },
  't.slope.inv': { html: 'That is run ÷ rise. Slope is rise ÷ run: −3 ÷ 6.', say: 'That is run divided by rise. Slope is rise divided by run: negative three divided by six.' },
  't.slope.rise': { html: '−3 is the rise for 6 hours. Divide it by the run, 6.', say: 'Negative three is the rise for six hours. Divide it by the run, six.' },
  't.eq': { html: "Last step: which equation is the candle's line? Start with its height at 0 hours.", say: "Last step: which equation is the candle's line? Start with its height at zero hours." },
  't.eq.ok': { html: `Yes: it starts at ${b('6 inches')} and changes by −${f('1', '2')} inch each hour.`, say: 'Yes: it starts at six inches and changes by negative one half inch each hour.' },
  't.eq.swap': { html: `The number times ${X} is the slope, −${f('1', '2')}. The number added is the start, 6.`, say: 'The number times x is the slope, negative one half. The number added is the start, six.' },
  't.eq.drop': { html: 'That line goes through (0, 0), but the candle starts at 6 inches.', say: 'That line goes through the origin, but the candle starts at six inches.' },
  't.eq.sign': { html: `A slope of +${f('1', '2')} would make the candle grow. It burns down: −${f('1', '2')}.`, say: 'A slope of positive one half would make the candle grow. It burns down: negative one half.' },
  't.cb.right': { html: `At the start you picked ${f('2', '3')} for Kai, and you were right. Now you can say why: similar triangles keep rise ÷ run the same.`, say: 'At the start you picked two thirds for Kai, and you were right. Now you can say why: similar triangles keep rise divided by run the same.' },
  't.cb.double': { html: `At the start you picked ${f('4', '3')}: twice the triangle, twice the slope. But the run doubled too, so the ratio stayed ${f('2', '3')}.`, say: 'At the start you picked four thirds: twice the triangle, twice the slope. But the run doubled too, so the ratio stayed two thirds.' },
  't.cb.rise': { html: `At the start you picked 4, the rise on its own. Slope divides the rise by the run: 4 ÷ 6 = ${f('2', '3')}.`, say: 'At the start you picked four, the rise on its own. Slope divides the rise by the run: four divided by six is two thirds.' },
  't.cb.none': { html: 'On a straight line, every slope triangle gives the same rise ÷ run.', say: 'On a straight line, every slope triangle gives the same rise divided by run.' },
  't.cb.sure': { html: 'And you were certain, so this one is worth remembering.', say: 'And you were certain, so this one is worth remembering.' },
  // 4. Prove it: Riley and y = 2x + 3
  'p.intro': { html: `Riley says: "The line ${Y} = 2${X} + 3 has the same slope everywhere. So ${Y}/${X} is the same at every point too, and the line is proportional." Is Riley right?`, say: 'Riley says: the line y equals two x plus three has the same slope everywhere. So y over x is the same at every point too, and the line is proportional. Is Riley right?' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.build': { html: 'Now prove it. Fill each "because" with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. Two slope triangles, and both go up 2 for each 1 across.', say: 'Right. Two slope triangles, and both go up two for each one across.' },
  'p.c2': { html: `Right. The dashed lines from (0, 0) through the two points have different slopes: ${Y}/${X} is 5, then 3.`, say: 'Right. The dashed lines from the origin through the two points have different slopes: y over x is five, then three.' },
  'p.c3': { html: "Right. The line crosses the y-axis at 3, not at 0. Riley's claim is false.", say: "Right. The line crosses the y axis at three, not at zero. Riley's claim is false." },
  'p.no.prop': { html: 'Every straight line is linear, but proportional needs more: it must go through (0, 0).', say: 'Every straight line is linear, but proportional needs more: it must go through the origin.' },
  'p.no.ratio': { html: `That is exactly Riley's slip. Check ${Y}/${X} at two points: 5 and 3.`, say: "That is exactly Riley's slip. Check y over x at two points: five and three." },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That's a proof: three claims, each with its reason, and the picture backs every one. A constant slope gives a constant ${Y}/${X} only when b = 0.`, say: "That's a proof: three claims, each with its reason, and the picture backs every one. A constant slope gives a constant y over x only when b is zero." },
};
