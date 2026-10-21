// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/pie-charts/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = the whole (amber), b = a part / a count (teal), s = the answer (lime), w = wrong.
const f = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;

export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `<b class="a">40 seventh graders</b> each picked one lunch. <b class="b">10</b> of them picked pizza. You draw a circle graph of all 40 answers. How big is the angle of the pizza slice? Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one and watch the picture first, then the maths on the board.',
  'e.step0': `The whole circle is <b class="a">all 40 students</b>: 100% of them, and a full turn of 360°. Each dot is one student.`,
  'e.step1': `<b class="b">10</b> of the <b class="a">40</b> picked pizza: ${f(10, 40)} = ${f(1, 4)} of the whole.`,
  'e.step2': `${f(1, 4)} of 100% is <b class="s">25%</b>, and ${f(1, 4)} of 360° is <b class="s">90°</b>: a quarter turn.`,
  'e.step3': `Tacos, salad and pasta go around the same way, each slice starting where the last one ended. The angles close the circle at 360°. Each label gets the name and the percent, and the title names the whole.`,
  'e.why': 'Quick check: why is the pizza angle 90°, and not 25°?',
  'e.why.ok': `Yes. The share is the same on both scales: ${f(1, 4)} of 100% is 25%, ${f(1, 4)} of 360° is 90°.`,
  'e.why.pctdeg': `That mixes the two scales. 25 is out of 100, but the circle is 360°, so a quarter of it is 90°.`,
  'e.why.half': `A full turn is 360°, not 180°. 180° is only half the circle.`,

  // 3 Your turn
  't.intro': `Now <b class="a">60 students</b> picked their favorite sport. I'll do the first two steps; then it's your turn.`,
  't.given': `The whole is <b class="a">60 students</b>: 100%, 360°. Soccer is <b class="b">21</b> of them: ${f(21, 60)}.`,
  't.pct': 'What percent of the 60 students picked soccer?',
  't.pct.ok': `Right: ${f(21, 60)} × 100% = <b class="s">35%</b>.`,
  't.pct.fixed': `21 is the count, not the percent. The whole is 60 students, not 100: take ${f(21, 60)} of 100%.`,
  't.pct.noscale': `0.35 is the share as a decimal. A percent is per hundred: multiply it by 100.`,
  't.pct.miss': `Take ${f(21, 60)} of 100%. Try again.`,
  't.deg': 'Now the angle: how many degrees is the soccer slice?',
  't.deg.ok': `Right: ${f(21, 60)} of 360° is <b class="s">126°</b>. Watch it sweep.`,
  't.deg.pctdeg': `35 is the percent. The circle is 360°, not 100°: take ${f(21, 60)} of 360°.`,
  't.deg.half': `That uses 180° for the whole circle. A full turn is 360°.`,
  't.deg.times': `That is 21 × 360°: twenty-one whole circles. Take ${f(21, 60)} OF 360°.`,
  't.deg.miss': `Take ${f(21, 60)} of 360°. Try again.`,
  't.next': 'Basketball is next: 90°. Where does its slice start?',
  't.next.ok': `Yes: at 126°, where soccer ends. Every slice starts at the last slice's edge.`,
  't.next.no': `From the top again, basketball would lie on top of soccer. It starts where soccer ends: 126°.`,
  't.label': 'Last step: which label goes on the soccer slice?',
  't.label.ok': `Yes: the name and the percent. The degrees are only for drawing.`,
  't.label.deg': `126° is what you drew with a protractor. A reader wants the share: 35%.`,
  't.label.count': `21 is the count. The label shows the percent of the whole: 35%.`,
  't.done': `Back to the pizza question: ${f(10, 40)} = ${f(1, 4)} of the circle, and ${f(1, 4)} of 360° is <b class="s">90°</b>.`,

  // 4 Prove it
  'p.intro': `Riley made a circle graph of the lunch survey and says: “My percents add up to 100% and my angles add up to 360°, so my graph is right.” Is Riley right?`,
  'p.build.no': `Now prove it. Fill each “because” with the reason that makes the line true.`,
  'p.build.yes': `Let's test it. Fill each “because” with the reason that makes the line true, and see where it leads.`,
  'p.c1': `Tacos is 14 of 40 students: 35% of the circle, so a 126° slice. That's the dashed outline.`,
  'p.c2': `But the slice with Riley's Tacos label has a right angle: only 90°, a quarter.`,
  'p.c3': `Riley swapped the pizza and tacos labels. Swapping two labels changes no total, so the totals could not catch it.`,
  'p.done': `That's a proof: three claims, each with its reason, and the picture backs every one. Right totals are needed, but not enough.`,
  'p.chip.total': 'That is exactly Riley\'s mistake: the totals can be right while a slice is wrong.',
  'p.chip.pctdeg': 'Careful: 25% of the circle is a 90° angle, not 25°.',
  'p.chip.radius': 'The size of the circle changes nothing: a slice\'s share is set by its angle.',
  'p.chip.other': 'True, but it is the reason for a different line. Which one makes this line true?',
};
