// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours),
// `say` is the same line written to be read aloud; pages/lessons/linear-patterns/voice/lines.json holds the `say`
// texts (the test keeps the two in step). No imports, so a plain `node --experimental-strip-types` can read it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const w = (x: string) => `<b class="w">${x}</b>`, l2 = (x: string) => `<b class="w2">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: Maya's savings 5, 8, 11, 15, 19
  'q.intro': { html: `Maya writes down how much she has ${a('saved')} at the end of each week.`, say: 'Maya writes down how much she has saved at the end of each week.' },
  'q.ask': { html: 'Could this table show a linear relationship: the same change every week?', say: 'Could this table show a linear relationship: the same change every week?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Each output minus the one above it: ${b('+3, +3, +4, +4')}.`, say: 'Each output minus the one above it: plus three, plus three, plus four, plus four.' },
  'e.s2': { html: `The first two changes match, then it jumps to ${w('+4')}. Not the same every week, so ${s('not linear')}.`, say: 'The first two changes match, then it jumps to plus four. Not the same every week, so not linear.' },
  'e.s3': { html: 'Weeks across, dollars up. A ruler through the first points misses weeks 3 and 4.', say: 'Weeks across, dollars up. A ruler through the first points misses weeks three and four.' },
  'e.s4': { html: `${l2('Leo')} starts with ${a('$5')} and saves ${b('$3')} every week. His points sit on ${s('one straight line')}: the same change every step.`, say: 'Leo starts with five dollars and saves three dollars every week. His points sit on one straight line: the same change every step.' },
  'e.why': { html: "Quick check: why are Leo's points on one straight line?", say: "Quick check: why are Leo's points on one straight line?" },
  'e.w-ok': { html: 'Yes. Each step right is one week, and each step goes up the same $3. Equal steps, equal rises: a straight line.', say: 'Yes. Each step right is one week, and each step goes up the same three dollars. Equal steps, equal rises: a straight line.' },
  'e.w-up': { html: "Maya's savings go up every week too, and her points are not on one line. Going up is not enough.", say: "Maya's savings go up every week too, and her points are not on one line. Going up is not enough." },
  'e.w-two': { html: "Maya's first two changes were +3 as well. Check every step, not just the first two.", say: "Maya's first two changes were plus three as well. Check every step, not just the first two." },
  // 3. Your turn: a tank, 40 gallons, drains 6 gallons every 2 minutes
  't.intro': { html: `A tank holds ${a('40 gallons')} of water and drains. The table shows the water every 2 minutes. The first two steps are done for you.`, say: 'A tank holds forty gallons of water, and it drains. The table shows the water every two minutes. The first two steps are done for you.' },
  't.s1': { html: `Every change is ${b('−6')}.`, say: 'Every change is minus six.' },
  't.s2': { html: 'All the same. A steady decrease is a constant change too, so it could be linear.', say: 'All the same. A steady decrease is a constant change too, so it could be linear.' },
  't.unit': { html: `Careful: each row is 2 minutes. How many gallons drain per ${b('1 minute')}?`, say: 'Careful: each row is two minutes. How many gallons drain per one minute?' },
  't.u-ok': { html: `Yes: ${b('6')} gallons in 2 minutes is ${s('3')} gallons each minute.`, say: 'Yes: six gallons in two minutes is three gallons each minute.' },
  't.u-six': { html: '6 gallons drain in TWO minutes. In one minute: 6 ÷ 2 = 3.', say: 'Six gallons drain in two minutes. In one minute: six divided by two, three.' },
  't.u-out': { html: "That's an amount of water in the tank, not a change. The change is 6 gallons every 2 minutes.", say: "That's an amount of water in the tank, not a change. The change is six gallons every two minutes." },
  't.u-other': { html: 'Look at one row: 6 gallons drain in 2 minutes. How much in 1 minute?', say: 'Look at one row: six gallons drain in two minutes. How much in one minute?' },
  't.rule': { html: 'Now describe the tank: tap a start and a change.', say: 'Now describe the tank: tap a start and a change.' },
  't.r-ok': { html: `Yes: it starts at ${a('40 gallons')} and goes ${b('down 3')} each minute.`, say: 'Yes: it starts at forty gallons and goes down three each minute.' },
  't.r-16': { html: '16 gallons is where the table ends, at 8 minutes. The start is the water at 0 minutes.', say: 'Sixteen gallons is where the table ends, at eight minutes. The start is the water at zero minutes.' },
  't.r-0': { html: 'The tank does not start empty. At 0 minutes it holds 40 gallons.', say: 'The tank does not start empty. At zero minutes it holds forty gallons.' },
  't.r-6': { html: 'Down 6 is per row, and a row is 2 minutes. Per minute it is down 3.', say: 'Down six is per row, and a row is two minutes. Per minute it is down three.' },
  't.r-up': { html: 'The water goes down, not up: down 3 each minute.', say: 'The water goes down, not up: down three each minute.' },
  't.r-slot': { html: 'The first box is the start (gallons), the second box is the change.', say: 'The first box is the start, in gallons. The second box is the change.' },
  't.lin': { html: 'Last check: could the tank table be linear, even though the water goes down?', say: 'Last check: could the tank table be linear, even though the water goes down?' },
  't.l-yes': { html: `Right. The same change every step, ${b('−3')} each minute. Down counts: the points sit on ${s('one straight line')}.`, say: 'Right. The same change every step, minus three each minute. Down counts: the points sit on one straight line.' },
  't.l-no': { html: 'Look at the graph: the points sit on one straight line, going down. A constant decrease is linear too.', say: 'Look at the graph: the points sit on one straight line, going down. A constant decrease is linear too.' },
  't.cb-0': { html: `At the start you picked “her savings go up every week”. Going up is not enough: the change must be ${s('the same every step')}.`, say: 'At the start you picked: her savings go up every week. Going up is not enough: the change must be the same every step.' },
  't.cb-1': { html: `At the start you picked “they go up $3 each week”. The first two changes were +3, then ${w('+4')}: check every step.`, say: 'At the start you picked: they go up three dollars each week. The first two changes were plus three, then plus four: check every step.' },
  't.cb-2': { html: `At the start you said no. You were right: +3, +3, +4, +4 is ${s('not the same every week')}.`, say: 'At the start you said no. You were right: plus three, plus three, plus four, plus four is not the same every week.' },
  't.cb-sure': { html: 'And you were certain. That is worth remembering: check every step.', say: 'And you were certain. That is worth remembering: check every step.' },
  // 4. Prove it: Riley's seedling 1, 3, 5, 8, 11
  'p.intro': { html: `Riley measures a ${a('seedling')} every day, joins the points and says: “It's made of straight pieces, so it is linear.”`, say: "Riley measures a seedling every day, joins the points and says: it's made of straight pieces, so it is linear." },
  'p.ask': { html: 'Is Riley right?', say: 'Is Riley right?' },
  'p.build-no': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.build-yes': { html: "Let's test it. Build the argument, and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.k1': { html: 'The days go up in equal steps,', say: 'The days go up in equal steps,' },
  'p.k2': { html: `but the height changes by ${b('+2, +2')}, then ${w('+3')},`, say: 'but the height changes by plus two, plus two, then plus three,' },
  'p.k3': { html: `so the points are not on one straight line: ${s('not linear')}.`, say: 'so the points are not on one straight line: not linear.' },
  'p.c1': { html: 'Every step right is one day.', say: 'Every step right is one day.' },
  'p.c2': { html: 'Five to eight is +3, not +2. That step breaks the pattern.', say: 'Five to eight is plus three, not plus two. That step breaks the pattern.' },
  'p.c3': { html: 'A ruler through the first points misses the last two.', say: 'A ruler through the first points misses the last two.' },
  'p.w-pieces': { html: "Two straight pieces with a corner are not ONE straight line. That is Riley's slip.", say: "Two straight pieces with a corner are not one straight line. That is Riley's slip." },
  'p.w-up': { html: 'True, it goes up every day, but going up does not make it linear.', say: 'True, it goes up every day, but going up does not make it linear.' },
  'p.w-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: "That's a proof: equal input steps, one change that differs, so not linear. One conflicting step is enough.", say: "That's a proof: equal input steps, one change that differs, so not linear. One conflicting step is enough." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
