// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the input quantity, amber; b = the output quantity, teal; s = k / the rule, lime; w = wrong), `say` is the same
// line written to be read aloud. pages/lessons/proportional-relationships/voice/lines.json holds the `say` texts
// (the test keeps the two in step). The page shows a line and speaks it with ctx.say(id).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, w = (x: string) => `<b class="w">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. The question ----------
  'q.intro': { html: `Three shops sell trail mix by weight. Their price lists are on the wall.`, say: 'Three shops sell trail mix by weight. Their price lists are on the wall.' },
  'q.ask': { html: `At which shop is the ${b('cost')} proportional to the ${a('weight')}: the same price for every pound?`, say: 'At which shop is the cost proportional to the weight: the same price for every pound?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },

  // ---------- 2. Worked example: shop C ----------
  'e.intro': { html: `Shop C: ${a('6 lb')} for ${b('$15')}, ${a('2 lb')} for ${b('$5')}, ${a('3 lb')} for ${b('$7.50')}. Four steps. Press each one: the picture moves first, then the notation.`, say: 'Shop C. Six pounds for fifteen dollars, two pounds for five dollars, three pounds for seven fifty. Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s0': { html: `Every row is one point: ${a('pounds')} across, ${b('dollars')} up. The row 6 lb, $15 is the point (6, 15).`, say: 'Every row is one point: pounds across, dollars up. The row six pounds, fifteen dollars, is the point six, fifteen.' },
  'e.s1': { html: `${b('Dollars')} ÷ ${a('pounds')}, in the same order in every row: 15 ÷ 6, 5 ÷ 2 and 7.50 ÷ 3 all give ${s('2.5')}. One rate, so the three points sit on ONE ray from (0, 0).`, say: 'Dollars divided by pounds, in the same order in every row. Fifteen divided by six, five divided by two, and seven fifty divided by three all give two point five. One rate, so the three points sit on one ray from zero, zero.' },
  'e.s2': { html: `${s('k = 2.5')} dollars per pound: the cost of ONE pound. On the graph it is the point (1, 2.5): ${a('1 pound')} across, ${b('$2.50')} up.`, say: 'k is two point five dollars per pound: the cost of one pound. On the graph it is the point one, two point five: one pound across, two dollars fifty up.' },
  'e.s3': { html: `${b('cost')} = ${s('k')} × ${a('pounds')}: ${s('c = 2.5p')}. It fits every row, and 0 pounds too: 2.5 × 0 = 0, so the line starts at (0, 0).`, say: 'Cost equals k times pounds: c equals two point five p. It fits every row, and zero pounds too: two point five times zero is zero, so the line starts at zero, zero.' },
  'e.why': { html: 'Quick check: why divide in EVERY row, not just the first two?', say: 'Quick check: why divide in every row, not just the first two?' },
  'e.w-ok': { html: 'Yes. Proportional means one multiplier for every row, so every row has to pass.', say: 'Yes. Proportional means one multiplier for every row, so every row has to pass.' },
  'e.w-two': { html: `Not always. A table can agree in its first two rows and break in the third. Every row has to pass.`, say: 'Not always. A table can agree in its first two rows and break in the third. Every row has to pass.' },
  'e.w-order': { html: `Keep one order in every row: ${b('dollars')} ÷ ${a('pounds')}. Mixing the order compares different things.`, say: 'Keep one order in every row: dollars divided by pounds. Mixing the order compares different things.' },

  // ---------- 3. Your turn: gas ----------
  't.intro': { html: `Gas from one pump: ${a('4 gal')} for ${b('$14')}, ${a('10 gal')} for ${b('$35')}, ${a('6 gal')} for ${b('$21')}. I plot the rows and divide the first two. Then it’s your turn.`, say: "Gas from one pump: four gallons for fourteen dollars, ten gallons for thirty five, six gallons for twenty one. I plot the rows and divide the first two. Then it's your turn." },
  't.div': { html: `Divide the last row: ${b('dollars')} ÷ ${a('gallons')}. How many dollars per gallon?`, say: 'Divide the last row: dollars divided by gallons. How many dollars per gallon?' },
  't.d-ok': { html: `Yes: 21 ÷ 6 = ${s('3.5')}. All three rows give $3.50 per gallon, so they share one ray.`, say: 'Yes: twenty one divided by six is three point five. All three rows give three fifty per gallon, so they share one ray.' },
  't.d-flip': { html: `That is gallons ÷ dollars, the other order. Keep ${b('dollars')} ÷ ${a('gallons')}, as in the other rows.`, say: 'That is gallons divided by dollars, the other order. Keep dollars divided by gallons, as in the other rows.' },
  't.d-total': { html: `21 is the total for 6 gallons. Divide it by 6.`, say: 'Twenty one is the total for six gallons. Divide it by six.' },
  't.d-other': { html: `Divide 21 by 6.`, say: 'Divide twenty one by six.' },
  't.unit': { html: `Which point of the graph shows ${s('k')}, the price of ONE gallon?`, say: 'Which point of the graph shows k, the price of one gallon?' },
  't.u-ok': { html: `Yes: (1, 3.5). ${a('1 gallon')} across, ${b('$3.50')} up. It sits between two grid lines, so the table is the easier place to read it.`, say: 'Yes: one, three point five. One gallon across, three fifty up. It sits between two grid lines, so the table is the easier place to read it.' },
  't.u-swap': { html: `Order matters: ${a('gallons')} first, ${b('dollars')} second.`, say: 'Order matters: gallons first, dollars second.' },
  't.u-row': { html: `That is a whole row. k is the cost of ONE gallon.`, say: 'That is a whole row. k is the cost of one gallon.' },
  't.u-other': { html: `Go to 1 gallon across. How many dollars up?`, say: 'Go to one gallon across. How many dollars up?' },
  't.write': { html: `Now write the rule, with ${a('g')} for gallons and ${b('c')} for the cost. Which equation fits every row?`, say: 'Now write the rule, with g for gallons and c for the cost. Which equation fits every row?' },
  't.w-ok': { html: `Yes: ${s('c = 3.5g')}. Check a row: 3.5 × 4 = 14.`, say: 'Yes: c equals three point five g. Check a row: three point five times four is fourteen.' },
  't.w-flip': { html: `Test it with a row: 4 gallons would give g = 3.5 × 14 = 49. The cost is the output: c = 3.5g.`, say: 'Test it with a row: four gallons would give g equals three point five times fourteen, forty nine. The cost is the output: c equals three point five g.' },
  't.w-add': { html: `Test it with a row: 4 + 3.5 = 7.5, not 14. k multiplies: c = 3.5g.`, say: 'Test it with a row: four plus three point five is seven point five, not fourteen. k multiplies: c equals three point five g.' },
  't.zero': { html: `The pump starts at ${a('0 gallons')}, ${b('$0')}. How do you check that row?`, say: 'The pump starts at zero gallons, zero dollars. How do you check that row?' },
  't.z-ok': { html: `Yes. 0 ÷ 0 has no value, so a zero row is checked by multiplying: 3.5 × 0 = 0. It fits, and the ray starts at (0, 0).`, say: 'Yes. Zero divided by zero has no value, so a zero row is checked by multiplying: three point five times zero is zero. It fits, and the ray starts at zero, zero.' },
  't.z-zero': { html: `0 ÷ 0 has no value: every number times 0 is 0. Multiply instead: 3.5 × 0 = 0.`, say: 'Zero divided by zero has no value: every number times zero is zero. Multiply instead: three point five times zero is zero.' },
  't.z-reject': { html: `The row is fine. You can’t divide there, so multiply: 3.5 × 0 = 0. It fits.`, say: "The row is fine. You can't divide there, so multiply: three point five times zero is zero. It fits." },
  't.cb-right': { html: `At the start you picked ${s('Shop C')}, and you were right: every row gives $2.50 per pound. Now you can show why the others fail.`, say: 'At the start you picked Shop C, and you were right: every row gives two fifty per pound. Now you can show why the others fail.' },
  't.cb-a': { html: `At the start you picked ${w('Shop A')}. Its first two rows give $3 per pound, but its last row gives $2.50. You prove it next.`, say: 'At the start you picked Shop A. Its first two rows give three dollars per pound, but its last row gives two fifty. You prove it next.' },
  't.cb-b': { html: `At the start you picked ${w('Shop B')}. Its prices go up by $2 each time, but 7 ÷ 2 = 3.5 and 11 ÷ 6 is less than 2: no single multiplier. ${s('Shop C')} was the proportional one.`, say: 'At the start you picked Shop B. Its prices go up by two dollars each time, but seven divided by two is three point five, and eleven divided by six is less than two: no single multiplier. Shop C was the proportional one.' },
  't.cb-none': { html: `Back to the three shops: ${s('Shop C')} was the proportional one, $2.50 for every pound.`, say: 'Back to the three shops: Shop C was the proportional one, two fifty for every pound.' },

  // ---------- 4. Prove it: Riley and shop A ----------
  'p.intro': { html: `Riley says: “Shop A is proportional. ${a('1 lb')} costs ${b('$3')} and ${a('2 lb')} cost ${b('$6')}: double the pounds, double the price.” Is Riley right?`, say: 'Riley says: Shop A is proportional. One pound costs three dollars and two pounds cost six: double the pounds, double the price. Is Riley right?' },
  'p.test': { html: `Let’s test it. Build the argument and see where it leads.`, say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `Rows 1 and 2 give ${s('$3 per pound')},`, say: 'Rows one and two give three dollars per pound, because three divided by one is three, and six divided by two is three.' },
  'p.c2': { html: `but row 3 gives ${w('$2.50 per pound')},`, say: 'But row three gives two fifty per pound, because ten divided by four is two point five.' },
  'p.c3': { html: `so no single multiplier fits every row: Shop A is ${w('not proportional')}.`, say: 'So no single multiplier fits every row, because one row that breaks the rule is enough. Shop A is not proportional.' },
  'p.x-double': { html: `That is Riley’s check. Doubling once can only rule proportionality out, never prove it.`, say: "That is Riley's check. Doubling once can only rule proportionality out, never prove it." },
  'p.x-most': { html: `Most is not all. One row with another rate is enough to break it.`, say: 'Most is not all. One row with another rate is enough to break it.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: `That’s a proof: three claims, each with its reason, and the graph backs every one. Riley’s doubling check passed, and Shop A still is not proportional.`, say: "That's a proof: three claims, each with its reason, and the graph backs every one. Riley's doubling check passed, and Shop A still is not proportional." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
