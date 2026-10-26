// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the input / changes in the input, amber; b = the output / changes in the output, teal; s = the model and the
// answers, lime), `say` is the same line written to be read aloud (no digits or symbols).
// pages/lessons/linear-models/voice/lines.json holds the `say` texts (the test keeps the two in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const I = (x: string) => `<i>${x}</i>`, G = I('g'), C = I('C'), W = I('w'), P = I('P');

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question ----------
  'q.intro': { html: `Sam's arcade card: the receipts say ${a('4 games')} cost ${b('$13')} in total, card included, and ${a('10 games')} cost ${b('$28')}. Sam has ${s('$40')} to spend, card included. How many games can Sam play? Pick an answer, and say how sure you are.`,
    say: 'Sam’s arcade card: the receipts say four games cost thirteen dollars in total, card included, and ten games cost twenty-eight dollars. Sam has forty dollars to spend, card included. How many games can Sam play? Pick an answer, and say how sure you are.' },

  // ---------- 2. Worked example ----------
  'e.intro': { html: 'Four steps: name the quantities, find the rate, walk back to the start, then let the story decide the answer.', say: 'Four steps: name the quantities, find the rate, walk back to the start, then let the story decide the answer.' },
  'e.step0': { html: `Two quantities change together. Input ${G} = ${a('games played')}: a count, and ${G} = 0 means the card is new. Output ${C} = ${b('total cost in dollars')}, card included.`,
    say: 'Two quantities change together. The input g is the number of games played: a count, and g equals zero means the card is new. The output C is the total cost in dollars, card included.' },
  'e.step1': { html: `From the first receipt to the second: ${a('6 more games')}, ${b('$15 more')}. The rate is $15 ÷ 6 = ${s('$2.50 per game')}. Dollars per game: output unit per input unit.`,
    say: 'From the first receipt to the second: six more games, fifteen dollars more. The rate is fifteen divided by six, two dollars and fifty cents per game. Dollars per game: output unit per input unit.' },
  'e.step2': { html: `$13 is NOT the start: it is after 4 games. Walk back 4 games: 13 − 2.5 × 4 = ${s('$3')}, the card itself. So ${s(`${C} = 2.5${G} + 3`)}. Units check: dollars per game × games = dollars, plus dollars. ✓ And games come whole: the model is dots, not a solid line.`,
    say: 'Thirteen dollars is not the start: it is after four games. Walk back four games: thirteen minus two and a half times four is three dollars, the card itself. So C equals two point five g, plus three. Units check: dollars per game times games is dollars, plus dollars. And games come whole: the model is dots, not a solid line.' },
  'e.step3': { html: `"$40 to spend" is a limit: ${s(`2.5${G} + 3 ≤ 40`)}, so ${G} ≤ 14.8. Not 14.8 games, and not 15: 15 games cost $40.50. The story decides the direction: ${s('14 games')}, for $38.`,
    say: 'Forty dollars to spend is a limit: two point five g, plus three, is at most forty, so g is at most fourteen point eight. Not fourteen point eight games, and not fifteen: fifteen games cost forty dollars and fifty cents. The story decides the direction: fourteen games, for thirty-eight dollars.' },
  'e.why': { html: 'Quick check: why 14 games, when 14.8 is closer to 15?', say: 'Quick check: why fourteen games, when fourteen point eight is closer to fifteen?' },
  'e.why.ok': { html: 'Yes. The limit decides: check the neighbor. 15 games break the $40, 14 games fit. Nearest is not the rule.', say: 'Yes. The limit decides: check the neighbor. Fifteen games break the forty dollars, fourteen games fit. Nearest is not the rule.' },
  'e.why.near': { html: 'Rounding to the nearest gives 15, and 15 games cost $40.50: Sam cannot pay that. The direction comes from the limit.', say: 'Rounding to the nearest gives fifteen, and fifteen games cost forty dollars and fifty cents: Sam cannot pay that. The direction comes from the limit.' },
  'e.why.drop': { html: 'Here dropping the decimal lands on 14, but only by luck. If Sam NEEDED at least $40 worth, dropping would leave him short. The reason is the limit.', say: 'Here dropping the decimal lands on fourteen, but only by luck. If Sam needed at least forty dollars worth, dropping would leave him short. The reason is the limit.' },

  // ---------- 3. Your turn ----------
  't.intro': { html: `Your turn. A team runs a car wash. After ${a('10 cars')} their profit is ${b('−$80')} (still in the hole); after ${a('25 cars')} it is ${b('$40')}. The rate is done for you: $120 ÷ 15 = ${s('$8 per car')}.`,
    say: 'Your turn. A team runs a car wash. After ten cars their profit is negative eighty dollars, still in the hole. After twenty-five cars it is forty dollars. The rate is done for you: one hundred twenty divided by fifteen, eight dollars per car.' },
  't.b': { html: `Walk back to ${W} = 0. What is the profit before any car, b?`, say: 'Walk back to w equals zero. What is the profit before any car?' },
  't.b.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.b.ok': { html: `Yes: −80 − 8 × 10 = −160. The team spent $160 on supplies before the first car. ${s(`${P} = 8${W} − 160`)}.`, say: 'Yes: negative eighty, minus eight times ten, is negative one hundred sixty. The team spent one hundred sixty dollars on supplies before the first car. P equals eight w, minus one hundred sixty.' },
  't.b.first': { html: '−80 is the profit after 10 cars, not at the start. Walk back 10 cars at $8 each.', say: 'Negative eighty is the profit after ten cars, not at the start. Walk back ten cars, at eight dollars each.' },
  't.b.sign': { html: 'Walking back undoes the earnings: take 8 × 10 away, do not add it.', say: 'Walking back undoes the earnings: take eight times ten away, do not add it.' },
  't.b.no': { html: 'Start from (10, −80) and go back 10 cars: −80 − 8 × 10.', say: 'Start from ten cars and negative eighty dollars, and go back ten cars: negative eighty, minus eight times ten.' },
  't.ineq': { html: `The team wants a profit of ${s('at least $250')}. Which inequality says that?`, say: 'The team wants a profit of at least two hundred fifty dollars. Which inequality says that?' },
  't.ineq.ok': { html: 'Yes: "at least" means $250 or more, $250 included.', say: 'Yes: at least means two hundred fifty dollars or more, two hundred fifty included.' },
  't.ineq.strict': { html: '"At least $250" includes $250 itself: use ≥, not >.', say: 'At least two hundred fifty includes two hundred fifty itself: use greater than or equal, not greater than.' },
  't.ineq.rev': { html: '"At least" means $250 or MORE. ≤ would mean $250 or less.', say: 'At least means two hundred fifty or more. Less than or equal would mean two hundred fifty or less.' },
  't.ineq.eq': { html: 'A goal of "at least" allows many profits, not exactly one: use an inequality.', say: 'A goal of at least allows many profits, not exactly one: use an inequality.' },
  't.w': { html: `8${W} − 160 ≥ 250 gives ${W} ≥ 51.25. How many cars must they wash?`, say: 'Eight w minus one hundred sixty, at least two hundred fifty, gives w at least fifty-one point two five. How many cars must they wash?' },
  't.w.ok': { html: `Yes: ${s('52 cars')}. 51 cars give $248, just short; 52 give $256. "Enough" rounds UP.`, say: 'Yes: fifty-two cars. Fifty-one cars give two hundred forty-eight dollars, just short. Fifty-two give two hundred fifty-six. Enough rounds up.' },
  't.w.near': { html: '51.25 rounds to 51, but 51 cars give only $248: short of $250. "Enough" goes UP.', say: 'Fifty-one point two five rounds to fifty-one, but fifty-one cars give only two hundred forty-eight dollars: short. Enough goes up.' },
  't.w.frac': { html: 'Nobody washes a quarter of a car: w is a count. Pick the whole number that reaches the goal.', say: 'Nobody washes a quarter of a car: w is a count. Pick the whole number that reaches the goal.' },
  't.w.no': { html: 'w must be at least 51.25 and a whole number: the first whole number past 51.25.', say: 'w must be at least fifty-one point two five, and a whole number: the first whole number past it.' },
  'q.cb.right': { html: 'At the start you picked 14, and you were right. Now you know why: the model gives 14.8, and the limit rounds DOWN.', say: 'At the start you picked fourteen, and you were right. Now you know why: the model gives fourteen point eight, and the limit rounds down.' },
  'q.cb.near': { html: 'At the start you picked 15: the nearest whole number to 14.8. But 15 games cost $40.50. A limit sets the direction.', say: 'At the start you picked fifteen: the nearest whole number to fourteen point eight. But fifteen games cost forty dollars and fifty cents. A limit sets the direction.' },
  'q.cb.prop': { html: 'At the start you picked 12: that treats $13 for 4 games as $3.25 per game. The card is paid once; each game is $2.50.', say: 'At the start you picked twelve: that treats thirteen dollars for four games as three twenty-five per game. The card is paid once. Each game is two fifty.' },
  'q.cb.none': { html: 'Rate from two data points, walk back to the start, and let the story decide which whole number counts.', say: 'Rate from two data points, walk back to the start, and let the story decide which whole number counts.' },

  // ---------- 4. Prove it ----------
  'p.intro': { html: `A print shop charges ${b('$12')} setup plus ${b('$0.75')} per poster: ${s(`${C} = 0.75${I('p')} + 12`)}. Ava has exactly $50 to spend and says: "(50 − 12) ÷ 0.75 = 50.67, so ${a('51 posters')} cost exactly $50." Is Ava right?`,
    say: 'A print shop charges twelve dollars setup plus seventy-five cents per poster. Ava has exactly fifty dollars to spend and says: fifty minus twelve, divided by point seven five, is fifty point six seven, so fifty-one posters cost exactly fifty dollars. Is Ava right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Right. Put 51 back into the model: $50.25. Ava’s rounding changed the total.', say: 'Right. Put fifty-one back into the model: fifty dollars and twenty-five cents. Ava’s rounding changed the total.' },
  'p.c2': { html: 'Right. The dots jump from $49.50 to $50.25: the $50 line passes between them and hits no dot.', say: 'Right. The dots jump from forty-nine fifty to fifty twenty-five: the fifty-dollar line passes between them and hits no dot.' },
  'p.c3': { html: 'Right. The exact question has no answer; the question with a limit does: 50 posters.', say: 'Right. The exact question has no answer. The question with a limit does: fifty posters.' },
  'p.no.round': { html: 'Rounding changes the input, so it changes the total: 51 posters cost $50.25. “Exactly” means exactly.', say: 'Rounding changes the input, so it changes the total: fifty-one posters cost fifty dollars and twenty-five cents. Exactly means exactly.' },
  'p.no.eq': { html: 'The equation has a solution, 50.67, but posters are counted: the story only allows whole numbers.', say: 'The equation has a solution, fifty point six seven, but posters are counted: the story only allows whole numbers.' },
  'p.no.drop': { html: '50 posters cost $49.50, not $50. Dropping the decimal does not make it exact either.', say: 'Fifty posters cost forty-nine fifty, not fifty. Dropping the decimal does not make it exact either.' },
  'p.no.other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: an exact target on a count can have no solution, and rounding does not create one. A limit (at most, at least) always has a whole-number answer in the right direction.', say: 'That’s a proof: an exact target on a count can have no solution, and rounding does not create one. A limit, at most or at least, always has a whole number answer in the right direction.' },
};
