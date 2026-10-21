// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/percent-applications/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = the 100% amount (amber), b = the percent / the change (teal), s = the answer (lime).

export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `A <b class="a">$80</b> jacket is <b class="b">20% off</b>. At the register you get <b class="b">another 10% off</b> the sale price. What do you pay? Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one and watch the tape first, then the maths on the board.',
  'e.step0': `The original price <b class="a">$80</b> is 100%: the whole tape. The first 20% is a percent of it.`,
  'e.step1': `20% off leaves 80% of the tape. 80% of $80 is $80 × 0.8 = <b class="s">$64</b>.`,
  'e.step2': `Now <b class="a">$64</b> is the new 100%. Another 10% off leaves 90% of it: $64 × 0.9 = <b class="s">$57.60</b>.`,
  'e.step3': `Both steps at once: × 0.8 and then × 0.9 is × <b class="s">0.72</b>. You pay 72% of $80. That is 28% off, not 30%.`,
  'e.why': 'Quick check: why do you pay $57.60, and not $56?',
  'e.why.ok': `Yes. The second 10% is a percent of $64, not of $80, so it takes off only $6.40.`,
  'e.why.adds': `That adds the percents. But the second 10% is of the sale price, $64: it takes off $6.40, not $8.`,
  'e.why.order': `The order changes nothing here: 0.9 × 0.8 is also 0.72. What matters is that the second percent is of a smaller amount.`,

  // 3 Your turn
  't.intro': `A <b class="a">$50</b> video game goes <b class="b">up 20%</b>. Later the store cuts the new price by <b class="b">20%</b>. I'll do the first step; then it's your turn.`,
  't.given': `Up 20%: $50 × 1.2 = <b class="a">$60</b>.`,
  't.base': 'The 20% cut: which amount is 100% now?',
  't.base.ok': `Yes: the cut is a percent of the price at that moment, <b class="a">$60</b>. That is the new 100%.`,
  't.base.no': `$50 was the 100% for the first change. The cut comes after the price went up, so it is 20% of $60.`,
  't.price': 'What is the price after the 20% cut?',
  't.price.ok': `Right: $60 × 0.8 = <b class="s">$48</b>.`,
  't.price.adds': `Not back to $50: 20% of $60 is $12, more than the $10 it went up. $60 − $12 = $48.`,
  't.price.change': `$12 is the cut itself. The new price is what is left of $60.`,
  't.price.miss': `Take 20% of $60 off, or work out $60 × 0.8. Try again.`,
  't.net': 'Last step: compared with the $50 at the start, what is the net change?',
  't.net.ok': `Yes: 1.2 × 0.8 = 0.96. The game ends at 96% of $50: a 4% decrease.`,
  't.net.adds': `Up 20% and down 20% don't cancel: the cut was a percent of a bigger amount. 1.2 × 0.8 = 0.96, a 4% decrease.`,
  't.net.pctof': `96% is the new price as a percent OF the start. The change is the difference from 100%: down 4%.`,
  't.done': `Back to the jacket: the second 10% is of $64, so you pay $80 × 0.8 × 0.9 = <b class="s">$57.60</b>.`,

  // 4 Prove it
  'p.intro': `A <b class="a">$50</b> pair of headphones. Store A takes <b class="b">20% off</b>, then adds <b class="b">8% tax</b>. Store B adds the 8% tax first, then takes 20% off. Ava says: “Store A is cheaper, because its tax is on a smaller amount.” Is Ava right?`,
  'p.build.no': `Now prove it. Fill each “because” with the reason that makes the line true.`,
  'p.build.yes': `Let's test it. Fill each “because” with the reason that makes the line true, and see where it leads.`,
  'p.c1': `Store A: 20% off leaves $40, and 8% tax on $40 makes <b class="s">$43.20</b>.`,
  'p.c2': `Store B: the tax makes $54, and 20% off $54 also leaves <b class="s">$43.20</b>.`,
  'p.c3': `Both are $50 × 0.8 × 1.08. The tapes end at the same place: the order does not matter, so Ava is wrong.`,
  'p.done': `That's a proof: every claim has its reason, and the tapes back each one. Two percent changes are two multipliers, and multipliers can go in any order.`,
  'p.chip.adds': `Careful: 20% off and 8% tax don't make 12% off. Each percent is of a different amount. Work out each step.`,
  'p.chip.order': `That is exactly what we are testing. Work out both totals before you decide.`,
  'p.chip.coupon': `That's not true: a $10 coupon is subtracted, not multiplied, so with a coupon the order does matter.`,
  'p.chip.other': `True, but it is the reason for a different line. Which one makes this line true?`,
};
