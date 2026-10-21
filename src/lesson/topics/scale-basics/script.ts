// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/scale-basics/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = a drawing length (amber), b = an actual length (teal), s = the answer (lime).
export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `A drawing of a skateboard is <b class="a">4 in</b> long. The actual skateboard is <b class="b">32 in</b> long. A scale compares the two lengths, drawing first. Which scale fits this drawing? Pick one, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one: the picture moves first, then the maths on the board.',
  'e.step0': `Length goes with length, width with width. The drawing's <b class="a">4 in</b> matches the actual <b class="b">32 in</b>, and <b class="a">1 in</b> matches <b class="b">8 in</b>.`,
  'e.step1': `Lay the drawing's length along the actual board: <b class="s">8 copies</b> fill it. 32 ÷ 4 = 8, so the actual board is 8 times as long. Not 28 times: 28 is only how much longer it is.`,
  'e.step2': `One factor has to work for every length. The width: 8 copies of 1 in fill 8 in, and 8 ÷ 1 = 8 again. So the drawing is to scale.`,
  'e.step3': `Write the scale drawing first, actual second, in one unit: 4 : 32 = <b class="s">1 : 8</b>. It says 1 inch on the drawing stands for 8 inches of skateboard.`,
  'e.why': 'Quick check: why is the scale 1 : 8, and not 1 : 28?',
  'e.why.ok': 'Yes. Eight copies of the drawing fill the actual board, both ways. A scale counts copies.',
  'e.why.diff': '28 is the difference, 32 − 4. But 1 inch on the drawing does not stand for 29 inches: it stands for 8.',
  'e.why.few': 'Every length has to fit the same factor. If the width needed another one, the drawing would be stretched.',

  // 3 Your turn
  't.intro': `Now a laptop. The drawing is <b class="a">6 cm</b> by <b class="a">4 cm</b>; the actual laptop is <b class="b">30 cm</b> by <b class="b">20 cm</b>. I'll do the first two steps, then it's your turn.`,
  't.given': `Five copies of the drawing's <b class="a">6 cm</b> fill the actual <b class="b">30 cm</b>: the actual length is 5 times as long.`,
  't.wid': 'Now the width. The actual width is how many times as long as the drawing’s width?',
  't.wid.ok': 'Right: 20 ÷ 4 = <b class="s">5</b>. Five copies fill the width too: one factor, both ways.',
  't.wid.diff': '16 is how much longer: 20 − 4. How many copies of 4 cm fit in 20 cm?',
  't.wid.rev': 'That compares the drawing with the laptop. The actual width is the long one: how many times as long is it?',
  't.wid.len': '20 cm is the actual width itself. How many times does 4 cm fit into it?',
  't.wid.miss': 'Count copies: how many 4s make 20? Try again.',
  't.scale': 'Write the scale, drawing : actual, in the form 1 : n.',
  't.scale.ok': 'Right: 6 : 30 = <b class="s">1 : 5</b>. 1 cm on the drawing stands for 5 cm of laptop.',
  't.scale.rev': 'Drawing first. The drawing is the small one: 1 : 5, not 5 : 1.',
  't.scale.diff': '24 is the difference, 30 − 6. A scale is “times as long”: 30 ÷ 6.',
  't.scale.equiv': '6 : 30 is the same comparison. Now make the drawing part 1: divide both parts by 6.',
  't.scale.one': 'You divided the 6 by 6, but not the 30. Divide both parts: 30 ÷ 6 = 5.',
  't.scale.miss': 'Drawing : actual is 6 : 30. Divide both parts by 6.',
  't.empty': 'Type a number in each box first.',
  'q.cb.right': 'At the start you picked 1 : 8, and you were right. Now you can show why: 8 copies, both ways.',
  'q.cb.diff': 'At the start you picked 1 : 28. That is the difference, 32 − 4. A scale counts copies: 32 ÷ 4 = 8, so 1 : 8.',
  'q.cb.rev': 'At the start you picked 8 : 1. That puts the actual board first. Drawing first: 1 : 8.',
  'q.cb.none': 'A scale counts how many copies of the drawing make the actual length, drawing first.',

  // 4 Prove it
  'p.intro': `A floor plan is drawn at <b class="a">1</b> : <b class="b">100</b>. On the plan, the hallway is <b class="a">5 cm</b> long and <b class="a">2 cm</b> wide. Sam says: “The scale is 1 : 100, so the hallway is 100 cm long.” Is Sam right?`,
  'p.build.no': 'Now prove it. Fill each “because” with the reason that makes the line true.',
  'p.build.yes': 'Let’s test it. Fill each “because” with the reason that makes the line true, and see where it leads.',
  'p.c1': 'Right. Each centimeter of the plan stands for 100 cm of hallway: 100 is a factor, not a length.',
  'p.c2': 'Right. Sam’s 100 cm is only the first centimeter of the plan. The whole hallway is 5 × 100 = <b class="s">500 cm</b>.',
  'p.c3': 'Right. The width uses the same factor: 2 × 100 = <b class="s">200 cm</b>. Different lengths, one scale.',
  'p.done': 'That’s a proof: three claims, each with its reason, and the picture backs every one. A scale is a factor: it multiplies every length on the plan.',
  'p.chip.len': 'That is Sam’s slip. 100 is not the length of any wall; it multiplies the lengths on the plan.',
  'p.chip.seg': 'One plan, one scale. Every length on it uses the same factor, long or short.',
  'p.chip.unit': 'In inches both lengths change together, so it stays 1 : 100. And it is not the reason for this line.',
  'p.chip.other': 'True, but it is the reason for a different line. Which reason makes this line true?',
};
