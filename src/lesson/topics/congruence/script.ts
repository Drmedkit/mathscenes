// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the figure we start from, p = the figure we try to reach, b = a move, s = the answer / what landed), `say` is
// the same line written to be read aloud; pages/lessons/congruence/voice/lines.json holds the `say` texts (the test
// keeps the two in step). The page shows a line and calls ctx.say(id) with it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, p = (x: string) => `<b class="p">${x}</b>`;

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numWords(n: number): string {
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10]! : '');
  return String(n);
}
/** the panel text read aloud: tags out, symbols as words, numbers as words */
export function toSay(h: string): string {
  return h.replace(/<[^>]+>/g, '')
    .replace(/△/g, 'triangle ').replace(/ ≅ /g, ' is congruent to ').replace(/°/g, ' degrees')
    .replace(/″/g, ' double prime').replace(/′/g, ' prime').replace(/ → /g, ', ')
    .replace(/\((−?\d+), (−?\d+)\)/g, '$1, $2').replace(/−(\d)/g, 'negative $1')
    .replace(/\d+/g, d => numWords(Number(d)));
}
const same = (t: string) => ({ html: t, say: toSay(t) });

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': same(`You are cutting floor tiles. Each tile must be an exact copy of the ${a('template ABC')}. You may trace the template, then slide, turn or flip the tracing paper.`),
  'q.ask': same('Which tile can the tracing cover exactly, corner on corner?'),
  'q.sure': same('How sure are you?'),
  // 2. Worked example
  'e.intro': same('Four steps. Press each one: the picture moves first, then the board writes it down.'),
  'e.s1': same(`Match the corners by their sides. ${a('A')} sits at the right angle, between the 4-unit side and the 3-unit side. So does ${p('D')}. So A goes with D, B with E, and C with F.`),
  'e.s2': same(`A → B → C goes counterclockwise, but D → E → F goes clockwise. Only a flip reverses that, so ${b('flip the tracing over the y-axis')}. A′ lands at (6, 2).`),
  'e.s3': same(`A′ is at (6, 2) and D is at (6, −4), straight below it: ${b('slide 6 down')}.`),
  'e.s4': same(`Check every corner: A″ is on D, B″ on E, C″ on F. The tracing covers the tile exactly, so ${s('△ABC ≅ △DEF')}.`),
  'e.why': same('Quick check: why does this prove the tiles are congruent?'),
  'e.w-ok': same('Yes. The tracing only moved; it never stretched. And every corner landed on its partner.'),
  'e.w-look': same('Looking alike is not a proof: tile 1 looked alike too. The tracing has to land exactly, on every corner.'),
  'e.w-one': same('One corner is not enough. B and C have to land on E and F too.'),
  // 3. Your turn
  't.intro': same(`Your turn: show that ${a('△ABC')} is congruent to ${p('△DEF')}. Matching the corners and the first move are done for you.`),
  't.match': same('A goes with D, B with E, C with F. Both go counterclockwise, so no flip is needed.'),
  't.turn': same(`First move: ${b('turn 90° counterclockwise about the origin')}. A′ lands at (−1, 1).`),
  't.slide-ask': same(`Now the slide. It starts at ${a('A′ (−1, 1)')} and ends at ${p('D (1, −4)')}. Fill in its rule.`),
  't.slide-ok': same(`Yes: from A′ (−1, 1) to D (1, −4) is ${b('2 right and 5 down')}.`),
  't.slide-orig': same('That slide goes from A to D. But the turn already moved A: the slide starts at A′ (−1, 1).'),
  't.slide-back': same('That goes from D back to A′. Count from A′ to D: across, then down.'),
  't.slide-other': same('Count from A′ (−1, 1) to D (1, −4): across first, then down.'),
  't.check-ask': same('The tracing has landed. Which check proves △ABC ≅ △DEF?'),
  't.k-ok': same(`Right: every corner is on its partner. ${s('△ABC ≅ △DEF')}.`),
  't.k-one': same('A″ on D is a start, but the other corners have to be checked too.'),
  't.k-two': same('Two corners are not enough: the mirror image of the triangle fits them too. Check C″ as well.'),
  't.cb-right': same('You were right: tile 2. Turned and flipped copies are congruent, as long as the tracing covers them exactly.'),
  't.cb-one': same('Tile 1 looked like the template, but its long side is 5 units, not 4. Tile 2 is the congruent one, even though it is flipped.'),
  't.cb-both': same('Tile 1 only looks alike: its long side is 5 units, not 4. Only tile 2 is congruent.'),
  't.cb-none': same('Tile 2 is the congruent tile: a flip and a slide cover it exactly.'),
  // 4. Prove it
  'p.intro': same(`Jordan has two rectangles: ${a('P is 6 by 2')} and ${p('Q is 4 by 3')}. Jordan says: “Both cover 12 squares, so they are congruent.”`),
  'p.build': same('Now prove it. Fill each “because” with the reason that makes the line true.'),
  'p.build-test': same('Let’s test it. Fill each “because” with the reason that makes the line true, and see where it leads.'),
  'p.claim1': same('A slide, turn or flip keeps every side length,'),
  'p.claim2': same('P has a side of 6, and Q has no side of 6,'),
  'p.claim3': same('So no sequence of moves puts P exactly on Q,'),
  'p.c1': same('Right. Watch the tracing: it turns and slides, and its sides stay 6 and 2.'),
  'p.c2': same('P’s sides are 6, 2, 6 and 2. Q’s sides are 4, 3, 4 and 3. The 6 has no partner.'),
  'p.c3': same('Put the tracing on Q any way you like: the 6-unit side always sticks out.'),
  'p.x-area': same('Equal areas don’t make figures congruent: 6 by 2 and 4 by 3 both make 12.'),
  'p.x-try': same('One move that fails proves nothing: maybe another one works. The side lengths are the proof.'),
  'p.x-other': same('True, but it is the reason for a different line. Which reason makes this line true?'),
  'p.done': same('That’s a proof: three claims, each with its reason. P and Q have the same area, but they are not congruent.'),
};
