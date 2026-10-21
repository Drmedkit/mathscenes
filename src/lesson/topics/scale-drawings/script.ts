// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/scale-drawings/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = a length on the drawing (amber), b = a real length (teal), s = the answer (lime).
const f = (n: number | string, d: number | string) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const half = (w: number) => `${w}&#8202;${f(1, 2)}`;

export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `On this floor plan, <b class="a">1 inch</b> represents <b class="b">4 feet</b>. The bedroom's long wall is <b class="a">${half(3)} inches</b> on the plan. How long is the real wall? Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one and watch the plan first, then the maths on the board.',
  'e.step0': `The scale is a promise: every <b class="a">1 inch</b> on the plan stands for <b class="b">4 feet</b> of the real room. The ruler shows it: under each inch, 4 more feet.`,
  'e.step1': `Measure the wall on the plan: from the 0 mark to <b class="a">${half(3)} inches</b>.`,
  'e.step2': `${half(3)} inches is ${half(3)} groups of 4 feet: ${half(3)} × 4 = <b class="s">14 feet</b>. Under the ruler, ${half(3)} inches sits halfway between 12 and 16 feet.`,
  'e.step3': `Every length uses the same scale. The short wall is ${half(2)} inches, so it is ${half(2)} × 4 = <b class="s">10 feet</b>. And the corners stay square: a scale drawing changes lengths, never angles.`,
  'e.why': 'Quick check: why is the real wall 14 feet, and not 6½ feet?',
  'e.why.ok': `Yes. The scale multiplies: each inch is 4 feet, so ${half(3)} inches are ${half(3)} × 4 = 14 feet.`,
  'e.why.add': `From 1 to 4 looks like “add 3”, but the scale says each inch is 4 feet. Adding 3 only works for exactly 1 inch.`,
  'e.why.div': `Dividing makes the real wall shorter than the drawing. The real room is bigger: multiply by 4.`,

  // 3 Your turn
  't.intro': `Now a school garden, drawn at <b class="a">1 cm</b> represents <b class="b">3 m</b>. I'll do the first two steps; then it's your turn.`,
  't.given': `Every centimeter on the plan is 3 meters of garden. The long side measures <b class="a">6 cm</b> on the plan.`,
  't.long': 'How long is the real long side?',
  't.long.ok': `Right: 6 × 3 = <b class="s">18 m</b>.`,
  't.long.add': `1 cm to 3 m is not “add 2”: it is “times 3”. Each of the 6 centimeters stands for 3 meters.`,
  't.long.div': `The real garden is bigger than the plan: multiply by 3, don't divide.`,
  't.long.same': `6 is the length on the plan. Each centimeter of it stands for 3 meters.`,
  't.long.miss': `Each centimeter stands for 3 meters. Try again.`,
  't.short': `Same scale for every side. The short side is <b class="a">4.5 cm</b> on the plan. How long is it really?`,
  't.short.ok': `Right: 4.5 × 3 = <b class="s">13.5 m</b>.`,
  't.short.add': `That adds instead of multiplying. Each of the 4.5 centimeters is 3 meters: 4.5 × 3.`,
  't.short.div': `The real side is longer than the drawing: multiply by 3.`,
  't.short.miss': `4.5 centimeters, 3 meters each. Try again.`,
  't.shed': `The school wants a shed that is <b class="b">6 m</b> long. How long do you draw it on the plan?`,
  't.shed.ok': `Right: 6 ÷ 3 = <b class="s">2 cm</b>. From real to plan, you divide.`,
  't.shed.times': `That's 6 × 3: a shed drawn bigger than the real one. From real to plan, divide by 3.`,
  't.shed.miss': `How many groups of 3 meters fit in 6 meters? Try again.`,
  't.done': `Back to the bedroom: each inch is 4 feet, so ${half(3)} inches are ${half(3)} × 4 = <b class="s">14 feet</b>.`,

  // 4 Prove it
  'p.intro': `Sam's plan uses <b class="a">1 in</b> represents <b class="b">4 ft</b>. The room is 3 in by 2 in on the plan: 6 square inches. Sam says: “The scale is 4, so the real room is 6 × 4 = 24 square feet.” Is Sam right?`,
  'p.build.no': `Now prove it. Fill each “because” with the reason that makes the line true.`,
  'p.build.yes': `Let's test it. Fill each “because” with the reason that makes the line true, and see where it leads.`,
  'p.c1': `Every length is multiplied by 4: the real room is <b class="b">12 feet</b> by <b class="b">8 feet</b>.`,
  'p.c2': `So the real area is 12 × 8 = <b class="s">96 square feet</b>. Not 24.`,
  'p.c3': `One square inch of the plan stands for a square 4 feet by 4 feet: <b class="s">16 square feet</b>. The area grows 16 times, not 4 times.`,
  'p.done': `That's a proof: three claims, each with its reason, and the picture backs every one. Lengths grow by the scale; areas grow by the scale times the scale.`,
  'p.chip.area': `That is exactly Sam's mistake: an area has two directions, and both of them grow.`,
  'p.chip.plan': `The plan's numbers are inches on paper. The real room needs the scale.`,
  'p.chip.example': `One room is an example, not a reason. Why does every square inch grow that much?`,
  'p.chip.other': 'True, but it is the reason for a different line. Which one makes this line true?',
};
