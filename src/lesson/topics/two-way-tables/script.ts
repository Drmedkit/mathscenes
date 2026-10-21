// script.ts: every line the panel shows in parts 1-4, by voice line id, and every TeX line the board writes there.
// The spoken text of each id (written to be read aloud, no digits) is in pages/lessons/two-way-tables/voice/lines.json;
// the test checks both have the same ids and that no string here hides a control character (a "\t" written as "\\t").
// Colour roles in the text: a = the whole (amber), b = the part / a count (teal), s = the answer (lime).

export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `<b class="a">200 eighth graders</b> answered two questions: do you have a curfew, and do you do chores? The table shows their answers. <b>Of the students with a curfew, what percent do chores?</b> Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one: the table moves first, then the maths on the board.',
  'e.step0': `Each student sits in exactly one cell. Add across: <b class="a">120</b> have a curfew, <b class="a">80</b> don’t. Add down: <b class="a">116</b> do chores, <b class="a">84</b> don’t. Both ways give all <b class="a">200</b>.`,
  'e.step1': `“Of the students with a curfew” names the whole: the <b class="a">Curfew row, 120 students</b>. The part is where that row meets Chores: <b class="b">84</b>.`,
  'e.step2': `Part over whole: 84 ÷ 120 = 0.7 = <b class="s">70%</b>. The row becomes one bar: 100% of the curfew students, split 70% chores, 30% no chores.`,
  'e.step3': `The other row as its own bar: 32 of the 80 without a curfew do chores, <b class="s">40%</b>. 70% against 40%: the bars split in different places, 30 percentage points apart. Curfew and chores are <b>associated</b>.`,
  'e.why': 'Quick check: why is the whole 120, and not 200?',
  'e.why.ok': 'Yes. “Of the students with a curfew” narrows it to that row, so those 120 are the 100%.',
  'e.why.all': '84 out of 200 is 42%: the share of ALL students who have a curfew and do chores. That answers a different question.',
  'e.why.row': 'Not always. “Of the students who do chores” would make the Chores column, 116, the whole.',

  // 3 Your turn
  't.intro': `Now <b class="a">250 students</b>: do you ride the bus, and do you eat school breakfast? <b>Of the breakfast eaters, what percent ride the bus?</b> The first step is done for you.`,
  't.given': 'The totals are in: 120 ride the bus, 130 don’t; 90 eat school breakfast, 160 don’t.',
  't.whole': 'Name the whole: who is the 100% here?',
  't.whole.ok': 'Yes: “of the breakfast eaters” makes the Breakfast column the whole, 90 students.',
  't.whole.row': 'That is the Bus row. The question says “of the breakfast eaters”: they are the whole.',
  't.whole.all': 'All 250 would be the whole for “of all students”. Here the question names one group.',
  't.pct': 'The part is 72: breakfast eaters who ride the bus. What percent of the breakfast eaters is that?',
  't.pct.ok': 'Right: 72 ÷ 90 = 0.8 = <b class="s">80%</b>. The column drops into one bar.',
  't.pct.row': '60% is 72 out of the 120 bus riders. The whole is the 90 breakfast eaters.',
  't.pct.all': 'That is 72 out of all 250. The whole is only the 90 breakfast eaters.',
  't.pct.count': '72 is the count. As a percent of the 90 breakfast eaters, divide.',
  't.pct.miss': 'Divide the part by the whole: 72 ÷ 90.',
  't.pct.empty': 'Type a number first.',
  't.assoc': 'The other column: 48 of the 160 who skip breakfast ride the bus, 30%. Is there an association?',
  't.assoc.ok': 'Yes: 80% against 30%. The bars split in very different places.',
  't.assoc.size': 'Group sizes don’t decide it. Compare the shares: 80% of one group, 30% of the other.',
  't.assoc.cause': 'The data show a link, not a cause. Maybe bus riders just get to school in time for breakfast.',
  'q.cb.right': 'At the start you picked 70%, and you were right. Now you can say why: the curfew row is the whole.',
  'q.cb.all': 'At the start you picked 42%. That divides by all 200: it answers “of all students”, not “of the curfew students”.',
  'q.cb.col': 'At the start you picked about 72%. That divides by the chores column, 116: it answers “of the students who do chores”.',
  'q.cb.none': 'Name the whole first: the group after “of the”. Then divide the part by it.',

  // 4 Prove it
  'p.intro': `A survey of <b class="a">300 students</b>: music lessons and sports. Jordan says: “120 is the biggest number in the table, so music students are more likely to play a sport.” Is Jordan right?`,
  'p.test': 'Let’s test it. Build the argument, and see where it leads.',
  'p.build': 'Now prove it. Fill each “because” with the reason that makes the line true.',
  'p.c1': 'Right. The music row is big: 180 of the 300. A big group makes a big cell, whatever the share.',
  'p.c2': 'Right. Out of the 180 music students, 120 play a sport: about 66.7%.',
  'p.c3': 'Right. Out of the 120 others, 80 play a sport: about 66.7% too. The bars split at the same place.',
  'p.no.cell': 'That is Jordan’s reason itself. A big cell can just mean a big group.',
  'p.no.all': '120 out of 300 is the share of everybody. For music students, the whole is the 180 of them.',
  'p.no.cause': 'A survey can’t show a cause, and here there isn’t even an association to explain.',
  'p.no.other': 'True, but it is the reason for a different line. Which reason makes this line true?',
  'p.done': 'That’s a proof: three claims, each with its reason. Same split in both groups: no association, even though 120 is the biggest cell.',
};

/** the claims of the because-chain in part 4 (HTML) */
export const CLAIMS = [
  'Jordan’s reason doesn’t work,',
  'Of the music students, 120 ÷ 180 ≈ <b>66.7%</b> play a sport,',
  'Of the others, 80 ÷ 120 ≈ <b>66.7%</b> play a sport too, so there is <b class="s">no association</b>,',
];
export const CHIPS = [
  { t: 'The music group is bigger to begin with: 180 of the 300.', fits: 0 },
  { t: 'The whole is the 180 music students, not all 300.', fits: 1 },
  { t: 'Both bars split at the same place: the same share of each group.', fits: 2 },
  { t: '120 is the biggest cell, so the link is strong.', fits: -1, id: 'p.no.cell', mc: 'mc.probability.independence-from-one-cell-count' },
  { t: '120 ÷ 300 = 40% is the percent of music students who play.', fits: -1, id: 'p.no.all', mc: 'mc.probability.condition-not-made-new-whole' },
  { t: 'Music lessons make students sporty.', fits: -1, id: 'p.no.cause', mc: 'mc.statistics.correlation-implies-causation' },
];

/** every TeX line the board writes in parts 1-4 */
export const TEX = {
  qAsk: '\\frac{\\cssId{p}{84}}{\\cssId{w}{?}} = \\;?\\,\\%',
  rows: '\\cssId{a}{120} + \\cssId{b}{80} = \\cssId{n}{200}',
  cols: '\\cssId{a}{116} + \\cssId{b}{84} = \\cssId{n}{200}',
  eFrac: '\\frac{\\cssId{p}{84}}{\\cssId{w}{120}}',
  eRes: '= \\cssId{s}{70\\%}',
  eOther: '\\frac{\\cssId{p}{32}}{\\cssId{w}{80}} = \\cssId{s}{40\\%}',
  eDiff: '70\\% - 40\\% = \\cssId{s}{30}',
  tRows: '\\cssId{a}{120} + \\cssId{b}{130} = \\cssId{n}{250}',
  tCols: '\\cssId{a}{90} + \\cssId{b}{160} = \\cssId{n}{250}',
  tAsk: '\\frac{\\cssId{p}{72}}{\\cssId{w}{?}} = \\;?\\,\\%',
  tFrac: '\\frac{\\cssId{p}{72}}{\\cssId{w}{90}}',
  tRes: '= \\cssId{s}{80\\%}',
  tOther: '\\frac{\\cssId{p}{48}}{\\cssId{w}{160}} = \\cssId{s}{30\\%}',
  pJ1: '\\text{biggest cell: } 120',
  pJ2: '\\text{so music} \\Rightarrow \\text{sport?}',
  pA: '\\frac{\\cssId{p}{120}}{\\cssId{w}{180}} \\approx \\cssId{s}{66.7\\%}',
  pB: '\\frac{\\cssId{p}{80}}{\\cssId{w}{120}} \\approx \\cssId{s}{66.7\\%}',
  pC: '\\text{same split}',
} as const;
