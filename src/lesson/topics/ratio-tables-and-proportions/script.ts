// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the first quantity, b = the second, s = the answer, w = wrong), `say` is the same line written to be read aloud;
// pages/lessons/ratio-tables-and-proportions/voice/lines.json holds the `say` texts (the test keeps them in step).
// No imports, so a plain `node --experimental-strip-types` can read it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const w = (x: string) => `<b class="w">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: lemonade 4 : 6, you have 10 cups of lemon juice
  'q.intro': { html: `A lemonade recipe for the school fair uses ${a('4 cups of lemon juice')} for every ${b('6 cups of water')}.`, say: 'A lemonade recipe for the school fair uses four cups of lemon juice for every six cups of water.' },
  'q.ask': { html: `You have ${a('10 cups of lemon juice')}. How much water keeps the same taste?`, say: 'You have ten cups of lemon juice. How much water keeps the same taste?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example: pair -> divide both -> multiply both -> check every row
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Put the pair in one row of a ratio table: ${a('4')} cups of lemon juice with ${b('6')} cups of water. The two numbers always travel together.`, say: 'Put the pair in one row of a ratio table: four cups of lemon juice with six cups of water. The two numbers always travel together.' },
  'e.s2': { html: `Split the recipe into two equal batches: ${a('2')} cups of lemon juice and ${b('3')} cups of water each. Divide <em>both</em> columns by 2.`, say: 'Split the recipe into two equal batches: two cups of lemon juice and three cups of water each. Divide both columns by two.' },
  'e.s3': { html: `Five of those small batches: ${a('10')} cups of lemon juice and ${s('15')} cups of water. Multiply <em>both</em> columns by 5.`, say: 'Five of those small batches: ten cups of lemon juice and fifteen cups of water. Multiply both columns by five.' },
  'e.s4': { html: `Check every row: the water is ${s('1.5 times')} the lemon juice, every time. Same ratio, same taste.`, say: 'Check every row: the water is one and a half times the lemon juice, every time. Same ratio, same taste.' },
  'e.why': { html: 'Quick check: why may we divide both columns by 2?', say: 'Quick check: why may we divide both columns by two?' },
  'e.why.ok': { html: 'Yes. Half a recipe has half of each, so every batch is the same mix: still 2 to 3.', say: 'Yes. Half a recipe has half of each, so every batch is the same mix: still two to three.' },
  'e.why.diff': { html: `Taking 2 cups off both gives ${w('2 : 4')}. Then the water is 2 times the lemon juice, not 1.5 times: a weaker lemonade.`, say: 'Taking two cups off both gives two to four. Then the water is two times the lemon juice, not one and a half times: a weaker lemonade.' },
  'e.why.one': { html: `Then 2 cups of lemon juice go with 6 cups of water: ${w('3 times')} as much water. The taste changes.`, say: 'Then two cups of lemon juice go with six cups of water: three times as much water. The taste changes.' },
  // 3. Your turn: 3 cases hold 24 bottles, how many in 7 cases
  't.intro': { html: `A store packs sparkling water in cases: ${a('3 cases')} hold ${b('24 bottles')}. How many bottles are in ${a('7 cases')}? The first step is done for you.`, say: 'A store packs sparkling water in cases: three cases hold twenty-four bottles. How many bottles are in seven cases? The first step is done for you.' },
  't.s1': { html: `The pair goes in one row: ${a('3')} cases with ${b('24')} bottles.`, say: 'The pair goes in one row: three cases with twenty-four bottles.' },
  't.unit': { html: `Your step: find the row for ${a('1 case')}. How many bottles are in one case?`, say: 'Your step: find the row for one case. How many bottles are in one case?' },
  't.u-ok': { html: `Yes: divide both columns by 3. One case holds ${s('8 bottles')}.`, say: 'Yes: divide both columns by three. One case holds eight bottles.' },
  't.u-rev': { html: 'That is 3 ÷ 24: cases per bottle. You want bottles in one case: 24 ÷ 3.', say: 'That is three divided by twenty-four: cases per bottle. You want bottles in one case: twenty-four divided by three.' },
  't.u-diff': { html: 'That takes 3 away from both columns. Divide both by 3 instead: 3 cases ÷ 3 = 1 case.', say: 'That takes three away from both columns. Divide both by three instead: three cases divided by three is one case.' },
  't.u-other': { html: '3 cases become 1 case when you divide by 3. Do the same to the bottles.', say: 'Three cases become one case when you divide by three. Do the same to the bottles.' },
  't.scale': { html: `Now scale the row for 1 case up to ${a('7 cases')}. How many bottles?`, say: 'Now scale the row for one case up to seven cases. How many bottles?' },
  't.s-ok': { html: `Yes: times 7 on both sides. 7 cases hold ${s('56 bottles')}.`, say: 'Yes: times seven on both sides. Seven cases hold fifty-six bottles.' },
  't.s-diff': { html: 'That adds 4 bottles for 4 more cases, but every case holds 8 bottles. Multiply: 7 × 8.', say: 'That adds four bottles for four more cases, but every case holds eight bottles. Multiply: seven times eight.' },
  't.s-big': { html: 'That is 24 × 7, but 24 bottles fill 3 cases, not 1. Start from the row for 1 case: 7 × 8.', say: 'That is twenty-four times seven, but twenty-four bottles fill three cases, not one. Start from the row for one case: seven times eight.' },
  't.s-other': { html: 'Use the row for 1 case: 1 case holds 8 bottles. Multiply both columns by 7.', say: 'Use the row for one case: one case holds eight bottles. Multiply both columns by seven.' },
  't.rate': { html: 'Last step: name the rate with its unit.', say: 'Last step: name the rate with its unit.' },
  't.r-ok': { html: `Right: ${s('8 bottles per case')}. The unit says what the number counts.`, say: 'Right: eight bottles per case. The unit says what the number counts.' },
  't.r-rev': { html: 'Read it back: 8 cases for every bottle? It is the other way round: 8 bottles in every case.', say: 'Read it back: eight cases for every bottle? It is the other way round: eight bottles in every case.' },
  't.r-bare': { html: '8 what? A rate needs its unit: bottles per case.', say: 'Eight what? A rate needs its unit: bottles per case.' },
  't.cb-0': { html: `At the start you picked 15 cups. Right: divide to 2 : 3, then times 5. That is ${s('a ratio table at work')}.`, say: 'At the start you picked fifteen cups. Right: divide to two to three, then times five. That is a ratio table at work.' },
  't.cb-1': { html: `At the start you picked 12 cups: 6 more of each. But 10 : 12 has only 1.2 times as much water, so it tastes stronger. Multiply or divide ${s('both columns')}, never add the same amount.`, say: 'At the start you picked twelve cups: six more of each. But ten to twelve has only one point two times as much water, so it tastes stronger. Multiply or divide both columns, never add the same amount.' },
  't.cb-2': { html: `At the start you said it can't be found, because 10 is not a multiple of 4. The table found it anyway: ${s('divide first')} to 2 : 3, then multiply by 5.`, say: "At the start you said it can't be found, because ten is not a multiple of four. The table found it anyway: divide first to two to three, then multiply by five." },
  't.cb-sure': { html: 'And you were certain. That is worth remembering: the same thing to both columns.', say: 'And you were certain. That is worth remembering: the same thing to both columns.' },
  // 4. Prove it: a bike rental with a fee; Jordan adds two rows
  'p.intro': { html: `A bike rental charges a ${a('$5 fee')} plus ${b('$3 for each hour')}. Its price list shows 1 hour for $8 and 2 hours for $11.`, say: 'A bike rental charges a five dollar fee plus three dollars for each hour. Its price list shows one hour for eight dollars and two hours for eleven dollars.' },
  'p.claim': { html: 'Jordan says: “Just add the two rows. 3 hours must cost $8 + $11 = $19.”', say: 'Jordan says: just add the two rows. Three hours must cost eight plus eleven, nineteen dollars.' },
  'p.ask': { html: 'Is Jordan right?', say: 'Is Jordan right?' },
  'p.build-no': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.build-yes': { html: "Let's test it. Build the argument, and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.k1': { html: 'The price list is not proportional,', say: 'The price list is not proportional,' },
  'p.k2': { html: `every price has the ${a('$5 fee')} in it once,`, say: 'every price has the five dollar fee in it once,' },
  'p.k3': { html: `so adding two rows pays the fee twice: 3 hours cost ${s('$14')}, not $19.`, say: 'so adding two rows pays the fee twice: three hours cost fourteen dollars, not nineteen.' },
  'p.c1': { html: '8 dollars per hour in one row, 5.5 in the next: the quotient changes, so the table is not proportional.', say: 'Eight dollars per hour in one row, five and a half in the next: the quotient changes, so the table is not proportional.' },
  'p.c2': { html: 'Add a row for 0 hours: you still pay the $5 fee. In a proportional table 0 hours would cost $0.', say: 'Add a row for zero hours: you still pay the five dollar fee. In a proportional table, zero hours would cost zero dollars.' },
  'p.c3': { html: '$8 + $11 has two fees in it. 3 hours really cost $5 + 3 × $3 = $14.', say: 'Eight plus eleven has two fees in it. Three hours really cost five plus three times three: fourteen dollars.' },
  'p.w-rows': { html: 'Only in a proportional table, where every row is copies of one pair. Here the fee is not copied: it is paid once.', say: 'Only in a proportional table, where every row is copies of one pair. Here the fee is not copied: it is paid once.' },
  'p.w-more': { html: 'More hours do cost more, but that is not enough. The dollars per hour must be the same in every row.', say: 'More hours do cost more, but that is not enough. The dollars per hour must be the same in every row.' },
  'p.w-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: "That's a proof. Adding rows only works in a proportional table, where every row is copies of one pair. A fee breaks it.", say: "That's a proof. Adding rows only works in a proportional table, where every row is copies of one pair. A fee breaks it." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
