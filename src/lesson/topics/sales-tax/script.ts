// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// pre-tax price amber, tax teal, total lime), `say` is the same line written to be read aloud (no digits, no symbols);
// pages/lessons/sales-tax/voice/lines.json holds the `say` texts (the test keeps the two in step).

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: $60 sneakers, 8% sales tax
  'q.intro': { html: `${a('Sneakers are marked $60.')} The sales tax is ${b('8%')}.`, say: 'Sneakers are marked sixty dollars. The sales tax is eight percent.' },
  'q.ask': { html: 'What do you pay at the register?', say: 'What do you pay at the register?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },

  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The shelf price ${a('$60')} is before tax. It is the whole: ${a('100%')}. The tape is the same $60.`, say: 'The shelf price, sixty dollars, is before tax. It is the whole: one hundred percent. The tape is the same sixty dollars.' },
  'e.s2': { html: `1% of $60 is $0.60. So ${b('8%')} is 8 × $0.60 = ${b('$4.80')}. The tax sticks out past the 100%.`, say: 'One percent of sixty dollars is sixty cents. So eight percent is eight times sixty cents: four dollars and eighty cents. The tax sticks out past the hundred percent.' },
  'e.s3': { html: `${a('$60')} + ${b('$4.80')} = ${s('$64.80')}. That is the ${s('total')}, what you pay.`, say: 'Sixty dollars plus four eighty is sixty-four dollars and eighty cents. That is the total, what you pay.' },
  'e.s4': { html: `The total is 100% + 8% = ${s('108%')} of the price. 1.08 × $60 = ${s('$64.80')}: the same total, in one step.`, say: 'The total is one hundred percent plus eight percent: one hundred eight percent of the price. One point zero eight times sixty dollars is sixty-four eighty: the same total, in one step.' },
  'e.why': { html: 'Quick check: why does 1.08 × $60 give the total?', say: 'Quick check: why does one point zero eight times sixty dollars give the total?' },
  'e.w-ok': { html: 'Yes. The 1 keeps the whole price, the 0.08 adds the tax: 108% of the price.', say: 'Yes. The one keeps the whole price, and the point zero eight adds the tax: one hundred eight percent of the price.' },
  'e.w-less': { html: 'A percent can be more than 100%. The total is the price and more: 108% of it.', say: 'A percent can be more than one hundred percent. The total is the price and more: one hundred eight percent of it.' },
  'e.w-append': { html: 'Not the digits: 8% = 0.08, so it is 1 + 0.08. For 7.5% tax it is 1.075, not 1.75.', say: 'It is not about the digits. Eight percent is point zero eight, so the multiplier is one plus point zero eight. For seven and a half percent tax it is one point zero seven five, not one point seven five.' },

  // 3. Your turn: a $40 board game, 7.5% tax
  't.intro': { html: `Now ${a('a $40 board game')} with ${b('7.5% tax')}. The first two steps are done for you.`, say: 'Now a forty dollar board game with seven and a half percent tax. The first two steps are done for you.' },
  't.tax': { html: `The tax: 7.5% = 0.075, and 0.075 × $40 = ${b('$3.00')}.`, say: 'The tax: seven and a half percent is point zero seven five, and that times forty dollars is three dollars.' },
  't.add': { html: 'Your step: what do you pay in total?', say: 'Your step: what do you pay in total?' },
  't.empty': { html: 'Type an amount, like 12.50.', say: 'Type an amount, like twelve fifty.' },
  't.a-ok': { html: `Yes: $40.00 + $3.00 = ${s('$43.00')}.`, say: 'Yes: forty dollars plus three dollars is forty-three dollars.' },
  't.a-pct': { html: 'That adds $7.50. The tax is 7.5% OF the price: $3.00.', say: 'That adds seven dollars and fifty cents. The tax is seven and a half percent of the price: three dollars.' },
  't.a-tax': { html: '$3.00 is the tax. You pay the price and the tax.', say: 'Three dollars is the tax. You pay the price and the tax.' },
  't.a-sub': { html: 'Sales tax is added at the register, not taken off.', say: 'Sales tax is added at the register, not taken off.' },
  't.a-shelf': { html: 'The $40 on the shelf is before tax. The tax comes on top.', say: 'The forty dollars on the shelf is before tax. The tax comes on top.' },
  't.a-other': { html: 'Add the tax to the pre-tax price: $40.00 + $3.00.', say: 'Add the tax to the pre-tax price: forty dollars plus three dollars.' },
  't.mult': { html: 'Your step: which one multiplication gives the total?', say: 'Your step: which one multiplication gives the total?' },
  't.m-ok': { html: `Yes: 100% + 7.5% = 107.5%, so 1.075 × $40 = ${s('$43.00')}.`, say: 'Yes: one hundred percent plus seven and a half percent is one hundred seven and a half percent, so one point zero seven five times forty dollars is forty-three dollars.' },
  't.m-append': { html: '7.5% is 0.075, so the multiplier is 1 + 0.075 = 1.075. 1.75 × $40 would be $70.', say: 'Seven and a half percent is point zero seven five, so the multiplier is one plus point zero seven five. One point seven five times forty dollars would be seventy dollars.' },
  't.m-tax': { html: '0.075 × $40 is only the tax, $3.00. The total keeps the price too.', say: 'Point zero seven five times forty dollars is only the tax, three dollars. The total keeps the price too.' },
  't.m-down': { html: '0.925 takes 7.5% off, like a discount. Tax is added.', say: 'Point nine two five takes seven and a half percent off, like a discount. Tax is added.' },
  't.bench': { html: 'Last check: is $3.00 a sensible tax on $40?', say: 'Last check: is three dollars a sensible tax on forty dollars?' },
  't.b-ok': { html: '5% of $40 is $2 and 10% is $4. 7.5% is between them, and so is $3.00.', say: 'Five percent of forty dollars is two dollars, and ten percent is four dollars. Seven and a half percent is between them, and so is three dollars.' },
  't.b-one': { html: 'Less than $40 is only one side: $30 is less than $40 too. Check a lower AND an upper bound.', say: 'Less than forty dollars is only one side: thirty dollars is less than forty too. Check a lower and an upper bound.' },
  't.b-scale': { html: '$30 would be 75% of the price. 10% is only $4, so the tax is under $4.', say: 'Thirty dollars would be seventy-five percent of the price. Ten percent is only four dollars, so the tax is under four dollars.' },
  't.cb-68': { html: 'At the start you picked $68. That adds 8 dollars, but 8% of $60 is $4.80.', say: 'At the start you picked sixty-eight dollars. That adds eight dollars, but eight percent of sixty dollars is four eighty.' },
  't.cb-right': { html: 'At the start you picked $64.80, and you were right. Now you can show why: the price is 100%, the total 108%.', say: 'At the start you picked sixty-four eighty, and you were right. Now you can show why: the price is one hundred percent, the total one hundred eight.' },
  't.cb-480': { html: 'At the start you picked $4.80. That is the tax. You pay the price AND the tax.', say: 'At the start you picked four eighty. That is the tax. You pay the price and the tax.' },
  't.cb-none': { html: 'The pre-tax price is 100%. The tax adds r% on top, so the total is (100 + r)% of the price.', say: 'The pre-tax price is one hundred percent. The tax adds its percent on top, so the total is more than one hundred percent of the price.' },

  // 4. Prove it: Ana works back from an $81 total
  'p.intro': { html: `Ana's receipt says ${s('Total $81.00')} with ${b('8% tax')}, but the price is torn off. Ana: "8% of $81 is $6.48, so the price was $81 − $6.48 = $74.52." Is Ana right?`, say: 'Ana’s receipt says the total is eighty-one dollars, with eight percent tax, but the price is torn off. Ana says: eight percent of eighty-one dollars is six forty-eight, so the price was seventy-four dollars and fifty-two cents. Is Ana right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `The total ${s('$81')} is ${s('108%')} of the pre-tax price,`, say: 'The total, eighty-one dollars, is one hundred eight percent of the pre-tax price, because the price is the whole and the tax adds eight percent on top.' },
  'p.c2': { html: `so the price is $81 ÷ 1.08 = ${a('$75')}, and the tax ${b('$6')},`, say: 'So the price is eighty-one dollars divided by one point zero eight: seventy-five dollars, and the tax is six dollars, because dividing by one point zero eight undoes the times one point zero eight.' },
  'p.c3': { html: `and Ana's $6.48 is too much: 8% of $81 is more than ${b('$6')},`, say: 'And Ana’s six forty-eight is too much, because eighty-one dollars is a bigger whole than seventy-five, so each percent of it is bigger.' },
  'p.x-cancel': { html: 'They do not cancel. The 8% added was of $75; the 8% Ana takes off is of $81, a bigger whole.', say: 'They do not cancel. The eight percent added was of seventy-five dollars. The eight percent Ana takes off is of eighty-one dollars, a bigger whole.' },
  'p.x-div': { html: '$81 ÷ 0.08 = $1,012.50: far too much. 0.08 × the price is only the tax; the total is 1.08 × the price.', say: 'Eighty-one dollars divided by point zero eight is over a thousand dollars: far too much. Point zero eight times the price is only the tax. The total is one point zero eight times the price.' },
  'p.x-dollars': { html: '8% is not $8. The tax was 8% of the price.', say: 'Eight percent is not eight dollars. The tax was eight percent of the price.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: three claims, each with its reason, and the tapes back every one. Undo a tax by dividing by 1.08, not by taking 8% of the total.", say: "That's a proof: three claims, each with its reason, and the tapes back every one. Undo a tax by dividing by one point zero eight, not by taking eight percent of the total." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
