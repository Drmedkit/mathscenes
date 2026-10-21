// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours: the
// amount being divided amber, the divisor teal, the answer digits lime), `say` is the same line written to be read
// aloud; pages/lessons/fractions-decimals-percents/voice/lines.json holds the `say` texts (the test keeps them in
// step). The page shows a line and calls ctx.say(id) with it.
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const rep = (pre: string, r: string) => `${pre}<span class="rep">${r}</span>`;
export const SIXTH = rep('0.1', '6'), SIXTH_ALL = rep('0.', '16'), TWELFTH = rep('0.41', '6'), THIRD = rep('0.', '3');

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: a 1-mile relay, 6 runners, the calculator's 0.1666666667
  'q.intro': { html: `A ${a('1-mile')} relay is split equally among ${b('6 runners')}. Each runs ${fr(1, 6)} of a mile.`, say: 'A one-mile relay is split equally among six runners. Each runs one sixth of a mile.' },
  'q.calc': { html: 'Your calculator shows 1 ÷ 6 = 0.1666666667.', say: 'Your calculator shows one divided by six equals zero point one six six six six six six six six seven.' },
  'q.ask': { html: `Which of these is <b>exactly</b> ${fr(1, 6)}?`, say: 'Which of these is exactly one sixth?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example: 1/6 by long division
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `${fr(1, 6)} means ${a('1')} ÷ ${b('6')}. ${b('6')} does not fit into ${a('1')}: digit ${s('0')}, remainder ${a('1')}. Bring down a zero: ${a('10')} ÷ ${b('6')} = ${s('1')}, remainder ${a('4')}.`, say: 'One sixth means one divided by six. Six does not fit into one: digit zero, remainder one. Bring down a zero: ten divided by six is one, remainder four.' },
  'e.s2': { html: `Remainder ${a('4')} becomes ${a('40')}. ${a('40')} ÷ ${b('6')} = ${s('6')}, remainder ${a('4')}. The remainder 4 is back.`, say: 'Remainder four becomes forty. Forty divided by six is six, remainder four. The remainder four is back.' },
  'e.s3': { html: `Same remainder, same next line, forever: the 6 repeats. Only the 6, because the 1 came once. So ${fr(1, 6)} = ${s(SIXTH)}.`, say: 'Same remainder, same next line, forever: the six repeats. Only the six, because the one came once. So one sixth is zero point one six, with the six repeating.' },
  'e.s4': { html: `× 100 moves the point two places: 16.666…%. Read the block again from the new point: ${fr(1, 6)} = ${s(rep('16.', '6') + '%')}, exactly.`, say: 'Times one hundred moves the point two places: sixteen point six six six percent. Read the block again from the new point: one sixth is sixteen point six repeating percent, exactly.' },
  'e.why': { html: 'Quick check: why does the bar go over the 6 only?', say: 'Quick check: why does the bar go over the six only?' },
  'e.w-ok': { html: 'Yes. The 1 came from remainder 1, which never comes back. Remainder 4 keeps coming back, and it always makes a 6.', say: 'Yes. The one came from remainder one, which never comes back. Remainder four keeps coming back, and it always makes a six.' },
  'e.w-all': { html: `A bar over 16 would mean 0.161616… But the 1 comes only once: ${SIXTH}.`, say: 'A bar over one six would mean zero point one six one six one six, and so on. But the one comes only once.' },
  'e.w-last': { html: 'The bar is not about the last digit you wrote. It covers the block that repeats, here just the 6.', say: 'The bar is not about the last digit you wrote. It covers the block that repeats, here just the six.' },
  // 3. Your turn: 5/12
  't.intro': { html: `Now ${b('12 runners')} share a ${a('5-mile')} relay: ${fr(5, 12)} of a mile each. The first step is done for you.`, say: 'Now twelve runners share a five-mile relay: five twelfths of a mile each. The first step is done for you.' },
  't.given': { html: `${a('5')} ÷ ${b('12')} = 0 r 5, then ${a('50')} ÷ ${b('12')} = 4 r 2, then ${a('20')} ÷ ${b('12')} = 1 r 8.`, say: 'Five divided by twelve is zero, remainder five. Then fifty divided by twelve is four, remainder two. Then twenty divided by twelve is one, remainder eight.' },
  't.step': { html: `Your step: the remainder ${a('8')} becomes ${a('80')}. What is ${a('80')} ÷ ${b('12')}?`, say: 'Your step: the remainder eight becomes eighty. What is eighty divided by twelve?' },
  't.s-ok': { html: 'Yes: 6 × 12 = 72, and 80 − 72 = 8. Remainder 8 again!', say: 'Yes: six times twelve is seventy-two, and eighty minus seventy-two is eight. Remainder eight again!' },
  't.s-big': { html: '7 × 12 = 84, more than 80. Try one less.', say: 'Seven times twelve is eighty-four, more than eighty. Try one less.' },
  't.s-rem': { html: 'A remainder must be less than 12. Check: digit × 12, then 80 minus that.', say: 'A remainder must be less than twelve. Check: the digit times twelve, then eighty minus that.' },
  't.s-other': { html: 'How many 12s fit into 80? Then 80 minus that is the remainder.', say: 'How many twelves fit into eighty? Then eighty minus that is the remainder.' },
  't.write': { html: `Remainder 8 came back. Which is ${fr(5, 12)} in bar notation?`, say: 'Remainder eight came back. Which is five twelfths in bar notation?' },
  't.w-ok': { html: `Yes: remainder 8 keeps coming back and makes a 6 every time. The 4 and the 1 came once. ${fr(5, 12)} = ${s(TWELFTH)}.`, say: 'Yes: remainder eight keeps coming back and makes a six every time. The four and the one came once. Five twelfths is zero point four one six, with the six repeating.' },
  't.w-all': { html: 'That repeats 416 again and again. The 4 and the 1 came once; only the 6 repeats.', say: 'That repeats four one six again and again. The four and the one came once; only the six repeats.' },
  't.w-two': { html: 'A bar over 16 repeats 1 and 6: 0.4161616… The 1 came once; only the 6 repeats.', say: 'A bar over one six repeats the one and the six. The one came once; only the six repeats.' },
  't.w-stop': { html: '0.416 stops. The remainder is 8, not 0, so the 6s go on.', say: 'Zero point four one six stops. The remainder is eight, not zero, so the sixes go on.' },
  't.pct': { html: `Last step: write ${fr(5, 12)} as an exact percent.`, say: 'Last step: write five twelfths as an exact percent.' },
  't.p-ok': { html: `Yes: × 100 gives 41.666…%, and the 6 still repeats: ${s(rep('41.', '6') + '%')}.`, say: 'Yes: times one hundred gives forty-one point six six six percent, and the six still repeats.' },
  't.p-unscaled': { html: `${TWELFTH}% would be less than 1%. Multiply by 100 first.`, say: 'That would be less than one percent. Multiply by one hundred first.' },
  't.p-one': { html: '× 100 moves the point two places, not one.', say: 'Times one hundred moves the point two places, not one.' },
  't.p-drop': { html: '41.6% stops. After the shift the 6s still go on, so the bar stays.', say: 'Forty-one point six percent stops. After the shift the sixes still go on, so the bar stays.' },
  't.cb-right': { html: `At the start you picked ${SIXTH}, and you were right. Now you know where the bar comes from: a remainder that comes back.`, say: 'At the start you picked zero point one six with the six repeating, and you were right. Now you know where the bar comes from: a remainder that comes back.' },
  't.cb-calc': { html: `At the start you picked the calculator's 0.1666666667. The display ran out of room: ${fr(1, 6)} = ${SIXTH} never stops.`, say: "At the start you picked the calculator's answer. The display ran out of room: one sixth never stops." },
  't.cb-all': { html: `At the start you picked ${SIXTH_ALL}. That repeats 16, but the 1 comes once: ${fr(1, 6)} = ${SIXTH}.`, say: 'At the start you picked a bar over one six. That repeats the one too, but the one comes once.' },
  't.cb-none': { html: `At the start: ${fr(1, 6)} = ${SIXTH}, exactly. The calculator only shows the first ten digits.`, say: 'At the start: one sixth is zero point one six with the six repeating, exactly. The calculator only shows the first ten digits.' },
  // 4. Prove it: Ava says 1/3 = 0.333
  'p.intro': { html: `Ava says: ${fr(1, 3)} = 0.333, exactly. Is Ava right?`, say: 'Ava says one third equals zero point three three three, exactly. Is Ava right?' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `After three digits, ${a('1')} ÷ ${b('3')} still has a remainder of ${a('1')}, not 0,`, say: 'After three digits, one divided by three still has a remainder of one, not zero, because ten divided by three is three, remainder one, at every step.' },
  'p.c2': { html: 'so 3 × 0.333 = 0.999: that is 0.001 short of 1,', say: 'so three times zero point three three three is zero point nine nine nine: that is one thousandth short of one, because that leftover thousandth was never shared out.' },
  'p.c3': { html: `so ${fr(1, 3)} = ${s(THIRD)} exactly, and 0.333 ≈ ${fr(1, 3)}, close but not equal.`, say: 'so one third is zero point three repeating, exactly, and zero point three three three is only close to one third, because cutting a repeating decimal off gives a different, smaller number.' },
  'p.x-length': { html: 'Three 3s are just three digits, and then it stops. Repeating means it goes on forever, which is what a bar says.', say: 'Three threes are just three digits, and then it stops. Repeating means it goes on forever, which is what a bar says.' },
  'p.x-ends': { html: 'It never does: every step is 10 ÷ 3 = 3 r 1. The remainder 1 comes back forever.', say: 'It never does: every step is ten divided by three, three, remainder one. The remainder one comes back forever.' },
  'p.x-inexact': { html: `Some decimals are exact: 0.125 = ${fr(1, 8)} exactly. The question is whether 0.333 is all of ${fr(1, 3)}. It is not.`, say: 'Some decimals are exact: zero point one two five is exactly one eighth. The question is whether zero point three three three is all of one third. It is not.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: `That's a proof: three claims, each with its reason, and the division backs every one. Ava's 0.333 ≈ ${fr(1, 3)}; exactly, ${fr(1, 3)} = ${THIRD}.`, say: "That's a proof: three claims, each with its reason, and the division backs every one. Ava's number is close to one third; exactly, one third is zero point three repeating." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
