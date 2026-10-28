// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the first equation, amber; b = the second, teal; s = the new equation / the answer, lime), `say` is the same line
// written to be read aloud (no digits or symbols). pages/lessons/linear-systems/voice/lines.json holds the `say` texts
// (the test keeps the two in step). The page shows a line and speaks it with ctx.say(id).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const I = (x: string) => `<i>${x}</i>`, X = I('x'), Y = I('y');

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question ----------
  'q.intro': { html: `Ana has the system ${a(`3${X} + 2${Y} = 16`)} and ${b(`5${X} − 4${Y} = 12`)}. She keeps the first equation and replaces the second by <b>second + 2 × first</b>, which is ${s(`11${X} = 44`)}. Does her new system have the same solution as the old one? Pick an answer, and say how sure you are.`,
    say: 'Ana has the system three x plus two y equals sixteen, and five x minus four y equals twelve. She keeps the first equation and replaces the second by: the second, plus two times the first. That is eleven x equals forty-four. Does her new system have the same solution as the old one? Pick an answer, and say how sure you are.' },
  'q.cb.right': { html: 'Back to Ana: you said the same solution. Right. Every step here replaced one equation and kept the other, and the crossing never moved.', say: 'Back to Ana: you said the same solution. Right. Every step here replaced one equation and kept the other, and the crossing never moved.' },
  'q.cb.new': { html: 'Back to Ana: you said a new solution. But every new line you drew went through the SAME crossing. Replacing one equation while keeping the other never moves it.', say: 'Back to Ana: you said a new solution. But every new line you drew went through the same crossing. Replacing one equation while keeping the other never moves it.' },
  'q.cb.keep': { html: `Back to Ana: you said only ${s(`11${X} = 44`)} is left. But here ${X} = 2 alone was not the answer either: the kept equation gave ${Y}. The system keeps BOTH equations.`, say: 'Back to Ana: you said only eleven x equals forty-four is left. But here x equals two alone was not the answer either: the kept equation gave y. The system keeps both equations.' },
  'q.cb.none': { html: 'Every step replaced one equation and kept the other, and the crossing never moved.', say: 'Every step replaced one equation and kept the other, and the crossing never moved.' },

  // ---------- 2. Worked example ----------
  'e.intro': { html: 'Four steps on Ana’s system. Press each step: the plane moves first, then the notation.', say: 'Four steps on Ana’s system. Press each step: the plane moves first, then the notation.' },
  'e.step0': { html: `Graph both lines. They cross near ${s('(4, 2)')}, but a graph only gives an <b>estimate</b>. To be exact we need algebra.`,
    say: 'Graph both lines. They cross near four, two, but a graph only gives an estimate. To be exact we need algebra.' },
  'e.step1': { html: `Multiply the WHOLE first equation by 2: ${s(`6${X} + 4${Y} = 32`)}. Every pair that fits ${a(`3${X} + 2${Y} = 16`)} fits this too: it is the <b>same line</b>, drawn dashed on top.`,
    say: 'Multiply the whole first equation by two: six x plus four y equals thirty-two. Every pair that fits three x plus two y equals sixteen fits this too: it is the same line, drawn dashed on top.' },
  'e.step2': { html: `Add it to the second: 4${Y} and −4${Y} cancel. ${s(`11${X} = 44`)}, so ${X} = 4. That new equation is the upright line ${X} = 4, and it goes through the <b>same crossing</b>.`,
    say: 'Add it to the second: four y and minus four y cancel. Eleven x equals forty-four, so x equals four. That new equation is the upright line x equals four, and it goes through the same crossing.' },
  'e.step3': { html: `Back-substitute: 3(4) + 2${Y} = 16, so ${Y} = 2. The solution is the pair ${s('(4, 2)')}. Check it in the equation we did not use: 5(4) − 4(2) = 12 ✓.`,
    say: 'Back-substitute: three times four plus two y equals sixteen, so y equals two. The solution is the pair four, two. Check it in the equation we did not use: five times four minus four times two is twelve. It checks.' },
  'e.why': { html: `Quick check: why does the line ${X} = 4 pass through the same crossing?`, say: 'Quick check: why does the line x equals four pass through the same crossing?' },
  'e.why.ok': { html: '(4, 2) makes both equations true, so it makes their sum true too. Any equation built this way passes through the crossing.', say: 'Four, two makes both equations true, so it makes their sum true too. Any equation built this way passes through the crossing.' },
  'e.why.icpt': { html: `The amber line meets the ${X}-axis at 16/3, not at 4. The crossing is on ${X} = 4 because it fits both equations.`, say: 'The amber line meets the x-axis at sixteen thirds, not at four. The crossing is on x equals four because it fits both equations.' },
  'e.why.luck': { html: 'It never misses: a pair that makes both equations true makes every sum of them true.', say: 'It never misses: a pair that makes both equations true makes every sum of them true.' },

  // ---------- 3. Your turn ----------
  't.intro': { html: `Your turn: ${a(`4${X} + 3${Y} = 5`)} and ${b(`3${X} − 2${Y} = 8`)}. Done for you: eliminate ${Y}, because +3${Y} and −2${Y} already have opposite signs.`,
    say: 'Your turn: four x plus three y equals five, and three x minus two y equals eight. Done for you: eliminate y, because plus three y and minus two y already have opposite signs.' },
  't.mult': { html: `Which multipliers turn 3${Y} and −2${Y} into opposites?`, say: 'Which multipliers turn three y and minus two y into opposites?' },
  't.mult.ok': { html: `Yes: 6${Y} and −6${Y}. They cancel when you add.`, say: 'Yes: six y and minus six y. They cancel when you add.' },
  't.mult.swap': { html: `Then the ${Y}-terms are 9${Y} and −4${Y}: they do not cancel. Multiply each equation by the OTHER one’s coefficient.`, say: 'Then the y-terms are nine y and minus four y: they do not cancel. Multiply each equation by the other one’s coefficient.' },
  't.mult.one': { html: `Then the ${Y}-terms are 6${Y} and −2${Y}: they do not cancel. The second equation needs a multiplier too.`, say: 'Then the y-terms are six y and minus two y: they do not cancel. The second equation needs a multiplier too.' },
  't.x': { html: `Add the new equations, 8${X} + 6${Y} = 10 and 9${X} − 6${Y} = 24. What is ${X}?`, say: 'Add the new equations, eight x plus six y equals ten, and nine x minus six y equals twenty-four. What is x?' },
  't.x.ok': { html: `Yes: 17${X} = 34, so ${X} = 2.`, say: 'Yes: seventeen x equals thirty-four, so x equals two.' },
  't.x.stop': { html: `That is 17${X}. Divide by 17.`, say: 'That is seventeen x. Divide by seventeen.' },
  't.x.no': { html: `Add the left sides and the right sides: 17${X} = 34.`, say: 'Add the left sides and the right sides: seventeen x equals thirty-four.' },
  't.x.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.pair': { html: `Now find ${Y} and give the solution as a pair (${X}, ${Y}).`, say: 'Now find y and give the solution as a pair, x first, then y.' },
  't.pair.ok': { html: `Yes: ${s('(2, −1)')}. Check in the second: 3(2) − 2(−1) = 8 ✓.`, say: 'Yes: two, negative one. Check in the second: three times two, minus two times negative one, is eight. It checks.' },
  't.pair.rev': { html: `Swapped: ${X} comes first, and ${X} is 2.`, say: 'Swapped: x comes first, and x is two.' },
  't.pair.sign': { html: `Put ${X} = 2 into 4${X} + 3${Y} = 5: 8 + 3${Y} = 5, so 3${Y} = −3.`, say: 'Put x equals two into four x plus three y equals five: eight plus three y equals five, so three y equals negative three.' },
  't.pair.no': { html: `Put ${X} = 2 into one of the equations and solve for ${Y}.`, say: 'Put x equals two into one of the equations and solve for y.' },
  't.pair.empty': { html: 'Fill in both boxes.', say: 'Fill in both boxes.' },

  // ---------- 4. Prove it ----------
  'p.intro': { html: `Sam solves ${a(`2${X} − 3${Y} = 6`)} and ${b(`−4${X} + 6${Y} = −12`)}. He adds 2 × first to the second, gets ${s('0 = 0')}, and writes: “so ${X} = 0 and ${Y} = 0, the solution is (0, 0).” Is Sam right?`,
    say: 'Sam solves two x minus three y equals six, and negative four x plus six y equals negative twelve. He adds two times the first to the second, gets zero equals zero, and writes: so x is zero and y is zero, the solution is zero, zero. Is Sam right?' },
  'p.build': { html: 'Sam is wrong. Build the proof: pick the reason behind each claim.', say: 'Sam is wrong. Build the proof: pick the reason behind each claim.' },
  'p.test': { html: 'Test it first: put (0, 0) into the first equation. Then build the proof: pick the reason behind each claim.', say: 'Test it first: put zero, zero into the first equation. Then build the proof: pick the reason behind each claim.' },
  'p.c1': { html: `Right: 0 is not 6, so (0, 0) is not even on the amber line.`, say: 'Right: zero is not six, so zero, zero is not even on the amber line.' },
  'p.c2': { html: 'Right: the teal line lies exactly on the amber one. Two equations, one line.', say: 'Right: the teal line lies exactly on the amber one. Two equations, one line.' },
  'p.c3': { html: 'Right: (3, 0) and (6, 2) work, (1, 1) does not. Infinitely many solutions, all on one line.', say: 'Right: three, zero and six, two work, one, one does not. Infinitely many solutions, all on one line.' },
  'p.no.zero': { html: 'The letters cancelling does not make them 0: 0 = 0 says nothing about x or y.', say: 'The letters cancelling does not make them zero: zero equals zero says nothing about x or y.' },
  'p.no.every': { html: '0 = 0 is always true, but the first equation still has to hold: (1, 1) gives 2 − 3 = −1, not 6.', say: 'Zero equals zero is always true, but the first equation still has to hold: one, one gives two minus three, negative one, not six.' },
  'p.no.many': { html: 'Two different lines cross at most once. These are the SAME line.', say: 'Two different lines cross at most once. These are the same line.' },
  'p.no.other': { html: 'That reason belongs to another claim. Read the claim with the empty gap.', say: 'That reason belongs to another claim. Read the claim with the empty gap.' },
  'p.done': { html: `Proved: ${s(`every point of the line 2${X} − 3${Y} = 6`)} is a solution, and nothing else. Sam’s (0, 0) is not one of them.`, say: 'Proved: every point of the line two x minus three y equals six is a solution, and nothing else. Sam’s zero, zero is not one of them.' },
};
