// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours, the
// same as the balance: bags / x-terms teal, marbles / numbers amber, the answer lime), `say` is the same line written
// to be read aloud. pages/lessons/linear-equations/voice/lines.json holds the `say` texts (the test keeps them in step).
// No imports, so a plain `node --experimental-strip-types` can read it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const x = '<i>x</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question: 5x + 3 = x + 15
  'q.intro': { html: `Every bag holds the same number of marbles. ${b('5 bags')} and ${a('3 loose marbles')} balance ${b('1 bag')} and ${a('15 loose marbles')}.`, say: 'Every bag holds the same number of marbles. Five bags and three loose marbles balance one bag and fifteen loose marbles.' },
  'q.ask': { html: 'How many marbles are in one bag?', say: 'How many marbles are in one bag?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the balance moves first, then the algebra.', say: 'Four steps. Press each one. The balance moves first, then the algebra.' },
  'e.s1': { html: `One ${b('bag')} comes off each pan. Both pans lose the same amount, whatever is in a bag, so they stay level: ${b(`4${x}`)} + ${a('3')} = ${a('15')}.`, say: 'One bag comes off each pan. Both pans lose the same amount, whatever is in a bag, so they stay level. Four x plus three equals fifteen.' },
  'e.s2': { html: `Now ${a('3 loose marbles')} off both pans, still level: ${b(`4${x}`)} = ${a('12')}.`, say: 'Now three loose marbles off both pans, still level. Four x equals twelve.' },
  'e.s3': { html: `Split both pans into 4 equal rows. One bag balances 3 marbles: ${s(`${x} = 3`)}.`, say: 'Split both pans into four equal rows. One bag balances three marbles. x equals three.' },
  'e.s4': { html: `Put everything back and open the bags. Left: 5 · 3 + 3 = ${a('18')}. Right: 3 + 15 = ${a('18')}. Both sides match, so ${s(`${x} = 3`)} is right.`, say: 'Put everything back, and open the bags. Left: five times three, plus three, is eighteen. Right: three plus fifteen is eighteen. Both sides match, so x equals three is right.' },
  'e.why': { html: 'Quick check: why may a bag come off both pans, when nobody knows what is in it?', say: 'Quick check. Why may a bag come off both pans, when nobody knows what is in it?' },
  'e.w-ok': { html: `Yes. Whatever ${x} is, both sides lose the same amount, so equal sides stay equal.`, say: 'Yes. Whatever x is, both sides lose the same amount, so equal sides stay equal.' },
  'e.w-move': { html: 'That is the shortcut’s name, not the reason. Nothing moved across: one bag came off EACH pan.', say: "That is the shortcut's name, not the reason. Nothing moved across. One bag came off each pan." },
  'e.w-const': { html: `Bags may come off too. Whatever a bag holds, both pans lose the same, so the beam stays level for every ${x}.`, say: 'Bags may come off too. Whatever a bag holds, both pans lose the same, so the beam stays level for every x.' },
  // 3. Your turn: 3x + 11 = 5x + 3
  't.intro': { html: `Now ${b('3 bags')} and ${a('11 marbles')} balance ${b('5 bags')} and ${a('3 marbles')}. The first step is done for you.`, say: 'Now three bags and eleven marbles balance five bags and three marbles. The first step is done for you.' },
  't.s1': { html: `Done: ${b('3 bags')} off both pans. ${a('11')} = ${b(`2${x}`)} + ${a('3')}.`, say: 'Done. Three bags off both pans. Eleven equals two x plus three.' },
  't.move': { html: 'Your step: what comes off next, so the bags are alone?', say: 'Your step. What comes off next, so the bags are alone?' },
  't.m-ok': { html: `Yes: ${a('3 marbles')} off both pans. ${a('8')} = ${b(`2${x}`)}.`, say: 'Yes. Three marbles off both pans. Eight equals two x.' },
  't.m-one': { html: 'Watch: only the right pan lost marbles, so the balance tips. Take the same off both pans.', say: 'Watch. Only the right pan lost marbles, so the balance tips. Take the same off both pans.' },
  't.m-11': { html: 'The right pan has only 3 loose marbles. Take off what both pans can lose: 3.', say: 'The right pan has only three loose marbles. Take off what both pans can lose: three.' },
  't.x': { html: `${b('2 bags')} balance ${a('8 marbles')}. How many marbles are in one bag?`, say: 'Two bags balance eight marbles. How many marbles are in one bag?' },
  't.x-ok': { html: `Yes: 8 in 2 equal rows is 4. ${s(`4 = ${x}`)}, the same as ${x} = 4.`, say: 'Yes. Eight in two equal rows is four. Four equals x, the same as x equals four.' },
  't.x-16': { html: '16 is 8 times 2. Undo the times 2: split the 8 into 2 equal rows.', say: 'Sixteen is eight times two. Undo the times two: split the eight into two equal rows.' },
  't.x-8': { html: '8 balances BOTH bags. One bag balances one row.', say: 'Eight balances both bags. One bag balances one row.' },
  't.x-no': { html: 'Count one row: 8 marbles in 2 equal rows.', say: 'Count one row: eight marbles in two equal rows.' },
  't.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.check': { html: `Check it in the ORIGINAL equation: what is each side worth when ${x} = 4?`, say: 'Check it in the original equation. What is each side worth, when x equals four?' },
  't.c-ok': { html: `Yes: both sides are ${a('23')}. ${s(`${x} = 4`)} is right.`, say: 'Yes. Both sides are twenty-three. x equals four is right.' },
  't.c-one': { html: 'Work out the right side too: 5 · 4 + 3. Both whole sides count.', say: 'Work out the right side too: five times four, plus three. Both whole sides count.' },
  't.c-no': { html: 'Left: 3 · 4 + 11. Right: 5 · 4 + 3. Work out each one.', say: 'Left: three times four, plus eleven. Right: five times four, plus three. Work out each one.' },
  't.cb-right': { html: `At the start you picked 3, and you were right. Now you can show why: the same bag off both pans.`, say: 'At the start you picked three, and you were right. Now you can show why: the same bag off both pans.' },
  't.cb-sign': { html: `At the start you picked 2. That adds the bag on the right to the left side. It comes off BOTH pans instead: ${b(`4${x}`)}, not 6${x}.`, say: 'At the start you picked two. That adds the bag on the right to the left side. It comes off both pans instead: four x, not six x.' },
  't.cb-cant': { html: 'At the start you said you can’t tell, with bags on both pans. You can: take the same bags off both pans.', say: "At the start you said you can't tell, with bags on both pans. You can: take the same bags off both pans." },
  // 4. Prove it: Jordan, 2x + 5 = 2x + 9
  'p.intro': { html: `Jordan solves ${b(`2${x}`)} + ${a('5')} = ${b(`2${x}`)} + ${a('9')}: “Subtract 2${x} from both sides: 5 = 9. The ${x}’s are gone, so ${x} = 0.”`, say: "Jordan solves two x plus five equals two x plus nine. Subtract two x from both sides: five equals nine. The x's are gone, so x equals zero." },
  'p.ask': { html: 'Is Jordan right?', say: 'Is Jordan right?' },
  'p.build': { html: 'Prove it. Fill each “because” with the reason that makes the line true.', say: 'Prove it. Fill each because, with the reason that makes the line true.' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.k1': { html: `Taking ${b('2 bags')} off both pans gives 5 = 9,`, say: 'Taking two bags off both pans gives five equals nine,' },
  'p.k2': { html: `and 5 = 9 is false whatever ${x} is,`, say: 'and five equals nine is false, whatever x is,' },
  'p.k3': { html: `so the equation has ${s('no solution')}, and ${x} = 0 is not one.`, say: 'so the equation has no solution, and x equals zero is not one.' },
  'p.c1': { html: 'Right. Both pans lose 2 bags: the beam stays tipped exactly as before.', say: 'Right. Both pans lose two bags. The beam stays tipped, exactly as before.' },
  'p.c2': { html: `Right. Try any number in the bags: the right pan is always ${a('4 marbles')} heavier.`, say: 'Right. Try any number in the bags. The right pan is always four marbles heavier.' },
  'p.c3': { html: `Right. At ${x} = 0 the sides are 5 and 9. No number works: ${s('no solution')}.`, say: 'Right. At x equals zero, the sides are five and nine. No number works. No solution.' },
  'p.w-zero': { html: 'That is Jordan’s slip. When the x’s cancel, read what is left: 5 = 9 is false, so NO number works.', say: "That is Jordan's slip. When the x's cancel, read what is left. Five equals nine is false, so no number works." },
  'p.w-err': { html: 'Nothing went wrong: every step was fine. Some equations have no solution.', say: 'Nothing went wrong. Every step was fine. Some equations have no solution.' },
  'p.w-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: every step kept the solutions, and the last line is never true. No solution is not the same as ${x} = 0.`, say: "That's a proof. Every step kept the solutions, and the last line is never true. No solution is not the same as x equals zero." },
};
