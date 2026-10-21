// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// the variable term teal, the numbers and the bound amber, the answer lime), `say` is the same line written to be
// read aloud. pages/lessons/two-step-inequalities/voice/lines.json holds the `say` texts (the test keeps the two in
// step). The page shows a line and calls ctx.say(id) with it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const M = '&minus;', h = '<i>h</i>', x = '<i>x</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A new freezer is switched on at ${a('50 °F')}. It cools ${b('6 °F every hour')}.`, say: 'A new freezer is switched on at fifty degrees Fahrenheit. It cools six degrees every hour.' },
  'q.ask': { html: `After ${h} hours it is ${b(`50 ${M} 6${h}`)} °F. For which hours is it ${a('colder than 8 °F')}? That is ${b(`50 ${M} 6${h}`)} &lt; ${a('8')}.`, say: 'After h hours it is fifty minus six h degrees. For which hours is it colder than eight degrees? That is, fifty minus six h is less than eight.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the number lines move first, then the notation.', say: 'Four steps. Press each one: the number lines move first, then the notation.' },
  'e.s1': { html: `The top line holds temperatures. ${b(`50 ${M} 6${h}`)} must be ${a('below 8')}: an open dot at 8 (8 °F is not colder than 8 °F), shaded to the left.`, say: 'The top line holds temperatures. Fifty minus six h must be below eight: an open dot at eight, because eight degrees is not colder than eight degrees, shaded to the left.' },
  'e.s2': { html: `Subtract 50 from both sides. Every number slides 50 to the left: the arrows run side by side, nothing passes anything. ${b(`${M}6${h}`)} &lt; ${a(`${M}42`)}: the symbol stays.`, say: 'Subtract fifty from both sides. Every number slides fifty to the left: the arrows run side by side, and nothing passes anything. Negative six h is less than negative forty-two: the symbol stays.' },
  'e.s3': { html: `Divide both sides by ${M}6. The arrows cross: dividing by a negative mirrors every number through 0, so the order turns around. ${s(`${h} &gt; 7`)}.`, say: 'Divide both sides by negative six. The arrows cross: dividing by a negative mirrors every number through zero, so the order turns around. h is greater than seven.' },
  'e.s4': { html: `Test it. ${h} = 9: 50 ${M} 54 = ${M}4, and ${M}4 &lt; 8 ✓. ${h} = 5: 50 ${M} 30 = 20, not less than 8 ✗. The ray is on the right side: ${s(`${h} &gt; 7`)}.`, say: 'Test it. h equals nine: fifty minus fifty-four is negative four, and negative four is less than eight. Check. h equals five: fifty minus thirty is twenty, not less than eight. So the ray is on the right side: h is greater than seven.' },
  'e.why': { html: `Quick check: why did &lt; turn into &gt;?`, say: 'Quick check: why did less than turn into greater than?' },
  'e.w-ok': { html: 'Yes. A negative factor swaps the order of every pair of numbers, so the symbol has to turn too.', say: 'Yes. A negative factor swaps the order of every pair of numbers, so the symbol has to turn too.' },
  'e.w-neg': { html: `A minus sign showing is not the reason. Subtracting 50 had a minus too, and the symbol stayed.`, say: 'A minus sign showing is not the reason. Subtracting fifty had a minus too, and the symbol stayed.' },
  'e.w-sub': { html: 'Look at the first move: the arrows ran side by side and the symbol stayed. Only the division by −6 turned it.', say: 'Look at the first move: the arrows ran side by side, and the symbol stayed. Only the division by negative six turned it.' },
  // 3. Your turn
  't.intro': { html: `Your turn: ${b(`${M}3${x} + 4`)} ≤ ${a('19')}. The first two steps are done for you.`, say: 'Your turn: negative three x plus four is less than or equal to nineteen. The first two steps are done for you.' },
  't.land': { html: `Now divide both sides by ${M}3. Where does ${a('15')} land? 15 ÷ (${M}3) = ?`, say: 'Now divide both sides by negative three. Where does fifteen land? Fifteen divided by negative three is what?' },
  't.fill': { html: 'Type a number first.', say: 'Type a number first.' },
  't.l-ok': { html: `Yes: 15 ÷ (${M}3) = ${a(`${M}5`)}. The boundary lands on ${M}5. Watch where the other numbers go.`, say: 'Yes: fifteen divided by negative three is negative five. The boundary lands on negative five. Watch where the other numbers go.' },
  't.l-sign': { html: `Dividing a positive by a negative gives a negative: 15 ÷ (${M}3) = ${M}5, not 5.`, say: 'Dividing a positive by a negative gives a negative: fifteen divided by negative three is negative five, not five.' },
  't.l-no': { html: `What times ${M}3 makes 15? That is where 15 lands.`, say: 'What times negative three makes fifteen? That is where fifteen lands.' },
  't.sym': { html: 'The arrows crossed. Which is the solution set?', say: 'The arrows crossed. Which is the solution set?' },
  't.s-ok': { html: `Yes: the order turned, and the “or equal” stays. ${s(`${x} ≥ ${M}5`)}.`, say: 'Yes: the order turned, and the or equal stays. x is greater than or equal to negative five.' },
  't.s-keep': { html: 'Look at the arrows: they crossed, so the ray turns around.', say: 'Look at the arrows: they crossed, so the ray turns around.' },
  't.s-incl': { html: `Turning the symbol keeps the “or equal”: ${M}5 itself still works.`, say: 'Turning the symbol keeps the or equal: negative five itself still works.' },
  't.s-only': { html: `${M}5 is only the boundary. A whole ray of numbers works.`, say: 'Negative five is only the boundary. A whole ray of numbers works.' },
  't.test': { html: `Test a value on the other side: ${x} = ${M}7. What is ${M}3(${M}7) + 4?`, say: 'Test a value on the other side: x equals negative seven. What is negative three times negative seven, plus four?' },
  't.t-ok': { html: `25. Is 25 ≤ 19? No: ${M}7 is not a solution, just as ${s(`${x} ≥ ${M}5`)} says. And ${x} = ${M}3 gives 13 ≤ 19 ✓.`, say: 'Twenty-five. Is twenty-five less than or equal to nineteen? No: negative seven is not a solution, just as x greater than or equal to negative five says. And x equals negative three gives thirteen, which is less than nineteen. Check.' },
  't.t-sign': { html: `A negative times a negative is positive: ${M}3 × (${M}7) = 21. Then add 4.`, say: 'A negative times a negative is positive: negative three times negative seven is twenty-one. Then add four.' },
  't.t-no': { html: `Multiply first: ${M}3 × (${M}7) = 21, then add 4.`, say: 'Multiply first: negative three times negative seven is twenty-one, then add four.' },
  't.cb-right': { html: `At the start you picked ${h} &gt; 7, and you were right. Now you can show why: the arrows cross when you divide by a negative.`, say: 'At the start you picked h greater than seven, and you were right. Now you can show why: the arrows cross when you divide by a negative.' },
  't.cb-keep': { html: `At the start you picked ${h} &lt; 7. That keeps the symbol, but dividing by ${M}6 turns it: after 7 hours the freezer is colder than 8 °F.`, say: 'At the start you picked h less than seven. That keeps the symbol, but dividing by negative six turns it: after seven hours the freezer is colder than eight degrees.' },
  't.cb-only': { html: `At the start you picked ${h} = 7. At 7 hours it is exactly 8 °F, not colder. Every time after that works: ${h} &gt; 7.`, say: 'At the start you picked h equals seven. At seven hours it is exactly eight degrees, not colder. Every time after that works: h is greater than seven.' },
  't.cb-none': { html: 'Find the boundary, carry the symbol through every step, and turn it only when you multiply or divide by a negative.', say: 'Find the boundary, carry the symbol through every step, and turn it only when you multiply or divide by a negative.' },
  // 4. Prove it
  'p.intro': { html: `Jordan solves ${b(`2${x} ${M} 5`)} &gt; ${a(`${M}11`)}: add 5, so 2${x} &gt; ${M}6; divide by 2, so <b>${x} &lt; ${M}3</b>. “I turned the symbol because the numbers are negative.” Is Jordan right?`, say: 'Jordan solves two x minus five is greater than negative eleven. Add five: two x is greater than negative six. Divide by two: x is less than negative three. Jordan says: I turned the symbol because the numbers are negative. Is Jordan right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `Adding 5 to both sides keeps the order: 2${x} &gt; ${M}6,`, say: 'Adding five to both sides keeps the order: two x is greater than negative six,' },
  'p.c2': { html: `dividing both sides by 2 keeps it too: ${s(`${x} &gt; ${M}3`)},`, say: 'dividing both sides by two keeps it too: x is greater than negative three,' },
  'p.c3': { html: `so Jordan’s ${x} &lt; ${M}3 is wrong,`, say: 'so Jordan’s answer, x less than negative three, is wrong,' },
  'p.x-neg': { html: 'A negative number showing is not a reason. Only multiplying or dividing by a negative turns the symbol.', say: 'A negative number showing is not a reason. Only multiplying or dividing by a negative turns the symbol.' },
  'p.x-add': { html: 'Look at the arrows for + 5: they run side by side. Adding never turns the order.', say: 'Look at the arrows for plus five: they run side by side. Adding never turns the order.' },
  'p.x-only': { html: `${M}3 is only the boundary. The question is which side of it works.`, say: 'Negative three is only the boundary. The question is which side of it works.' },
  'p.x-one': { html: 'One test that works is not enough. Test a value in Jordan’s set too.', say: 'One test that works is not enough. Test a value in Jordan’s set too.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the number lines back every one. Jordan turned the symbol without dividing by a negative.', say: 'That’s a proof: three claims, each with its reason, and the number lines back every one. Jordan turned the symbol without dividing by a negative.' },
};
