// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/expected-value/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `A fundraiser booth has a spinner with <b>8 equal sectors</b>: 4 pay ${A('$0')}, 3 pay ${A('$2')}, and 1 pays ${A('$10')}. Over many spins, how much does the booth pay out <b>per spin, on average</b>? Pick one, and say how sure you are.`,
    say: 'A fundraiser booth has a spinner with eight equal sectors: four pay nothing, three pay two dollars, and one pays ten dollars. Over many spins, how much does the booth pay out per spin, on average? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Four steps on the same spinner. Press each one: the picture moves first, then the notation.', say: 'Four steps on the same spinner. Press each one: the picture moves first, then the notation.' },
  'e.step0': {
    html: `Turn each spin into a number: ${A('X = the prize in dollars')}. Four sectors give X = 0, three give X = 2, one gives X = 10. The table pairs each value with its probability, and the probabilities add to <b>1</b>.`,
    say: 'Turn each spin into a number: X is the prize in dollars. Four sectors give zero, three give two, one gives ten. The table pairs each value with its probability, and the probabilities add to one.',
  },
  'e.step1': {
    html: `Now draw it. Each value of X stands at its true place on a number line, and its bar is ${B('as tall as its probability')}: the $0 bar is four times as tall as the $10 bar.`,
    say: 'Now draw it. Each value of X stands at its true place on a number line, and its bar is as tall as its probability: the zero dollar bar is four times as tall as the ten dollar bar.',
  },
  'e.step2': {
    html: `Picture <b>800 spins</b> in exactly these proportions: 400 pay $0, 300 pay $2, 100 pay $10. That is $1,600 in all, or ${S('$2 per spin')}. Dividing by 800 turns each count into a probability: E(X) = 0·4/8 + 2·3/8 + 10·1/8 = 2.`,
    say: 'Picture eight hundred spins in exactly these proportions: four hundred pay nothing, three hundred pay two dollars, a hundred pay ten. That is sixteen hundred dollars in all, or two dollars per spin. Dividing by eight hundred turns each count into a probability, and the sum of value times probability is two.',
  },
  'e.step3': {
    html: `Treat the bars as weights on a beam. Put the pivot at $4, the plain average of 0, 2 and 10: the beam tips, because the heavy $0 bar pulls it down. Slide the pivot to ${S('$2')}: it balances. <b>E(X) is the balance point</b> of the distribution.`,
    say: 'Treat the bars as weights on a beam. Put the pivot at four dollars, the plain average of zero, two and ten: the beam tips, because the heavy zero dollar bar pulls it down. Slide the pivot to two dollars: it balances. E of X is the balance point of the distribution.',
  },
  'e.why': { html: 'Quick check: why is E(X) $2 and not $4, the average of the three prizes?', say: 'Quick check: why is E of X two dollars and not four, the average of the three prizes?' },
  'e.why.ok': { html: 'Yes. The prizes are not equally likely: $0 comes up four times as often as $10, so each value counts with its probability.', say: 'Yes. The prizes are not equally likely: zero comes up four times as often as ten, so each value counts with its probability.' },
  'e.why.mid': { html: '$2 is also the middle prize, but that is a coincidence: change the $10 to $20 and the middle stays $2 while E(X) becomes $3.25.', say: 'Two dollars is also the middle prize, but that is a coincidence: change the ten dollar prize to twenty and the middle stays two, while E of X becomes three twenty five.' },
  'e.why.mode': { html: 'The most likely prize is $0, not $2. E(X) is not the most likely value; it is the probability-weighted mean.', say: 'The most likely prize is zero, not two. E of X is not the most likely value; it is the probability weighted mean.' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `A quiz has <b>3 questions</b> with <b>4 choices</b> each, and you guess on every one. ${A('X = the number you get right')}. Build the distribution, then find E(X). The first value is done for you.`,
    say: 'A quiz has three questions with four choices each, and you guess on every one. X is the number you get right. Build the distribution, then find E of X. The first value is done for you.',
  },
  't.p1': { html: 'What is <b>P(X = 1)</b>: exactly one right answer out of three?', say: 'What is P of X equals one: exactly one right answer out of three?' },
  't.p1.ok': { html: `Yes: three paths (RWW, WRW, WWR), each (1/4)(3/4)(3/4) = 9/64. Together ${S('27/64')}.`, say: 'Yes: three paths, right wrong wrong, wrong right wrong, and wrong wrong right, each nine sixty fourths. Together twenty seven sixty fourths.' },
  't.p1.path': { html: '9/64 is one path, right then wrong then wrong. The right answer can be on any of the three questions: three paths.', say: 'Nine sixty fourths is one path, right then wrong then wrong. The right answer can be on any of the three questions: three paths.' },
  't.p1.equal': { html: 'X has four values, but they are not equally likely. Add up the paths that give one right answer.', say: 'X has four values, but they are not equally likely. Add up the paths that give one right answer.' },
  't.p1.no': { html: 'Each path with one right answer has probability (1/4)(3/4)(3/4). How many such paths are there?', say: 'Each path with one right answer has probability one fourth times three fourths times three fourths. How many such paths are there?' },
  't.ev': { html: 'The table is complete and adds to 1. Now find <b>E(X)</b>, the expected number right. Type a decimal.', say: 'The table is complete and adds to one. Now find E of X, the expected number right. Type a decimal.' },
  't.ev.ok': { html: `Yes: 0·27/64 + 1·27/64 + 2·9/64 + 3·1/64 = 48/64 = ${S('0.75')}. It is also n·p = 3 × 1/4.`, say: 'Yes: zero plus twenty seven sixty fourths plus eighteen sixty fourths plus three sixty fourths makes forty eight sixty fourths, which is zero point seven five. It is also three times one fourth.' },
  't.ev.plain': { html: '1.5 is the plain average of 0, 1, 2 and 3. Weight each value by its probability.', say: 'One point five is the plain average of zero, one, two and three. Weight each value by its probability.' },
  't.ev.sumP': { html: 'The probabilities always add to 1. E(X) adds value × probability.', say: 'The probabilities always add to one. E of X adds value times probability.' },
  't.ev.no': { html: 'Multiply each value by its probability, then add the four products.', say: 'Multiply each value by its probability, then add the four products.' },
  't.empty': { html: 'Type your answer first.', say: 'Type your answer first.' },
  't.judge': { html: 'E(X) = 0.75. Can you get <b>0.75</b> questions right on one quiz?', say: 'E of X is zero point seven five. Can you get zero point seven five questions right on one quiz?' },
  't.judge.ok': { html: 'Right: one quiz gives a whole number. 0.75 is the long-run average number right per quiz, the balance point of the bars.', say: 'Right: one quiz gives a whole number. Zero point seven five is the long run average number right per quiz, the balance point of the bars.' },
  't.judge.round': { html: 'Rounding makes it a promise it does not make: X = 0 is just as likely as X = 1 here. Keep 0.75 as an average.', say: 'Rounding makes it a promise it does not make: zero right is just as likely as one right here. Keep zero point seven five as an average.' },
  't.judge.mode': { html: 'E(X) is not the most likely result. It can’t even happen on one quiz: it is the average over many quizzes.', say: 'E of X is not the most likely result. It can’t even happen on one quiz: it is the average over many quizzes.' },
  'q.cb.right': { html: 'At the start you picked $2, and you were right: each prize counts with its probability.', say: 'At the start you picked two dollars, and you were right: each prize counts with its probability.' },
  'q.cb.plain': { html: 'At the start you picked $4, the plain average of the prizes. That treats $10 as just as likely as $0. Weighted by probability it is $2.', say: 'At the start you picked four dollars, the plain average of the prizes. That treats ten dollars as just as likely as nothing. Weighted by probability it is two dollars.' },
  'q.cb.mode': { html: 'At the start you picked $0, the most likely prize. But the $2 and $10 spins pay too: the average per spin is $2.', say: 'At the start you picked nothing, the most likely prize. But the two and ten dollar spins pay too: the average per spin is two dollars.' },
  'q.cb.none': { html: 'E(X) weights each value by its probability: the long-run average per trial.', say: 'E of X weights each value by its probability: the long run average per trial.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `Back to the spinner. Ana says: “A distribution balances at its <b>most likely value</b>. The beam will balance at $0.” Is Ana right?`,
    say: 'Back to the spinner. Ana says: a distribution balances at its most likely value. The beam will balance at zero dollars. Is Ana right?',
  },
  'p.test': { html: 'Let’s test it. Put the pivot at m and work out the turning effect. Fill each “because”.', say: 'Let’s test it. Put the pivot at m and work out the turning effect. Fill each because.' },
  'p.build': { html: 'Now prove where it balances, for any pivot m. Fill each “because” with the reason that makes the line true.', say: 'Now prove where it balances, for any pivot m. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. (x − m)P(x) = x·P(x) − m·P(x) for every value, so the sum splits in two.', say: 'Right. Each term multiplies out into x times P of x, minus m times P of x, so the sum splits in two.' },
  'p.c2': { html: 'Right. m is the same in every term, and the probabilities of a distribution add to 1.', say: 'Right. m is the same in every term, and the probabilities of a distribution add to one.' },
  'p.c3': { html: 'Right. E(X) − m is zero only when m = E(X). Here E(X) = 2, so at m = 0 the turning effect is 2: the beam tips.', say: 'Right. E of X minus m is zero only when m equals E of X. Here E of X is two, so at zero the turning effect is two: the beam tips.' },
  'p.no.equal': { html: 'The values are not equally weighted: each one carries its probability.', say: 'The values are not equally weighted: each one carries its probability.' },
  'p.no.mode': { html: 'The biggest bar pulls hardest, but bars far from the pivot pull too: distance counts as well as height.', say: 'The biggest bar pulls hardest, but bars far from the pivot pull too: distance counts as well as height.' },
  'p.no.sum': { html: 'The probabilities of a distribution add to 1, whatever the number of values.', say: 'The probabilities of a distribution add to one, whatever the number of values.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': {
    html: `That proof works for <b>every</b> distribution: the turning effect about m is E(X) − m, so the beam balances at m = E(X) and nowhere else. Ana is wrong: this one balances at ${S('$2')}, not at the most likely $0.`,
    say: 'That proof works for every distribution: the turning effect about m is E of X minus m, so the beam balances at E of X and nowhere else. Ana is wrong: this one balances at two dollars, not at the most likely zero.',
  },
};
