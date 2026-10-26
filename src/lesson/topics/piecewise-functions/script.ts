// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (rules amber, the
// answer lime), `say` is the same line written to be read aloud (no digits, no symbols).
// pages/lessons/piecewise-functions/voice/lines.json holds the `say` texts; the test keeps the two in step.
const a = (s: string) => `<b class="a">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const x = '<i>x</i>', f = '<i>f</i>', g = '<i>g</i>';

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `${f} has two rules. ${a(`${x} + 2`)} is for ${x} ≤ 3, and ${a(`2${x} − 4`)} is for ${x} &gt; 3. What is ${f}(3)? Pick an answer, and say how sure you are.`, say: 'f has two rules. x plus two is for x less than or equal to three, and two x minus four is for x greater than three. What is f of three? Pick an answer, and say how sure you are.' },
  'q.cb.right': { html: `You said ${f}(3) = 5, and you were right: 3 ≤ 3 is true, so the first rule owns 3.`, say: 'You said f of three is five, and you were right: three is less than or equal to three, so the first rule owns three.' },
  'q.cb.second': { html: `You said 2. That is the second rule, but 3 &gt; 3 is false, so it never sees 3. The first rule owns it: ${f}(3) = 5.`, say: 'You said two. That is the second rule, but three is greater than three is false, so it never sees three. The first rule owns it: f of three is five.' },
  'q.cb.undef': { html: `You said undefined. A breakpoint still has an output when one condition includes it: 3 ≤ 3, so ${f}(3) = 5.`, say: 'You said undefined. A breakpoint still has an output when one condition includes it. Three is less than or equal to three, so f of three is five.' },
  'q.cb.none': { html: `${f}(3) = 5: the ≤ hands 3 to the first rule.`, say: 'f of three is five: the less than or equal sign hands three to the first rule.' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the graph moves first, then the notation.', say: 'Four steps. Press each one. The graph moves first, then the notation.' },
  'e.step0': { html: `Start inside a piece: ${f}(1). Test 1 against each condition. 1 ≤ 3 is true, so use ${a(`${x} + 2`)}: ${f}(1) = 3. The point (1, 3) sits on that line.`, say: 'Start inside a piece: f of one. Test one against each condition. One is less than or equal to three, so use x plus two. f of one is three. The point one, three sits on that line.' },
  'e.step1': { html: `The first rule only holds for ${x} ≤ 3. Keep its line up to 3 and drop the rest. 3 is included, so the end at (3, 5) is a ${s('filled dot')}.`, say: 'The first rule only holds for x less than or equal to three. Keep its line up to three and drop the rest. Three is included, so the end at three, five is a filled dot.' },
  'e.step2': { html: `The second rule holds for ${x} &gt; 3: from 3 on to the right. 3 is left out, so its end at (3, 2) is an ${s('open dot')}: that point is NOT on the graph.`, say: 'The second rule holds for x greater than three: from three on to the right. Three is left out, so its end at three, two is an open dot. That point is not on the graph.' },
  'e.step3': { html: `Now read ${f}(3): go up from ${x} = 3. The open dot doesn't count; the filled dot does. ${s(`${f}(3) = 5`)}.`, say: 'Now read f of three: go up from x equals three. The open dot does not count. The filled dot does. f of three is five.' },
  'e.why': { html: 'Quick check: why does the first rule get 3, and not the second?', say: 'Quick check: why does the first rule get three, and not the second?' },
  'e.why.ok': { html: 'Yes. The symbols decide: ≤ takes 3 in, &gt; leaves it out. One input, one owner.', say: 'Yes. The symbols decide: less than or equal takes three in, greater than leaves it out. One input, one owner.' },
  'e.why.second': { html: 'Order on the page means nothing. Test 3 in each condition: only 3 ≤ 3 is true.', say: 'Order on the page means nothing. Test three in each condition: only three is less than or equal to three is true.' },
  'e.why.two': { html: 'A function gives one output per input. Only one condition holds at 3, so there is one output: 5.', say: 'A function gives one output per input. Only one condition holds at three, so there is one output: five.' },
  // 3. Your turn
  't.intro': { html: `A garage charges ${a('$4 for each hour or part of an hour')}, for at most 4 hours. The first two steps are drawn: up to 1 hour costs $4, more than 1 up to 2 hours costs $8.`, say: 'A garage charges four dollars for each hour or part of an hour, for at most four hours. The first two steps are drawn. Up to one hour costs four dollars. More than one, up to two hours, costs eight dollars.' },
  't.dots': { html: 'The third step costs $12. Which dots does it get?', say: 'The third step costs twelve dollars. Which dots does it get?' },
  't.dots.ok': { html: 'Right. A moment past 2 hours starts the third hour: $12. Exactly 3 hours has not started a fourth: still $12.', say: 'Right. A moment past two hours starts the third hour: twelve dollars. Exactly three hours has not started a fourth: still twelve dollars.' },
  't.dots.left': { html: 'Exactly 2 hours has not started a third hour, so it still costs $8. The $12 step is open at 2.', say: 'Exactly two hours has not started a third hour, so it still costs eight dollars. The twelve dollar step is open at two.' },
  't.dots.both': { html: 'At 2 hours the cost is $8, from the step before. Two filled dots above 2 would give it two prices.', say: 'At two hours the cost is eight dollars, from the step before. Two filled dots above two would give it two prices.' },
  't.cost': { html: 'You park for 2 hours 20 minutes. What do you pay?', say: 'You park for two hours and twenty minutes. What do you pay?' },
  't.cost.ok': { html: `Right: ${s('$12')}. 2 hours 20 minutes has started a third hour, and every started hour counts.`, say: 'Right: twelve dollars. Two hours and twenty minutes has started a third hour, and every started hour counts.' },
  't.cost.round': { html: 'Rounding to the nearest hour gives 2, but the garage counts every started hour: round up, to 3 hours.', say: 'Rounding to the nearest hour gives two, but the garage counts every started hour. Round up, to three hours.' },
  't.cost.other': { html: 'Find the step above 2 hours 20 minutes on the graph: it is the third step.', say: 'Find the step above two hours and twenty minutes on the graph: it is the third step.' },
  // 4. Prove it
  'p.intro': { html: `Mia looks at the graph of ${g} and says: "${g} is not a function. Its graph breaks into two pieces." Is Mia right?`, say: 'Mia looks at the graph of g and says: g is not a function. Its graph breaks into two pieces. Is Mia right?' },
  'p.test': { html: 'Look again with a vertical line. Build the argument: tap a reason for each claim.', say: 'Look again with a vertical line. Build the argument: tap a reason for each claim.' },
  'p.build': { html: 'Build the argument: tap a reason for each claim.', say: 'Build the argument: tap a reason for each claim.' },
  'p.c1': { html: 'Yes: no input is left without a rule.', say: 'Yes. No input is left without a rule.' },
  'p.c2': { html: 'Yes: at 1 the vertical line meets only the filled dot.', say: 'Yes. At one, the vertical line meets only the filled dot.' },
  'p.c3': { html: 'Yes: the sweep meets the graph once at every input.', say: 'Yes. The sweep meets the graph once at every input.' },
  'p.no.connected': { html: 'That is the claim to break, not a reason. Nothing in the definition of a function asks for one unbroken line.', say: 'That is the claim to break, not a reason. Nothing in the definition of a function asks for one unbroken line.' },
  'p.no.narrow': { html: 'One function can use many rules, as long as each input gets exactly one output.', say: 'One function can use many rules, as long as each input gets exactly one output.' },
  'p.no.open': { html: 'The open dot at (1, 2) is not on the graph. Only the filled dot counts, so 1 has one output: 4.', say: 'The open dot at one, two is not on the graph. Only the filled dot counts, so one has one output: four.' },
  'p.no.other': { html: 'True, but it does not back up this claim. Try it on another one.', say: 'True, but it does not back up this claim. Try it on another one.' },
  'p.done': { html: `Mia is wrong: ${s(`${g} is a function`)}, jump and all. One output per input is the whole test.`, say: 'Mia is wrong: g is a function, jump and all. One output per input is the whole test.' },
};
