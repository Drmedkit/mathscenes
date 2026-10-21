// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the number you start from, b = the number added or taken away, pk = its flipped opposite, s = where you land);
// `say` is the same line written to be read aloud. pages/lessons/add-subtract-rational-numbers/voice/lines.json holds
// the `say` texts (the test keeps the two in step). The page shows a line and calls ctx.say(id) with it.

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`;
const s = (x: string) => `<b class="s">${x}</b>`, pk = (x: string) => `<b class="pk">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `In a quiz game, a wrong answer scores ${b('−3 points')}. You have ${a('4 points')}. Then the host finds that one of your “wrong” answers was right after all, and takes that ${b('−3')} away.`, say: 'In a quiz game, a wrong answer scores minus three points. You have four points. Then the host finds that one of your wrong answers was right after all, and takes that minus three away.' },
  'q.ask': { html: `Your new score is ${a('4')} − ${b('(−3)')}. What is it?`, say: 'Your new score is four minus negative three. What is it?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example: 4 - (-3)
  'e.intro': { html: 'Four steps. Press each one: the number line moves first, then the notation.', say: 'Four steps. Press each one: the number line moves first, then the notation.' },
  'e.s1': { html: `Adding ${b('−3')} would move 3 to the left: from ${a('4')} to 1.`, say: 'Adding negative three would move three to the left: from four to one.' },
  'e.s2': { html: `But the ${b('−3')} is taken AWAY. Taking it away undoes that move, so the arrow flips: ${pk('3 to the right')}.`, say: 'But the minus three is taken away. Taking it away undoes that move, so the arrow flips: three to the right.' },
  'e.s3': { html: `You land on ${s('7')}. ${a('4')} − ${b('(−3)')} = ${a('4')} + ${pk('3')} = ${s('7')}: taking away a number is adding its opposite.`, say: 'You land on seven. Four minus negative three is four plus three, which is seven. Taking away a number is adding its opposite.' },
  'e.s4': { html: `Check: add the ${b('−3')} back. ${s('7')} + ${b('(−3)')} = ${a('4')}, the score you started with.`, say: 'Check: add the minus three back. Seven plus negative three is four, the score you started with.' },
  'e.why': { html: 'Quick check: why does taking away −3 move to the right?', say: 'Quick check: why does taking away negative three move to the right?' },
  'e.w-ok': { html: 'Yes. Taking away undoes adding. Adding −3 moves left, so taking it away moves right.', say: 'Yes. Taking away undoes adding. Adding negative three moves left, so taking it away moves right.' },
  'e.w-two': { html: '“Two negatives make a positive” is a rule for multiplying. In a sum, −3 + (−4) is −7, not 7. The reason here is the flip.', say: 'Two negatives make a positive is a rule for multiplying. In a sum, negative three plus negative four is negative seven, not seven. The reason here is the flip.' },
  'e.w-left': { html: 'Then 4 − (−3) would be 1. But losing a penalty can only raise your score: the move is to the right.', say: 'Then four minus negative three would be one. But losing a penalty can only raise your score: the move is to the right.' },
  // 3. Your turn: -2 - (-6)
  't.intro': { html: `Now you have ${a('−2 points')}, and the host takes away a ${b('−6')} penalty. Your score is ${a('−2')} − ${b('(−6)')}. The first step is done for you.`, say: 'Now you have minus two points, and the host takes away a minus six penalty. Your score is negative two minus negative six. The first step is done for you.' },
  't.s1': { html: `Adding ${b('−6')} would move 6 to the left: from ${a('−2')} to −8.`, say: 'Adding negative six would move six to the left: from negative two to negative eight.' },
  't.flip': { html: 'Your step: the −6 is taken away. Which way does the arrow point now?', say: 'Your step. The minus six is taken away. Which way does the arrow point now?' },
  't.f-ok': { html: `Yes: taking it away undoes the move, so the arrow flips: ${pk('6 to the right')}.`, say: 'Yes. Taking it away undoes the move, so the arrow flips: six to the right.' },
  't.f-left': { html: 'Subtracting does not always mean left. Taking away −6 undoes a move to the left, and that is a move to the right.', say: 'Subtracting does not always mean left. Taking away negative six undoes a move to the left, and that is a move to the right.' },
  't.land': { html: 'Where does the flipped arrow land? Type the number.', say: 'Where does the flipped arrow land? Type the number.' },
  't.l-ok': { html: `Yes: ${a('−2')} − ${b('(−6)')} = ${a('−2')} + ${pk('6')} = ${s('4')}.`, say: 'Yes. Negative two minus negative six is negative two plus six, which is four.' },
  't.l-before': { html: 'That is where the arrow pointed BEFORE the flip. Taking −6 away flips it: count 6 to the right of −2.', say: 'That is where the arrow pointed before the flip. Taking negative six away flips it: count six to the right of negative two.' },
  't.l-both': { html: 'Only the number taken away changes sign. The −2 stays: −2 + 6.', say: 'Only the number taken away changes sign. The negative two stays: negative two plus six.' },
  't.l-other': { html: 'Count 6 to the right from −2: two steps reach 0, then four more.', say: 'Count six to the right from negative two: two steps reach zero, then four more.' },
  't.check': { html: 'Last step: which addition checks the answer?', say: 'Last step: which addition checks the answer?' },
  't.c-ok': { html: `Yes: add the ${b('−6')} back to ${s('4')} and you are at ${a('−2')} again. The answer checks out.`, say: 'Yes. Add the minus six back to four, and you are at negative two again. The answer checks out.' },
  't.c-pair': { html: 'That adds the answer to the first number. Add back the number taken away: 4 + (−6) = −2.', say: 'That adds the answer to the first number. Add back the number taken away: four plus negative six is negative two.' },
  't.c-again': { html: 'Doing the same subtraction again can repeat the same slip. Undo it instead: 4 + (−6) = −2.', say: 'Doing the same subtraction again can repeat the same slip. Undo it instead: four plus negative six is negative two.' },
  't.cb-right': { html: `At the start you picked 7, and you were right. Now you can show why: taking away ${b('−3')} flips the move.`, say: 'At the start you picked seven, and you were right. Now you can show why: taking away negative three flips the move.' },
  't.cb-one': { html: `At the start you picked 1: that moves left for every minus sign. Taking away ${b('−3')} flips the move, so 4 − (−3) = ${s('7')}.`, say: 'At the start you picked one: that moves left for every minus sign. Taking away negative three flips the move, so four minus negative three is seven.' },
  't.cb-m7': { html: `At the start you picked −7: that adds the sizes and keeps a minus sign. Losing a penalty raises the score: 4 − (−3) = ${s('7')}.`, say: 'At the start you picked negative seven: that adds the sizes and keeps a minus sign. Losing a penalty raises the score: four minus negative three is seven.' },
  't.cb-sure': { html: 'You were sure, and changing your mind after being sure is exactly how this sticks.', say: 'You were sure, and changing your mind after being sure is exactly how this sticks.' },
  // 4. Prove it: "subtracting always makes a number smaller"
  'p.intro': { html: 'Sam says: “Subtracting always makes a number smaller.”', say: 'Sam says: subtracting always makes a number smaller.' },
  'p.ask': { html: 'Is Sam’s claim always true, sometimes true, or never true?', say: "Is Sam's claim always true, sometimes true, or never true?" },
  'p.j-ok': { html: 'Sometimes. Now prove it: fill each “because” with the reason that makes the line true.', say: 'Sometimes. Now prove it: fill each because with the reason that makes the line true.' },
  'p.j-test': { html: 'Let’s test it. Build the argument and see where it leads.', say: "Let's test it. Build the argument and see where it leads." },
  'p.c1': { html: `${a('5')} − ${b('2')} = ${s('3')} is smaller than 5,`, say: 'Five minus two is three, which is smaller than five,' },
  'p.c2': { html: `but ${a('5')} − ${b('(−2)')} = ${s('7')} is bigger than 5,`, say: 'but five minus negative two is seven, which is bigger than five,' },
  'p.c3': { html: 'so Sam’s claim is only <b>sometimes</b> true.', say: "so Sam's claim is only sometimes true." },
  'p.x-left': { html: 'That is the idea being tested, and the line disproves it: taking away −2 moves right.', say: 'That is the idea being tested, and the line disproves it: taking away negative two moves right.' },
  'p.x-examples': { html: 'One example that works does not prove a rule for every number. One example that fails does disprove it.', say: 'One example that works does not prove a rule for every number. One example that fails does disprove it.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: 'That’s a proof: two cases on the number line, and the one that fails settles it. Subtracting makes a number smaller only when the number taken away is positive.', say: "That's a proof: two cases on the number line, and the one that fails settles it. Subtracting makes a number smaller only when the number taken away is positive." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
