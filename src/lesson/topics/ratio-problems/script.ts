// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the first quantity, b = the second, s = the answer, w = wrong), `say` is the same line written to be read aloud
// (no digits, no symbols). pages/lessons/ratio-problems/voice/lines.json holds the `say` texts (the test keeps them
// in step). No imports, so a plain script can read it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const w = (x: string) => `<b class="w">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: 4 pounds of cherries cost $10, what do 6 pounds cost?
  'q.intro': { html: `At the farmers market, ${a('4 pounds')} of cherries cost ${b('$10')}.`, say: 'At the farmers market, four pounds of cherries cost ten dollars.' },
  'q.ask': { html: `How much do ${a('6 pounds')} cost? Pick an answer, and say how sure you are.`, say: 'How much do six pounds cost? Pick an answer, and say how sure you are.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example: the multiplier, whole steps, both quantities, the rate check
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one. The picture moves first, then the notation.' },
  'e.s1': { html: `The pounds go from ${a('4')} to ${a('6')}. The multiplier is new ÷ old: 6 ÷ 4 = ${s('1.5')}. Not a whole number, and that is fine.`, say: 'The pounds go from four to six. The multiplier is new divided by old: six divided by four is one and a half. Not a whole number, and that is fine.' },
  'e.s2': { html: `Times 1.5 in whole steps: cut the 4 pounds into 2 equal pieces, ${a('2 pounds')} for ${b('$5')} each. Three pieces make ${a('6 pounds')} for ${s('$15')}. Divide both by 2, then multiply both by 3.`, say: 'Times one and a half, in whole steps: cut the four pounds into two equal pieces, two pounds for five dollars each. Three pieces make six pounds for fifteen dollars. Divide both by two, then multiply both by three.' },
  'e.s3': { html: `So the dollars get the same multiplier: ${b('$10')} × 1.5 = ${s('$15')}. More than $10, because 1.5 is more than 1.`, say: 'So the dollars get the same multiplier: ten dollars times one and a half is fifteen dollars. More than ten dollars, because one and a half is more than one.' },
  'e.s4': { html: `Check with the rate inside each pair: 10 ÷ 4 = 2.5 and 15 ÷ 6 = 2.5. That is ${s('$2.50 per pound')}, a rate with a unit. The multiplier 1.5 has no unit.`, say: 'Check with the rate inside each pair: ten divided by four is two point five, and fifteen divided by six is two point five. That is two dollars and fifty cents per pound, a rate with a unit. The multiplier, one and a half, has no unit.' },
  'e.why': { html: 'Quick check: why do the dollars get × 1.5 too?', say: 'Quick check: why do the dollars get times one and a half too?' },
  'e.why.ok': { html: 'Yes. 6 pounds is 1.5 times 4 pounds, so it costs 1.5 times as much: every pound costs the same.', say: 'Yes. Six pounds is one and a half times four pounds, so it costs one and a half times as much. Every pound costs the same.' },
  'e.why.add': { html: `Look at the picture: ${w('$12')} does not line up with 6 pounds. Adding 2 to both keeps the difference, not the ratio. Two more pounds cost 2 × $2.50 = $5 more.`, say: 'Look at the picture: twelve dollars does not line up with six pounds. Adding two to both keeps the difference, not the ratio. Two more pounds cost two times two fifty, five dollars more.' },
  'e.why.rate': { html: 'The price per pound is $2.50, not 1.5. The 1.5 goes between the pairs; the $2.50 goes inside one pair.', say: 'The price per pound is two fifty, not one and a half. The one and a half goes between the pairs. The two fifty goes inside one pair.' },
  // 3. Your turn: Maya hikes 12 miles in 4 hours; how long for 9 miles?
  't.intro': { html: `Maya hikes ${b('12 miles')} in ${a('4 hours')} at a steady pace. How long does she take for ${b('9 miles')}? The first step is done for you.`, say: 'Maya hikes twelve miles in four hours at a steady pace. How long does she take for nine miles? The first step is done for you.' },
  't.s1': { html: `The miles go from 12 to 9: the multiplier is 9 ÷ 12 = ${s('0.75')}.`, say: 'The miles go from twelve to nine. The multiplier is nine divided by twelve, zero point seven five.' },
  't.pred': { html: 'Your step: before you work it out, will the time be more or less than 4 hours?', say: 'Your step: before you work it out, will the time be more or less than four hours?' },
  't.p-ok': { html: 'Yes: × 0.75 is less than 1, so the time shrinks too.', say: 'Yes. Times zero point seven five is less than one, so the time shrinks too.' },
  't.p-big': { html: 'Multiplying by 0.75, a number less than 1, makes it smaller. Fewer miles take less time.', say: 'Multiplying by zero point seven five, a number less than one, makes it smaller. Fewer miles take less time.' },
  't.p-inv': { html: '12 ÷ 9 is old ÷ new. The multiplier is new ÷ old: 9 ÷ 12 = 0.75, less than 1.', say: 'Twelve divided by nine is old divided by new. The multiplier is new divided by old: nine divided by twelve, zero point seven five. Less than one.' },
  't.hours': { html: 'Your step: multiply the hours by the same 0.75. How many hours?', say: 'Your step: multiply the hours by the same zero point seven five. How many hours?' },
  't.h-ok': { html: `Yes: 4 × 0.75 = ${s('3 hours')}. On the line: 4 pieces of 1 hour and 3 miles; count 3 of them.`, say: 'Yes. Four times zero point seven five is three hours. On the line: four pieces of one hour and three miles. Count three of them.' },
  't.h-add': { html: 'That takes away the same 3 as the miles. Taking away keeps the difference, not the ratio. Multiply by 0.75.', say: 'That takes away the same three as the miles. Taking away keeps the difference, not the ratio. Multiply by zero point seven five.' },
  't.h-inv': { html: 'That multiplies by 12 ÷ 9, the multiplier upside down. Fewer miles must take less time.', say: 'That multiplies by twelve divided by nine, the multiplier upside down. Fewer miles must take less time.' },
  't.h-miles': { html: 'That is 9 × 0.75: the miles got the multiplier twice. Multiply the hours: 4 × 0.75.', say: 'That is nine times zero point seven five. The miles got the multiplier twice. Multiply the hours: four times zero point seven five.' },
  't.h-mult': { html: '0.75 is the multiplier, not the time. Multiply the 4 hours by it.', say: 'Zero point seven five is the multiplier, not the time. Multiply the four hours by it.' },
  't.h-no': { html: 'Multiply the hours by the multiplier: 4 × 0.75.', say: 'Multiply the hours by the multiplier: four times zero point seven five.' },
  't.h-empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.rate': { html: 'Last step: what is Maya’s speed, the rate inside one pair?', say: 'Last step: what is Maya’s speed, the rate inside one pair?' },
  't.r-ok': { html: `Yes: 12 ÷ 4 = 3 and 9 ÷ 3 = 3. ${s('3 miles per hour')} in both pairs, so the answer checks.`, say: 'Yes. Twelve divided by four is three, and nine divided by three is three. Three miles per hour in both pairs, so the answer checks.' },
  't.r-mult': { html: '0.75 is the multiplier between the pairs. A speed is inside one pair, with a unit: miles ÷ hours.', say: 'Zero point seven five is the multiplier between the pairs. A speed is inside one pair, with a unit: miles divided by hours.' },
  't.r-rev': { html: 'That is 4 ÷ 12: hours per mile. Miles per hour is miles ÷ hours: 12 ÷ 4.', say: 'That is four divided by twelve: hours per mile. Miles per hour is miles divided by hours: twelve divided by four.' },
  'q.cb.right': { html: 'At the start you picked $15, and you were right. Now you can show why: both quantities × 1.5.', say: 'At the start you picked fifteen dollars, and you were right. Now you can show why: both quantities times one and a half.' },
  'q.cb.add': { html: 'At the start you picked $12. That adds $2 because 6 is 2 more than 4. Multiply both by 1.5 instead: $15.', say: 'At the start you picked twelve dollars. That adds two dollars because six is two more than four. Multiply both by one and a half instead: fifteen dollars.' },
  'q.cb.rev': { html: 'At the start you picked $2.40. That used 4 ÷ 10, pounds per dollar, as the price. The price is 10 ÷ 4 = $2.50 a pound, so 6 pounds cost $15.', say: 'At the start you picked two forty. That used four divided by ten, pounds per dollar, as the price. The price is ten divided by four, two fifty a pound, so six pounds cost fifteen dollars.' },
  'q.cb.none': { html: 'Multiply both quantities by the same number, even when it is not whole.', say: 'Multiply both quantities by the same number, even when it is not whole.' },
  // 4. Prove it: Alex rounds the price per pound too early
  'p.intro': { html: `Pears: ${a('7 pounds')} cost ${b('$20')}. Alex finds the cost of ${a('12 pounds')}: $20 ÷ 7 ≈ $2.86 a pound, and 12 × $2.86 = ${w('$34.32')}. Is Alex right?`, say: 'Pears: seven pounds cost twenty dollars. Alex finds the cost of twelve pounds. Twenty dollars divided by seven is about two eighty-six a pound, and twelve times two eighty-six is thirty-four thirty-two. Is Alex right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. Cut the 7 pounds into 7 one-pound pieces: 12 of them is 12/7 of the whole, so 240/7 dollars, exactly.', say: 'Right. Cut the seven pounds into seven one-pound pieces. Twelve of them is twelve sevenths of the whole, so two hundred forty sevenths of a dollar, exactly.' },
  'p.c2': { html: 'Right. 240 ÷ 7 = 34.285…, and the 5 after the cents rounds up: $34.29.', say: 'Right. Two hundred forty divided by seven is thirty-four point two eight five, and the five after the cents rounds up: thirty-four twenty-nine.' },
  'p.c3': { html: 'Right. $2.86 is about $0.003 too much per pound. Twelve pounds make that about 3 cents.', say: 'Right. Two eighty-six is about three tenths of a cent too much per pound. Twelve pounds make that about three cents.' },
  'p.no.early': { html: 'Rounding every step is exactly what went wrong. Keep the exact value until the end, then round once.', say: 'Rounding every step is exactly what went wrong. Keep the exact value until the end, then round once.' },
  'p.no.trunc': { html: 'Cutting off is not rounding. The next digit is 5, so the cents round up: $34.29.', say: 'Cutting off is not rounding. The next digit is five, so the cents round up: thirty-four twenty-nine.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: exact first, one rounding at the end. Alex rounded too early, and twelve pounds made the slip grow.', say: 'That’s a proof: exact first, one rounding at the end. Alex rounded too early, and twelve pounds made the slip grow.' },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
