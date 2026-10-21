// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = the bound / the other side, teal = the unknown's side, lime = the answer), `say` is the same line written to
// be read aloud; pages/lessons/one-step-inequalities/voice/lines.json holds the `say` texts (the test keeps the two in
// step). The page shows a line and calls ctx.say(id) with it.
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const x = '<i>x</i>', h = '<i>h</i>';
const LT = '&lt;', GT = '&gt;';

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `The temperature falls ${a('2 °F every hour')}. After ${h} hours the change is ${b(`−2${h} °F`)}.`, say: 'The temperature falls two degrees every hour. After h hours, the change is negative two h degrees.' },
  'q.ava': { html: `Ava writes ${b(`−2${h}`)} ${LT} ${a('−6')} for “it has fallen more than 6 °F”.`, say: 'Ava writes: negative two h is less than negative six. That means: it has fallen more than six degrees.' },
  'q.ask': { html: `Which numbers of hours ${h} make Ava's inequality true?`, say: "Which numbers of hours make Ava's inequality true?" },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The change ${b(`−2${h}`)} must be less than ${a('−6')}: every number to the LEFT of −6. That is more than 6 degrees down.`, say: 'The change, negative two h, must be less than negative six: every number to the left of negative six. That is more than six degrees down.' },
  'e.s2': { html: `Divide both sides by −2. The arrows cross: −8 was left of −6, but 4 lands RIGHT of 3. Dividing by a negative turns the line around, so ${LT} becomes ${GT}.`, say: 'Divide both sides by negative two. The arrows cross: negative eight was left of negative six, but four lands to the right of three. Dividing by a negative turns the line around, so less than becomes greater than.' },
  'e.s3': { html: `${s(`${h} ${GT} 3`)}: an open dot at 3, because 3 hours gives exactly −6, not less. Then every number to its right.`, say: 'h is greater than three: an open dot at three, because three hours gives exactly negative six, not less. Then every number to its right.' },
  'e.s4': { html: `Check: ${h} = 5 gives −10, and −10 ${LT} −6 is true. ${h} = 1 gives −2, and −2 ${LT} −6 is false. So: more than 3 hours.`, say: 'Check: five hours gives negative ten, and negative ten is less than negative six: true. One hour gives negative two, and negative two is less than negative six: false. So, more than three hours.' },
  'e.why': { html: `Quick check: why did ${LT} turn into ${GT}?`, say: 'Quick check: why did less than turn into greater than?' },
  'e.w-ok': { html: 'Yes. Dividing by a negative mirrors the line through 0: −8 is left of −6, but 4 is right of 3. Every pair swaps its order.', say: 'Yes. Dividing by a negative mirrors the line through zero: negative eight is left of negative six, but four is right of three. Every pair swaps its order.' },
  'e.w-any': { html: `Not the reason: ${x} + (−5) ${LT} −6 has negatives too, and its symbol stays. Only multiplying or dividing by a negative flips it.`, say: 'Not the reason: x plus negative five is less than negative six has negatives too, and its symbol stays. Only multiplying or dividing by a negative flips it.' },
  'e.w-small': { html: `Dividing by 2 makes numbers smaller too, but 8 ${LT} 12 stays 4 ${LT} 6. It is the negative sign that turns the line around.`, say: 'Dividing by two makes numbers smaller too, but eight is less than twelve stays four is less than six. It is the negative sign that turns the line around.' },
  // 3. Your turn
  't.intro': { html: `Now solve ${b(fr(x, '−3'))} ≥ ${a('2')}. The first step is done for you.`, say: 'Now solve: x divided by negative three is at least two. The first step is done for you.' },
  't.read': { html: `The top line shows ${b(fr(x, '−3'))}: the number ${a('2')} (filled dot, it is included) and every number to its right.`, say: 'The top line shows x divided by negative three: the number two, with a filled dot because it is included, and every number to its right.' },
  't.undo': { html: `What do you do to both sides to get ${x} alone?`, say: 'What do you do to both sides to get x alone?' },
  't.u-ok': { html: 'Yes: multiply both sides by −3. Watch where the numbers land.', say: 'Yes: multiply both sides by negative three. Watch where the numbers land.' },
  't.u-nosign': { html: `Keep the sign: ${x} was divided by −3, so multiply by −3, not by 3.`, say: 'Keep the sign: x was divided by negative three, so multiply by negative three, not by three.' },
  't.u-div': { html: 'Dividing again does not undo a division. To undo dividing, multiply.', say: 'Dividing again does not undo a division. To undo dividing, multiply.' },
  't.land': { html: `Follow the arrow from ${a('2')}. Where does it land?`, say: 'Follow the arrow from two. Where does it land?' },
  't.fill': { html: 'Type a number first (use - for a negative).', say: 'Type a number first.' },
  't.l-ok': { html: `Yes: 2 × (−3) = ${s('−6')}.`, say: 'Yes: two times negative three is negative six.' },
  't.l-nosign': { html: '2 × 3 = 6, but you multiply by −3: 2 × (−3) = −6.', say: 'Two times three is six, but you multiply by negative three. Two times negative three is negative six.' },
  't.l-other': { html: 'Multiply 2 by −3: a positive times a negative is negative.', say: 'Multiply two by negative three: a positive times a negative is negative.' },
  't.sym': { html: 'So which numbers are the solutions?', say: 'So which numbers are the solutions?' },
  't.s-ok': { html: `Yes: ${s(`${x} ≤ −6`)}. A filled dot at −6 (it is included) and every number to its LEFT.`, say: 'Yes: x is at most negative six. A filled dot at negative six, because it is included, and every number to its left.' },
  't.s-keep': { html: 'Look at the arrows: the numbers right of 2 landed LEFT of −6. Multiplying by a negative reverses the symbol.', say: 'Look at the arrows: the numbers to the right of two landed to the left of negative six. Multiplying by a negative reverses the symbol.' },
  't.s-eq': { html: '−6 is only the boundary. Every number to the left of −6 works too.', say: 'Negative six is only the boundary. Every number to the left of negative six works too.' },
  't.s-strict': { html: `≥ includes the boundary: ${x} = −6 gives 2, and 2 ≥ 2 is true. Keep the “or equal”.`, say: 'At least includes the boundary: x equals negative six gives two, and two is at least two. Keep the or equal.' },
  't.test': { html: `Test a value on the other side: is ${x} = 0 a solution?`, say: 'Test a value on the other side: is x equal to zero a solution?' },
  't.t-ok': { html: `Right: 0 ÷ (−3) = 0, and 0 ≥ 2 is false. And ${x} = −9 gives 3, and 3 ≥ 2 is true. The answer checks out.`, say: 'Right: zero divided by negative three is zero, and zero is at least two is false. And negative nine gives three, and three is at least two is true. The answer checks out.' },
  't.t-no': { html: 'Put it in: 0 ÷ (−3) = 0, and 0 ≥ 2 is false. So 0 is not a solution, just as the graph says.', say: 'Put it in: zero divided by negative three is zero, and zero is at least two is false. So zero is not a solution, just as the graph says.' },
  't.cb-right': { html: `At the start you picked ${h} ${GT} 3, and you were right. Now you know why the symbol turned.`, say: 'At the start you picked h greater than three, and you were right. Now you know why the symbol turned.' },
  't.cb-keep': { html: `At the start you picked ${h} ${LT} 3: that keeps the symbol. Dividing by −2 reverses it: ${s(`${h} ${GT} 3`)}, more than 3 hours.`, say: 'At the start you picked h less than three: that keeps the symbol. Dividing by negative two reverses it: h greater than three, more than three hours.' },
  't.cb-eq': { html: `At the start you picked ${h} = 3: that is only the boundary. Every time after 3 hours works: ${s(`${h} ${GT} 3`)}.`, say: 'At the start you picked h equals three: that is only the boundary. Every time after three hours works: h greater than three.' },
  // 4. Prove it
  'p.intro': { html: `Jordan solves ${b(`−3 + ${x}`)} ≤ ${a('5')} and writes: “There is a negative, so I flip the symbol: ${x} ≥ 8.”`, say: 'Jordan solves negative three plus x is at most five, and writes: there is a negative, so I flip the symbol. x is at least eight.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'To undo the −3, add 3 to both sides,', say: 'To undo the negative three, add three to both sides,' },
  'p.c2': { html: `so the order stays: ${s(`${x} ≤ 8`)},`, say: 'so the order stays: x is at most eight,' },
  'p.c3': { html: `and Jordan's ${x} ≥ 8 is wrong,`, say: "and Jordan's answer, x is at least eight, is wrong," },
  'p.x-any': { html: "That is Jordan's idea, the one being tested. A negative number in the problem does not flip the symbol.", say: "That is Jordan's idea, the one being tested. A negative number in the problem does not flip the symbol." },
  'p.x-add': { html: 'Watch the arrows: adding 3 slides every number the same way. The order stays.', say: 'Watch the arrows: adding three slides every number the same way. The order stays.' },
  'p.x-boundary': { html: '8 is the boundary of both answers, so it cannot tell them apart. Test a value on one side.', say: 'Eight is the boundary of both answers, so it cannot tell them apart. Test a value on one side.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: three claims, each with its reason, and the number line backs every one. Only multiplying or dividing by a negative reverses the symbol.", say: "That's a proof: three claims, each with its reason, and the number line backs every one. Only multiplying or dividing by a negative reverses the symbol." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
