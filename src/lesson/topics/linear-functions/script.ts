// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the initial value b, amber; b = the rate m, teal; s = the answer / the equation, lime; w = wrong), `say` is the
// same line written to be read aloud (no digits or symbols). pages/lessons/linear-functions/voice/lines.json holds
// the `say` texts (the test keeps the two in step). The page shows a line and speaks it with ctx.say(id).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, w = (x: string) => `<b class="w">${x}</b>`;
const I = (x: string) => `<i>${x}</i>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question: the bike rental ----------
  'q.intro': { html: `A bike shop charges a one-time fee plus a price per hour. The table shows three rentals: ${b('2 hours')} cost ${a('$34')}, ${b('4 hours')} cost ${a('$50')}, ${b('6 hours')} cost ${a('$66')}. How big is the fee: the cost before you ride at all? Pick an answer, and say how sure you are.`,
    say: 'A bike shop charges a one-time fee plus a price per hour. The table shows three rentals. Two hours cost thirty-four dollars, four hours cost fifty dollars, and six hours cost sixty-six dollars. How big is the fee: the cost before you ride at all? Pick an answer, and say how sure you are.' },

  // ---------- 2. Worked example ----------
  'e.intro': { html: 'Four steps. Press each one: the graph moves first, then the notation.', say: 'Four steps. Press each one: the graph moves first, then the notation.' },
  'e.step0': { html: `From ${b('2 to 4 hours')} the cost goes from $34 to $50: ${b('$16 more for 2 hours')}. Per ONE hour: 16 ÷ 2 = ${b('8')}. The rate is ${b('m = 8 dollars per hour')}.`,
    say: 'From two to four hours, the cost goes from thirty-four to fifty dollars: sixteen dollars more for two hours. Per one hour, sixteen divided by two is eight. The rate is eight dollars per hour.' },
  'e.step1': { html: `Now walk back from 2 hours to ${a('0 hours')}. Two hours less takes away 2 × $8 = $16: 34 − 16 = ${a('18')}. At 0 hours the cost is ${a('$18')}. That is the fee: ${a('b = 18')}.`,
    say: 'Now walk back from two hours to zero hours. Two hours less takes away two times eight, sixteen dollars. Thirty-four minus sixteen is eighteen. At zero hours the cost is eighteen dollars. That is the fee: b is eighteen.' },
  'e.step2': { html: `Cost = ${b('$8 for every hour')} plus the ${a('$18 fee')}: ${s('C = 8h + 18')}, where ${I('C')} is the cost in dollars and ${I('h')} the time in hours.`,
    say: 'The cost is eight dollars for every hour, plus the eighteen dollar fee. C equals eight h plus eighteen, where C is the cost in dollars and h is the time in hours.' },
  'e.step3': { html: `Check it on a row we did not use: 8 × 6 + 18 = 66. It fits every row, so ${s('C = 8h + 18')} is the rental’s rule.`,
    say: 'Check it on a row we did not use: eight times six plus eighteen is sixty-six. It fits every row, so C equals eight h plus eighteen is the rule.' },
  'e.why': { html: 'Quick check: why is the fee $18, and not $34?', say: 'Quick check: why is the fee eighteen dollars, and not thirty-four?' },
  'e.why.ok': { html: 'Yes. $34 already includes 2 hours of riding. The fee is the cost at 0 hours.', say: 'Yes. Thirty-four dollars already includes two hours of riding. The fee is the cost at zero hours.' },
  'e.why.first': { html: `The first row is ${w('2 hours')}, not 0 hours. $34 is the fee plus 2 hours of riding.`, say: 'The first row is two hours, not zero hours. Thirty-four dollars is the fee plus two hours of riding.' },
  'e.why.swap': { html: `The price per hour is the ${b('rate')}, $8. The fee is paid once, at the start.`, say: 'The price per hour is the rate, eight dollars. The fee is paid once, at the start.' },

  // ---------- 3. Your turn: the phone battery ----------
  't.intro': { html: `A phone battery runs down at a steady rate. At ${b('5 minutes')} it shows ${a('85%')}, at ${b('15 minutes')} ${a('65%')}, at ${b('25 minutes')} ${a('45%')}. The rate is done for you.`,
    say: 'A phone battery runs down at a steady rate. At five minutes it shows eighty-five percent, at fifteen minutes sixty-five percent, and at twenty-five minutes forty-five percent. The rate is done for you.' },
  't.rate': { html: `Every ${b('10 minutes')} the battery loses 20 points: per ONE minute that is ${b('m = −2')}, two points down each minute.`,
    say: 'Every ten minutes the battery loses twenty points. Per one minute that is minus two: two points down each minute.' },
  't.b': { html: `Your step: what did the battery show at ${a('0 minutes')}? Type ${I('b')}.`, say: 'Your step: what did the battery show at zero minutes? Type b.' },
  't.b.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.b.ok': { html: `Yes: going back 5 minutes adds back 5 × 2 = 10 points. 85 + 10 = ${a('95')}. ${a('b = 95')}.`, say: 'Yes. Going back five minutes adds back five times two, ten points. Eighty-five plus ten is ninety-five. b is ninety-five.' },
  't.b.first': { html: `${w('85%')} is the reading at 5 minutes. Go back 5 more minutes to 0.`, say: 'Eighty-five percent is the reading at five minutes. Go back five more minutes, to zero.' },
  't.b.sign': { html: `Going ${w('back')} in time, the battery was FULLER: add the 10 points, don’t take them away.`, say: 'Going back in time, the battery was fuller. Add the ten points, don’t take them away.' },
  't.b.no': { html: 'Start at 85% at 5 minutes. Each minute back adds 2 points.', say: 'Start at eighty-five percent at five minutes. Each minute back adds two points.' },
  't.eq': { html: `Your step: which equation fits? ${I('B')} is the battery in percent, ${I('t')} the time in minutes.`, say: 'Your step: which equation fits? B is the battery in percent, and t is the time in minutes.' },
  't.eq.ok': { html: `Yes: start at ${a('95')}, ${b('down 2')} each minute. ${s('B = −2t + 95')}.`, say: 'Yes. Start at ninety-five, down two each minute. B equals minus two t plus ninety-five.' },
  't.eq.swap': { html: `That multiplies the start by ${I('t')}. The rate, ${b('−2')}, multiplies ${I('t')}; the start, ${a('95')}, stands alone.`, say: 'That multiplies the start by t. The rate, minus two, multiplies t. The start, ninety-five, stands alone.' },
  't.eq.sign': { html: `The battery goes ${w('down')}, so the rate is negative: −2, not +2.`, say: 'The battery goes down, so the rate is negative: minus two, not plus two.' },
  't.check': { html: `Check it: what does your equation give at ${I('t')} = 25?`, say: 'Check it: what does your equation give at t equals twenty-five?' },
  't.check.ok': { html: `−2 × 25 + 95 = 45: the same as the table. ${s('B = −2t + 95')} fits.`, say: 'Minus two times twenty-five, plus ninety-five, is forty-five: the same as the table. The equation fits.' },
  't.check.sign': { html: `Mind the sign: −2 × 25 = −50, and −50 + 95 = ?`, say: 'Mind the sign. Minus two times twenty-five is minus fifty. Minus fifty plus ninety-five is what?' },
  't.check.no': { html: '−2 × 25 = −50. Then add 95.', say: 'Minus two times twenty-five is minus fifty. Then add ninety-five.' },
  'q.cb.right': { html: 'At the start you picked $18, and you were right. Now you can show why: walk back to 0 hours with the rate.', say: 'At the start you picked eighteen dollars, and you were right. Now you can show why: walk back to zero hours with the rate.' },
  'q.cb.first': { html: 'At the start you picked $34. That is the cost of 2 hours. The fee is the cost at 0 hours.', say: 'At the start you picked thirty-four dollars. That is the cost of two hours. The fee is the cost at zero hours.' },
  'q.cb.zero': { html: 'At the start you picked $0. But there is a fee, so the line starts at $18, not at 0.', say: 'At the start you picked zero dollars. But there is a fee, so the line starts at eighteen dollars, not at zero.' },
  'q.cb.none': { html: 'Rate first, per ONE unit. Then walk back to input 0 for b.', say: 'Rate first, per one unit. Then walk back to input zero for b.' },

  // ---------- 4. Prove it: Jordan doubles ----------
  'p.intro': { html: `Jordan says: “2 hours cost $34, so 4 hours cost ${w('$68')}. Twice the time, twice the cost.” Is Jordan right?`, say: 'Jordan says: two hours cost thirty-four dollars, so four hours cost sixty-eight. Twice the time, twice the cost. Is Jordan right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. The table says 4 hours cost $50. Jordan’s $68 is off the line.', say: 'Right. The table says four hours cost fifty dollars. Jordan’s sixty-eight is off the line.' },
  'p.c2': { html: `Right. Only the ${b('8h')} part doubles. The ${a('$18 fee')} is paid once, so doubling counts it twice.`, say: 'Right. Only the eight h part doubles. The eighteen dollar fee is paid once, so doubling counts it twice.' },
  'p.c3': { html: `Right. A proportional line goes through (0, 0). This one starts at ${a('18')}.`, say: 'Right. A proportional line goes through zero, zero. This one starts at eighteen.' },
  'p.no.prop': { html: `Straight is ${w('linear')}, not proportional. A proportional line must also go through (0, 0).`, say: 'Straight means linear, not proportional. A proportional line must also go through zero, zero.' },
  'p.no.scale': { html: `Going up every hour is not enough. The ${a('fee')} does not grow with the hours, so the cost does not double.`, say: 'Going up every hour is not enough. The fee does not grow with the hours, so the cost does not double.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That’s a proof: three claims, each with its reason, and the graph backs every one. ${s('C = 8h + 18')} is linear, but not proportional.`, say: 'That’s a proof: three claims, each with its reason, and the graph backs every one. The rental is linear, but not proportional.' },
};
