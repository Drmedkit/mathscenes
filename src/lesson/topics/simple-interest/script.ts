// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// principal amber, interest and rate teal, balance lime), `say` is the same line written to be read aloud (no digits,
// no symbols); pages/lessons/simple-interest/voice/lines.json holds the `say` texts (the test keeps the two in step).

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: $2,000 at 5% simple interest for 3 years
  'q.intro': { html: `Maya deposits ${a('$2,000')} in a savings account that pays ${b('5% simple interest per year')}. She adds nothing and takes nothing out.`, say: 'Maya deposits two thousand dollars in a savings account that pays five percent simple interest per year. She adds nothing and takes nothing out.' },
  'q.ask': { html: 'How much is in the account after 3 years? Pick an answer, and say how sure you are.', say: 'How much is in the account after three years? Pick an answer, and say how sure you are.' },

  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the tapes move first, then the notation.', say: 'Four steps. Press each one: the tapes move first, then the notation.' },
  'e.s1': { html: `The ${a('$2,000')} Maya puts in is the ${a('principal')}: the whole, ${a('100%')}. Each dashed cell is 10% of it: $200.`, say: 'The two thousand dollars Maya puts in is the principal: the whole, one hundred percent. Each dashed cell is ten percent of it: two hundred dollars.' },
  'e.s2': { html: `5% is half of one 10% cell: ${b('$100')}. In numbers, 0.05 × $2,000 = $100. After year 1 the balance is ${s('$2,100')}.`, say: 'Five percent is half of one ten percent cell: one hundred dollars. In numbers, point zero five times two thousand dollars is one hundred dollars. After year one the balance is twenty-one hundred dollars.' },
  'e.s3': { html: `Simple interest is always 5% of the ${a('principal')}, the same $2,000. So every year adds the same ${b('$100')}: $2,200, then ${s('$2,300')}.`, say: 'Simple interest is always five percent of the principal, the same two thousand dollars. So every year adds the same one hundred dollars: twenty-two hundred, then twenty-three hundred dollars.' },
  'e.s4': { html: `Three equal stubs: ${b('I = P × r × t')} = $2,000 × 0.05 × 3 = ${b('$300')}. The balance is $2,000 + $300 = ${s('$2,300')}.`, say: 'Three equal stubs. I equals P times r times t: two thousand dollars times point zero five times three is three hundred dollars. The balance is two thousand plus three hundred: twenty-three hundred dollars.' },
  'e.why': { html: 'Quick check: why does every year add $100, and not more?', say: 'Quick check: why does every year add one hundred dollars, and not more?' },
  'e.why.ok': { html: 'Yes. The base never changes, so the interest never changes. The ring stays on the amber principal.', say: 'Yes. The base never changes, so the interest never changes. The ring stays on the amber principal.' },
  'e.why.grow': { html: 'That is compound interest, a different rule. Simple interest is always figured on the principal: the ring stays on the $2,000.', say: 'That is compound interest, a different rule. Simple interest is always figured on the principal: the ring stays on the two thousand dollars.' },
  'e.why.five': { html: '5% is not 5 dollars. It is $5 for every $100: 20 hundreds × $5 = $100.', say: 'Five percent is not five dollars. It is five dollars for every hundred dollars: twenty hundreds times five dollars is one hundred dollars.' },

  // 3. Your turn: Sam borrows $1,500 for 3 years at 4%
  't.intro': { html: `Now a loan. Sam borrows ${a('$1,500')} for 3 years at ${b('4% simple interest per year')}, and pays it all back at the end. The first two steps are done for you.`, say: 'Now a loan. Sam borrows fifteen hundred dollars for three years at four percent simple interest per year, and pays it all back at the end. The first two steps are done for you.' },
  't.total': { html: 'Your step: how much interest does Sam owe for all 3 years?', say: 'Your step: how much interest does Sam owe for all three years?' },
  't.empty': { html: 'Type an amount in dollars, like 250.', say: 'Type an amount in dollars, like two hundred fifty.' },
  't.total.ok': { html: `Yes: $60 a year for 3 years. $1,500 × 0.04 × 3 = ${b('$180')}.`, say: 'Yes: sixty dollars a year for three years. Fifteen hundred times point zero four times three is one hundred eighty dollars.' },
  't.total.one': { html: '$60 is one year. The loan runs 3 years, and each year adds another $60.', say: 'Sixty dollars is one year. The loan runs three years, and each year adds another sixty dollars.' },
  't.total.comp': { html: 'That takes 4% of a growing amount: compound interest. Simple interest is 4% of the $1,500 every year.', say: 'That takes four percent of a growing amount: compound interest. Simple interest is four percent of the fifteen hundred dollars every year.' },
  't.total.owe': { html: 'That is everything Sam pays back. The interest is only the part on top of the $1,500.', say: 'That is everything Sam pays back. The interest is only the part on top of the fifteen hundred dollars.' },
  't.total.no': { html: 'Each year adds 4% of $1,500, which is $60. How many years are there?', say: 'Each year adds four percent of fifteen hundred dollars, which is sixty dollars. How many years are there?' },
  't.owe': { html: 'Your step: how much does Sam owe in all at the end of the 3 years?', say: 'Your step: how much does Sam owe in all at the end of the three years?' },
  't.owe.ok': { html: `Yes: $1,500 + $180 = ${s('$1,680')}.`, say: 'Yes: fifteen hundred plus one hundred eighty is sixteen hundred eighty dollars.' },
  't.owe.int': { html: '$180 is the interest. Sam also pays back the $1,500 he borrowed.', say: 'One hundred eighty dollars is the interest. Sam also pays back the fifteen hundred dollars he borrowed.' },
  't.owe.one': { html: '$1,560 is what Sam would owe after one year. Three years add $180.', say: 'Fifteen hundred sixty dollars is what Sam would owe after one year. Three years add one hundred eighty dollars.' },
  't.owe.less': { html: 'A borrower pays the interest on top: Sam owes more than he borrowed, not less.', say: 'A borrower pays the interest on top: Sam owes more than he borrowed, not less.' },
  't.owe.no': { html: 'Add the interest, $180, to the amount borrowed, $1,500.', say: 'Add the interest, one hundred eighty dollars, to the amount borrowed, fifteen hundred dollars.' },
  'q.cb.right': { html: 'At the start you picked $2,300, and you were right. Now you can show why: the same $100 every year.', say: 'At the start you picked twenty-three hundred dollars, and you were right. Now you can show why: the same one hundred dollars every year.' },
  'q.cb.time': { html: 'At the start you picked $2,100. That is one year of interest. Three years add $100 three times.', say: 'At the start you picked twenty-one hundred dollars. That is one year of interest. Three years add one hundred dollars three times.' },
  'q.cb.comp': { html: 'At the start you picked $2,315.25. That takes 5% of the growing balance: compound interest. Simple interest stays on the $2,000.', say: 'At the start you picked two thousand three hundred fifteen dollars and twenty-five cents. That takes five percent of the growing balance: compound interest. Simple interest stays on the two thousand dollars.' },
  'q.cb.none': { html: 'Simple interest takes the rate of the principal, every year: the same amount each year.', say: 'Simple interest takes the rate of the principal, every year: the same amount each year.' },

  // 4. Prove it: Alex's $1,000 at 10% "simple" for 3 years
  'p.intro': { html: `Alex works out ${a('$1,000')} at ${b('10% simple interest per year')} for 3 years. Year 1: 10% of $1,000 = $100. Year 2: 10% of $1,100 = $110. Year 3: 10% of $1,210 = $121. “So it ends at $1,331.” Is Alex right?`, say: 'Alex works out one thousand dollars at ten percent simple interest per year for three years. Year one: ten percent of one thousand dollars is one hundred. Year two: ten percent of eleven hundred is one hundred ten. Year three: ten percent of twelve hundred ten is one hundred twenty-one. So it ends at thirteen hundred thirty-one dollars. Is Alex right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. Both rules start the same: 10% of $1,000 is $100.', say: 'Right. Both rules start the same: ten percent of one thousand dollars is one hundred.' },
  'p.c2': { html: 'Right. The ring stays on the principal. Year 2 adds $100, not $110: the stubs come out equal.', say: 'Right. The ring stays on the principal. Year two adds one hundred dollars, not one hundred ten: the stubs come out equal.' },
  'p.c3': { html: 'Right. Alex’s stubs grow because each takes interest on earlier interest. Simple interest ends at $1,300.', say: 'Right. Alex’s stubs grow because each takes interest on earlier interest. Simple interest ends at thirteen hundred dollars.' },
  'p.no.year1': { html: 'Not after year 1: both rules take 10% of the same $1,000. They split only from year 2 on.', say: 'Not after year one: both rules take ten percent of the same one thousand dollars. They split only from year two on.' },
  'p.no.gap': { html: 'The gap grows: $0, then $10, then $31. Interest on interest keeps piling up.', say: 'The gap grows: zero, then ten dollars, then thirty-one dollars. Interest on interest keeps piling up.' },
  'p.no.always': { html: 'That is the compound rule. Simple interest is always taken of the principal.', say: 'That is the compound rule. Simple interest is always taken of the principal.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the tapes back every one. Alex used the compound rule.', say: 'That’s a proof: three claims, each with its reason, and the tapes back every one. Alex used the compound rule.' },
};
