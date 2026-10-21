// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/scale-calculations/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = a drawing length (amber), b = an actual length (teal), s = the answer (lime).
export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `A house plan uses the scale <b class="a">1 in</b> : <b class="b">8 ft</b>. The living-room wall is <b class="b">20 ft</b> long. How long is it on the plan? Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one: the picture moves first, then the maths on the board.',
  'e.step0': `Drawing first: <b class="a">1 in</b> on the plan stands for <b class="b">8 ft</b>. Each inch more is 8 feet more, so plan → actual is <b class="s">× 8</b>.`,
  'e.step1': `Here we know the actual length and want the plan length: the step back. It undoes × 8 with the same factor: <b class="s">÷ 8</b>.`,
  'e.step2': `<b class="b">20</b> ÷ 8 = <b class="s">2.5</b>. The wall is <b class="s">2.5 in</b> on the plan, straight above 20 ft.`,
  'e.step3': `Check by going back: 2.5 × 8 = 20 ft. And 2.5 in is 2&#8202;½ in, a half-inch mark on the ruler: draw the wall to it.`,
  'e.why': 'Quick check: why divide by 8 here, and not multiply?',
  'e.why.ok': 'Yes. × 8 is the way from the plan to the real wall. Coming back, divide.',
  'e.why.times': '× 8 would give 160 inches of paper: over 13 feet for one wall. The step back divides.',
  'e.why.add': 'A scale multiplies; it never adds. Each inch is 8 feet, so 2 inches is 16 feet, not 9.',

  // 3 Your turn
  't.intro': `Your turn, same plan. The bedroom wall is <b class="a">2.25 in</b> on the plan. How long is the real wall? The first step is done for you.`,
  't.way': 'Which step takes the plan length to the actual length?',
  't.way.ok': 'Yes: plan → actual is × 8. The real wall is the long one.',
  't.way.div': 'Dividing goes back from feet to the plan. Here we go from the plan to the real wall.',
  't.way.add': 'A scale multiplies. Each inch is 8 feet: adding keeps the gap, not the scale.',
  't.calc': 'How long is the real wall? 2.25 × 8 = ?',
  't.calc.ok': 'Right: 2.25 × 8 = <b class="s">18 ft</b>. 2 × 8 = 16, and 0.25 × 8 = 2.',
  't.calc.part': '16.25 multiplies only the 2. The quarter inch needs × 8 too: 0.25 × 8 = 2 feet.',
  't.calc.div': 'That divides. Plan → actual multiplies: each inch is 8 feet.',
  't.calc.add': 'That adds 7. A scale multiplies: 2.25 × 8.',
  't.calc.miss': 'Multiply both parts: 2 × 8, and 0.25 × 8.',
  't.empty': 'Type a number first.',
  't.back': 'Check it by going back: 18 ft is how many inches on the plan?',
  't.back.ok': 'Yes: 18 ÷ 8 = 2.25 in. Back where we started, so 18 ft is right.',
  't.back.times': '144 multiplies again. Going back undoes × 8: divide.',
  't.back.whole': '18 ÷ 8 does not stop at 2 with a remainder: keep going. 2 ÷ 8 = 0.25.',
  't.back.miss': '18 ÷ 8 = ? Keep going after the decimal point.',
  'q.cb.right': 'At the start you picked 2.5 in, and you were right. Now you can show why: the step back divides by 8.',
  'q.cb.times': 'At the start you picked 160 in. That multiplies on the way back. Feet to plan inches divides by 8.',
  'q.cb.add': 'At the start you picked 13 in. That adds instead of multiplying. A scale is × 8 one way and ÷ 8 the other.',
  'q.cb.none': 'One scale, two directions: × 8 to the real thing, ÷ 8 back to the plan.',

  // 4 Prove it
  'p.intro': `Sam builds a model shed at <b>1 : 48</b>. The real shed is <b class="b">12 ft</b> long. Sam writes: 12 ÷ 48 = 0.25, so the model is <b>0.25 in</b> long. Is Sam right?`,
  'p.test': 'Let’s test it. Build the argument, and see where it leads.',
  'p.build': 'Now prove it. Fill each “because” with the reason that makes the line true.',
  'p.c1': 'Right. Straight above 12 ft, the model line is far past 0.25. Sam’s 0.25 is in feet, not inches.',
  'p.c2': 'Right. 1 : 48 needs one unit on both sides: 12 ft = 144 in.',
  'p.c3': 'Right. 144 ÷ 48 = 3: the model is 3 in long. And 0.25 ft is 3 in too.',
  'p.no.order': 'Sam may divide first: 12 ÷ 48 = 0.25 is right, in FEET. His slip is the label, not the order.',
  'p.no.ten': 'A foot is 12 inches, not 10. 0.25 ft = 0.25 × 12 = 3 in.',
  'p.no.other': 'True, but it is the reason for a different line. Which reason makes this line true?',
  'p.done': 'That’s a proof: three claims, each with its reason, and the lines back every one. Sam’s number was right; his unit was not.',
};
