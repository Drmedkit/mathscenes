// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours),
// `say` is the same line written to be read aloud; pages/lessons/multiply-divide-rational-numbers/voice/lines.json
// holds the `say` texts (the test keeps the two in step). The page shows a line with ctx.say(id) next to it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const M = '&minus;';

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A diver swims down at a steady pace: her height changes by ${a(`${M}4 ft every minute`)}.`, say: 'A diver swims down at a steady pace: her height changes by negative four feet every minute.' },
  'q.ask': { html: `Right now she is at the marker. Compared with now, where was she ${b('3 minutes ago')}?`, say: 'Right now she is at the marker. Compared with now, where was she three minutes ago?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Every minute is one equal jump of ${a(`${M}4 ft`)}: 4 ft down.`, say: 'Every minute is one equal jump of negative four feet: four feet down.' },
  'e.s2': { html: `Later is positive time. In ${b('3')} minutes she makes 3 jumps of ${a(`${M}4`)}: ${b('3')} × ${a(`(${M}4)`)} = ${s(`${M}12`)}. One negative factor: a negative product.`, say: 'Later is positive time. In three minutes she makes three jumps of negative four: three times negative four is negative twelve. One negative factor: a negative product.' },
  'e.s3': { html: `Earlier is negative time. The 3 jumps before now brought her DOWN to the marker, so ${b('3 minutes ago')} she was 12 ft higher: ${b(`(${M}3)`)} × ${a(`(${M}4)`)} = ${s('12')}.`, say: 'Earlier is negative time. The three jumps before now brought her down to the marker, so three minutes ago she was twelve feet higher: negative three times negative four is twelve.' },
  'e.s4': { html: `Division undoes it: ${s('12')} ÷ ${b(`(${M}3)`)} = ${a(`${M}4`)}, because (${M}3) × (${M}4) = 12. Same signs: positive. Different signs: negative.`, say: 'Division undoes it: twelve divided by negative three is negative four, because negative three times negative four is twelve. Same signs: positive. Different signs: negative.' },
  'e.why': { html: `Quick check: why is (${M}3) × (${M}4) positive?`, say: 'Quick check: why is negative three times negative four positive?' },
  'e.w-ok': { html: 'Yes. Going back 3 minutes undoes 3 drops of 4 ft, so she was 12 ft higher than now.', say: 'Yes. Going back three minutes undoes three drops of four feet, so she was twelve feet higher than now.' },
  'e.w-add': { html: `Careful: two negatives ADDED stay negative, (${M}3) + (${M}4) = ${M}7. The picture shows why the PRODUCT is positive.`, say: 'Careful: two negatives added stay negative, negative three plus negative four is negative seven. The picture shows why the product is positive.' },
  'e.w-rule': { html: 'It has a reason: going back in time undoes the drops, so she was 12 ft higher.', say: 'It has a reason: going back in time undoes the drops, so she was twelve feet higher.' },
  // 3. Your turn
  't.intro': { html: `A cold front: the temperature changes by ${a(`${M}1.5 °F every hour`)}. It is 30 °F now. The first two steps are done for you.`, say: 'A cold front: the temperature changes by negative one point five degrees every hour. It is thirty degrees now. The first two steps are done for you.' },
  't.count': { html: `Your step: compared with now, how much warmer (+) or colder (${M}) was it ${b('4 hours ago')}?`, say: 'Your step: compared with now, how much warmer or colder was it four hours ago? Warmer is plus, colder is minus.' },
  't.fill': { html: 'Type a number. Use a minus sign for colder.', say: 'Type a number. Use a minus sign for colder.' },
  't.c-ok': { html: `Yes: the 4 drops of 1.5 °F came AFTER, so 4 hours ago it was ${s('6 °F warmer')}: +6.`, say: 'Yes: the four drops of one point five degrees came after, so four hours ago it was six degrees warmer: plus six.' },
  't.c-neg': { html: `Look at the jumps: they lead DOWN to now. Before them it was warmer, so the change is +6, not ${M}6.`, say: 'Look at the jumps: they lead down to now. Before them it was warmer, so the change is plus six, not negative six.' },
  't.c-add': { html: `That adds ${M}4 and ${M}1.5. Four hours of ${M}1.5 °F each is a product.`, say: 'That adds negative four and negative one point five. Four hours of negative one point five degrees each is a product.' },
  't.c-other': { html: 'Count the jumps from 4 hours ago to now: 4 jumps of 1.5 °F each.', say: 'Count the jumps from four hours ago to now: four jumps of one point five degrees each.' },
  't.write': { html: 'Tap the chips to write it as one multiplication.', say: 'Tap the chips to write it as one multiplication.' },
  't.w-ok': { html: `Yes: ${b(`(${M}4)`)} × ${a(`(${M}1.5)`)} = ${s('6')}. Two negative factors, a positive product.`, say: 'Yes: negative four times negative one point five is six. Two negative factors, a positive product.' },
  't.w-add': { html: 'That adds. Four hours of the same change is times.', say: 'That adds. Four hours of the same change is times.' },
  't.w-later': { html: `4 × (${M}1.5) is 4 hours from NOW: ${M}6. Hours ago are negative time: (${M}4).`, say: 'Four times negative one point five is four hours from now: negative six. Hours ago are negative time: negative four.' },
  't.w-other': { html: 'Use the time (hours ago are negative) and the change per hour.', say: 'Use the time, where hours ago are negative, and the change per hour.' },
  't.div': { html: `Now divide: ${s('6')} ÷ ${b(`(${M}4)`)} = ? Use the multiplication you just wrote.`, say: 'Now divide: six divided by negative four. Use the multiplication you just wrote.' },
  't.d-ok': { html: `Right: (${M}4) × (${M}1.5) = 6, so 6 ÷ (${M}4) = ${a(`${M}1.5`)}, the change per hour. Different signs: a negative quotient.`, say: 'Right: negative four times negative one point five is six, so six divided by negative four is negative one point five, the change per hour. Different signs: a negative quotient.' },
  't.d-no': { html: `Check it: (${M}4) × 1.5 = ${M}6, not 6. The quotient is ${M}1.5: different signs, negative.`, say: 'Check it: negative four times one point five is negative six, not six. The quotient is negative one point five: different signs, negative.' },
  't.cb-right': { html: 'At the start you picked +12 ft, and you were right. Now you can show why.', say: 'At the start you picked plus twelve feet, and you were right. Now you can show why.' },
  't.cb-neg': { html: `At the start you picked ${M}12 ft: that is where she will be 3 minutes from NOW. 3 minutes ago she was ${s('12 ft higher')}.`, say: 'At the start you picked negative twelve feet: that is where she will be three minutes from now. Three minutes ago she was twelve feet higher.' },
  't.cb-add': { html: `At the start you picked ${M}7 ft: that adds ${M}3 and ${M}4. It is a product: (${M}3) × (${M}4) = ${s('+12')}.`, say: 'At the start you picked negative seven feet: that adds negative three and negative four. It is a product: negative three times negative four is plus twelve.' },
  // 4. Prove it
  'p.intro': { html: `Jordan says: “(${M}3) × (${M}4) = ${M}12, because a negative times anything stays negative.”`, say: 'Jordan says: negative three times negative four is negative twelve, because a negative times anything stays negative.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it, without the diver. Fill each “because” with the reason that makes the line true.', say: 'Now prove it, without the diver. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `(${M}3) × (4 + (${M}4)) = 0,`, say: 'Negative three times the sum four plus negative four is zero,' },
  'p.c2': { html: `and it also equals (${M}3)(4) + (${M}3)(${M}4),`, say: 'and it also equals negative three times four, plus negative three times negative four,' },
  'p.c3': { html: `where (${M}3)(4) = ${a(`${M}12`)},`, say: 'where negative three times four is negative twelve,' },
  'p.c4': { html: `so ${M}12 + (${M}3)(${M}4) = 0, and ${s(`(${M}3)(${M}4) = 12`)}.`, say: 'so negative twelve plus negative three times negative four is zero, and negative three times negative four is twelve.' },
  'p.x-any': { html: "That is Jordan's idea, the one being tested. It cannot be a reason here.", say: "That is Jordan's idea, the one being tested. It cannot be a reason here." },
  'p.x-add': { html: 'That adds. Every line here is about products.', say: 'That adds. Every line here is about products.' },
  'p.x-examples': { html: 'One example is not a reason: a reason must work for every number.', say: 'One example is not a reason: a reason must work for every number.' },
  'p.x-rule': { html: 'That uses the rule to prove the rule. Find what makes this line true.', say: 'That uses the rule to prove the rule. Find what makes this line true.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: four claims, each with its reason, and the scale backs every one. The distributive property FORCES negative × negative to be positive.", say: "That's a proof: four claims, each with its reason, and the scale backs every one. The distributive property forces negative times negative to be positive." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
