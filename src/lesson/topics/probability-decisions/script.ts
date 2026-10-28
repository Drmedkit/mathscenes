// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/probability-decisions/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question: the phone plan ----------
  'q.intro': {
    html: `You buy an $800 phone. The store offers a 2-year protection plan for ${A('$120')}. Without it, a break costs a ${A('$300')} repair, and about ${B('15%')} of these phones break within two years. Which choice costs <b>less on average</b>? Pick one, and say how sure you are.`,
    say: 'You buy an eight hundred dollar phone. The store offers a two year protection plan for a hundred and twenty dollars. Without it, a break costs a three hundred dollar repair, and about fifteen percent of these phones break within two years. Which choice costs less on average? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Four steps on the same phone. Press each one: the picture moves first, then the notation.', say: 'Four steps on the same phone. Press each one: the picture moves first, then the notation.' },
  'e.step0': {
    html: `Lay out the decision. The ${A('square')} is yours: buy or skip. Each ${B('circle')} is chance: the phone breaks (0.15) or keeps working (0.85). Chance still acts after <b>both</b> choices.`,
    say: 'Lay out the decision. The square is yours: buy or skip. Each circle is chance: the phone breaks, with probability zero point one five, or keeps working. Chance still acts after both choices.',
  },
  'e.step1': {
    html: 'Now a net payoff on every leaf, from your side. Buy: you pay $120 whatever happens, so −$120 twice. Skip: −$300 if it breaks, $0 if not. Costs are negative.',
    say: 'Now a net payoff on every leaf, from your side. Buy: you pay a hundred and twenty dollars whatever happens, so minus one twenty twice. Skip: minus three hundred if it breaks, nothing if not. Costs are negative.',
  },
  'e.step2': {
    html: `Weight each payoff by its chance. Buy: E = ${S('−$120')}. Skip: 0.15 × (−$300) + 0.85 × $0 = ${S('−$45')}. On expected cost, skipping wins by $75.`,
    say: 'Weight each payoff by its chance. Buy: the expected value is minus a hundred and twenty. Skip: zero point one five times minus three hundred, plus nothing, is minus forty five. On expected cost, skipping wins by seventy five dollars.',
  },
  'e.step3': {
    html: 'But look at the downside. Skipping balances at −$45, yet one phone never costs $45: it costs $0 or <b>$300</b>. If a $300 bill would really hurt, the plan buys certainty. So: skip, <b>unless</b> a $300 surprise is more than you can absorb.',
    say: 'But look at the downside. Skipping balances at minus forty five, yet one phone never costs forty five: it costs nothing or three hundred. If a three hundred dollar bill would really hurt, the plan buys certainty. So: skip, unless a three hundred dollar surprise is more than you can absorb.',
  },
  'e.why': { html: 'Quick check: why is skipping cheaper on average, even though a break costs $300?', say: 'Quick check: why is skipping cheaper on average, even though a break costs three hundred dollars?' },
  'e.why.ok': { html: 'Yes. The $300 only happens 15% of the time: 0.15 × $300 = $45 a phone on average, against $120 for sure.', say: 'Yes. The three hundred only happens fifteen percent of the time: that is forty five dollars a phone on average, against a hundred and twenty for sure.' },
  'e.why.mode': { html: 'Not quite: $0 is the most likely cost, but the average counts the $300 breaks too. That is why it is −$45, not $0.', say: 'Not quite: nothing is the most likely cost, but the average counts the three hundred dollar breaks too. That is why it is minus forty five, not zero.' },
  'e.why.free': { html: 'Skipping is not free: the phone can still break, and then you pay all $300. That branch is in the average.', say: 'Skipping is not free: the phone can still break, and then you pay all three hundred. That branch is in the average.' },
  // ---------- 3 your turn: the club fundraiser ----------
  't.intro': {
    html: `A club plans its fundraiser. ${A('Outdoors')}: ${A('$2,000')} profit if dry, ${A('−$500')} if it rains (refunds and spoiled food). The ${B('gym')}: a sure ${B('$1,400')} after rent. The forecast: ${B('20%')} chance of rain.`,
    say: 'A club plans its fundraiser. Outdoors: two thousand dollars profit if dry, a five hundred dollar loss if it rains, from refunds and spoiled food. The gym: a sure fourteen hundred after rent. The forecast: a twenty percent chance of rain.',
  },
  't.gym': { html: 'The gym is done for you: one sure value, so E(gym) = $1,400.', say: 'The gym is done for you: one sure value, so its expected value is fourteen hundred dollars.' },
  't.ev': { html: 'Find <b>E(outdoors)</b>, the expected profit outdoors.', say: 'Find the expected profit outdoors.' },
  't.ev.ok': { html: `Yes: 0.8 × $2,000 + 0.2 × (−$500) = $1,600 − $100 = ${S('$1,500')}. A bit more than the gym.`, say: 'Yes: zero point eight times two thousand, plus zero point two times minus five hundred, makes fifteen hundred dollars. A bit more than the gym.' },
  't.ev.plain': { html: '$750 is the plain average of $2,000 and −$500. Rain is not 50-50 here: weight by 0.8 and 0.2.', say: 'Seven fifty is the plain average of the two payoffs. Rain is not fifty fifty here: weight by zero point eight and zero point two.' },
  't.ev.drop': { html: '$1,600 leaves out the rainy branch. It still happens 20% of the time, with −$500.', say: 'Sixteen hundred leaves out the rainy branch. It still happens twenty percent of the time, with a five hundred dollar loss.' },
  't.ev.sign': { html: 'In the rain the club loses $500: that payoff is negative, so it lowers the average.', say: 'In the rain the club loses five hundred dollars: that payoff is negative, so it lowers the average.' },
  't.ev.no': { html: 'Multiply each payoff by its chance, then add: 0.8 for dry, 0.2 for rain.', say: 'Multiply each payoff by its chance, then add: zero point eight for dry, zero point two for rain.' },
  't.empty': { html: 'Type your answer first.', say: 'Type your answer first.' },
  't.sens': { html: 'The forecast could be off. The table recomputes E(outdoors) for other rain chances. Between which two does the <b>better choice</b> switch to the gym?', say: 'The forecast could be off. The table recomputes the expected profit outdoors for other rain chances. Between which two does the better choice switch to the gym?' },
  't.sens.ok': { html: 'Right: at 0.2 outdoors wins ($1,500 vs $1,400), at 0.3 the gym does ($1,250). The changeover is at 0.24.', say: 'Right: at zero point two outdoors wins, at zero point three the gym does. The changeover is at zero point two four.' },
  't.sens.late': { html: 'At 0.3, outdoors is already down to $1,250, below the gym’s $1,400. Look one column earlier.', say: 'At zero point three, outdoors is already down to twelve fifty, below the gym. Look one column earlier.' },
  't.sens.never': { html: 'Look along the row: at 0.4, outdoors gives $1,000, less than the gym. It does switch.', say: 'Look along the row: at zero point four, outdoors gives a thousand, less than the gym. It does switch.' },
  't.judge': { html: 'One more fact: the club’s account holds only <b>$300</b>. A rainy day would leave it owing money. What do you recommend?', say: 'One more fact: the club’s account holds only three hundred dollars. A rainy day would leave it owing money. What do you recommend?' },
  't.judge.ok': { html: 'Right: the EVs are close ($1,500 vs $1,400), the rain chance is unsure, and the $500 downside is more than the club can cover. The gym is the sound call.', say: 'Right: the expected values are close, the rain chance is unsure, and the five hundred dollar downside is more than the club can cover. The gym is the sound call.' },
  't.judge.ev': { html: 'Higher EV is not the only reason that counts: the club cannot cover a $500 loss. A limit like that can rationally change the choice.', say: 'Higher expected value is not the only reason that counts: the club cannot cover a five hundred dollar loss. A limit like that can rationally change the choice.' },
  't.judge.half': { html: 'Rain is not 50-50: the forecast says 20%. The good reason for the gym is the downside, not the coin flip.', say: 'Rain is not fifty fifty: the forecast says twenty percent. The good reason for the gym is the downside, not a coin flip.' },
  'q.cb.right': { html: 'At the start you picked skipping, and on average you were right: −$45 against −$120. Now you also know when the plan can still make sense.', say: 'At the start you picked skipping, and on average you were right: minus forty five against minus a hundred and twenty. Now you also know when the plan can still make sense.' },
  'q.cb.prize': { html: 'At the start you picked the plan because it saves $300. It does, but only 15% of the time: that is $45 on average, for a $120 price.', say: 'At the start you picked the plan because it saves three hundred dollars. It does, but only fifteen percent of the time: that is forty five dollars on average, for a hundred and twenty dollar price.' },
  'q.cb.half': { html: 'At the start you said it makes no difference, as if breaking were 50-50. With the real 15%, skipping costs $45 on average, the plan $120.', say: 'At the start you said it makes no difference, as if breaking were fifty fifty. With the real fifteen percent, skipping costs forty five dollars on average, the plan a hundred and twenty.' },
  'q.cb.none': { html: 'The average weights each payoff by its chance; the downside tells you what one bad outcome would cost.', say: 'The average weights each payoff by its chance; the downside tells you what one bad outcome would cost.' },
  // ---------- 4 prove it: splitting the stake ----------
  'p.intro': {
    html: `A $2,000 stake in one festival stall nets <b>+$600 or −$200</b>, each with probability ½. Theo says: “Split it, $1,000 into each of two stalls in different cities. Two chances to win, so the <b>expected</b> payoff goes up.” Is Theo right?`,
    say: 'A two thousand dollar stake in one festival stall nets plus six hundred or minus two hundred, each with probability one half. Theo says: split it, a thousand into each of two stalls in different cities. Two chances to win, so the expected payoff goes up. Is Theo right?',
  },
  'p.test': { html: 'Let’s test it. Build the split’s distribution, then its EV and its SD. Fill each “because”.', say: 'Let’s test it. Build the split’s distribution, then its expected value and its standard deviation. Fill each because.' },
  'p.build': { html: 'Now prove what splitting does. Fill each “because” with the reason that makes the line true.', say: 'Now prove what splitting does. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. The stalls are independent, so each of the four pairs has probability ½ × ½ = ¼; two pairs give +$200.', say: 'Right. The stalls are independent, so each of the four pairs has probability one fourth; two of the pairs give plus two hundred.' },
  'p.c2': { html: 'Right. Each $1,000 half has half the EV, $100, so the two together give $200: the same as one stall.', say: 'Right. Each half has half the expected value, a hundred dollars, so the two together give two hundred: the same as one stall.' },
  'p.c3': { html: 'Right. The extremes now have probability ¼ each, and the middle +$200 takes half, so the SD drops from $400 to about $283.', say: 'Right. The extremes now have probability one fourth each, and the middle takes half, so the standard deviation drops from four hundred to about two hundred eighty three.' },
  'p.no.equal': { html: 'Three totals are not equally likely: +$200 comes from two of the four pairs.', say: 'Three totals are not equally likely: plus two hundred comes from two of the four pairs.' },
  'p.no.double': { html: 'Two stalls, but each gets half the money: half of each EV adds back to the same EV.', say: 'Two stalls, but each gets half the money: half of each expected value adds back to the same expected value.' },
  'p.no.linked': { html: 'Not if one storm hits both stalls: then they rise and fall together and the SD stays $400. Here they are independent.', say: 'Not if one storm hits both stalls: then they rise and fall together and the spread stays the same. Here they are independent.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': {
    html: `Theo is wrong about the EV: splitting keeps it at ${S('$200')}. What it changes is the risk: the bars move in toward the same balance point, and the SD falls from $400 to about $283. Same reward, less risk, as long as the stalls are independent.`,
    say: 'Theo is wrong about the expected value: splitting keeps it at two hundred dollars. What it changes is the risk: the bars move in toward the same balance point, and the standard deviation falls from four hundred to about two hundred eighty three. Same reward, less risk, as long as the stalls are independent.',
  },
};
