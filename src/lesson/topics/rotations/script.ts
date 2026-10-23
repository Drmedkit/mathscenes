// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the figure before the move, b = the move: pin, direction, amount, s = the image / the answer), `say` is the same
// line written to be read aloud; pages/lessons/rotations/voice/lines.json holds the `say` texts (the test keeps the
// two in step). The page shows a line and calls ctx.say(id) with it.
const p = (s: string) => `<b class="p">${s}</b>`;
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
/** a line whose spoken text is its panel text read aloud: tags out, digits as words, "A → B → C" as "A, B, C" */
const same = (t: string) => ({ html: t, say: t.replace(/<[^>]+>/g, '').replace(/ → /g, ', ').replace(/′/g, ' prime').replace(/\b(\d)\b/g, (_, d: string) => WORDS[Number(d)]!) });

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `You are building a block-puzzle game. The ${a('L-block')} sits on a clear sheet pinned at ${b('P')}. The sheet makes ${b('a quarter turn clockwise')} about P.`, say: 'You are building a block-puzzle game. The L-block sits on a clear sheet pinned at P. The sheet makes a quarter turn clockwise about P.' },
  'q.ask': same('Which picture shows where the block lands?'),
  'q.sure': same('How sure are you?'),
  // 2. Worked example
  'e.intro': same('Four steps. Press each one: the picture moves first, then the notation.'),
  'e.s1': { html: `The pin ${b('P')} is the center of the turn: the one point that stays still. Everything else goes around it.`, say: 'The pin P is the center of the turn: the one point that stays still. Everything else goes around it.' },
  'e.s2': { html: `Corner ${a('A')} is ${a('3 right, 1 up')} from P. Turn those steps like a pointer, a quarter turn clockwise: right turns into down, up turns into right. ${s('A′')} is ${s('1 right, 3 down')}.`, say: 'Corner A is three right, one up from P. Turn those steps like a pointer, a quarter turn clockwise: right turns into down, up turns into right. A prime is one right, three down.' },
  'e.s3': { html: `${a('B')} and ${a('C')} turn the same amount, the same way, about the same pin. Each string from P keeps its length.`, say: 'B and C turn the same amount, the same way, about the same pin. Each string from P keeps its length.' },
  'e.s4': { html: `Turn the whole sheet: the block lands exactly on ${s('A′, B′ and C′')}. Every side kept its length, and A → B → C still goes clockwise.`, say: 'Turn the whole sheet: the block lands exactly on A prime, B prime and C prime. Every side kept its length, and A, B, C still goes clockwise.' },
  'e.why': same('Quick check: why did corner C move so much farther than corner B?'),
  'e.w-ok': same('Yes. Everything turned the same quarter turn, but C is farther from the pin, so its circle is bigger.'),
  'e.w-arm': same('They turned the same amount: a quarter turn each. A longer string only makes a bigger circle.'),
  'e.w-slide': same('Nothing slid. The sheet only turned about P; C just sits farther out.'),
  // 3. Your turn
  't.intro': { html: `Now a ${a('triangle')} on the sheet makes ${b('a quarter turn counterclockwise')} about ${b('P')}. The pin and corner A are done for you.`, say: 'Now a triangle on the sheet makes a quarter turn counterclockwise about P. The pin and corner A are done for you.' },
  't.b-ask': { html: `${a('B')} is ${a('2 right, 3 up')} from P. Where does B land?`, say: 'B is two right, three up from P. Where does B land?' },
  't.b-tap': same('Tap a dot in the picture, or pick it here.'),
  't.b-ok': { html: `Yes: right turns into up, up turns into left. ${s('B′')} is ${s('3 left, 2 up')}.`, say: 'Yes: right turns into up, up turns into left. B prime is three left, two up.' },
  't.b-rev': same('That is a quarter turn clockwise. Counterclockwise goes against the clock.'),
  't.b-one': same('That turns only the 2 right and leaves the 3 up as it was. Both steps turn: 3 up turns into 3 left.'),
  't.b-count': same('One step short: count the jumps between dots, not the dot you start on. 3 up turns into 3 left.'),
  't.c-auto': { html: `${a('C')} goes the same way: 5 right, 1 up turns into ${s('1 left, 5 up')}.`, say: 'C goes the same way: five right, one up turns into one left, five up.' },
  't.k-ask': same('The sheet turns onto the new dots. What did the turn keep?'),
  't.k-ok': same('Right: same sides, same corner order. The turn moved the triangle; it did not change it.'),
  't.k-proto': same('It points a new way, but it is the same triangle: every side kept its length.'),
  't.k-one': same('Every corner has to land right. Check B and C too, not just A.'),
  't.cb-right': same('You were right: picture 2. Now you can show why, corner by corner.'),
  't.cb-center': same('Picture 1 turned about its own corner, not about the pin P. Every point must keep its distance from P: picture 2.'),
  't.cb-flip': same('Picture 3 is flipped down, a mirror image: A, B, C goes the other way round. The quarter turn is picture 2.'),
  't.cb-none': same('The quarter turn about P is picture 2.'),
  // 4. Prove it
  'p.intro': { html: `Riley drew the ${a('L')} and a ${p('lavender L')} below line ${b('m')}, and says: “It is upside down, so it is a half turn of the L.”`, say: 'Riley drew the L and a lavender L below line m, and says: it is upside down, so it is a half turn of the L.' },
  'p.build': same('Now prove it. Fill each “because” with the reason that makes the line true.'),
  'p.build-test': same('Let’s test it. Fill each “because” with the reason that makes the line true, and see where it leads.'),
  'p.claim1': same('A turn keeps A → B → C going the same way round,'),
  'p.claim2': same('In Riley’s picture A → B → C goes the other way round,'),
  'p.claim3': same('So Riley’s picture is a flip across m, not a half turn,'),
  'p.c1': same('Right. The sheet stays face up when it turns. Watch: a real half turn makes a different picture.'),
  'p.c2': same('Clockwise in the L, counterclockwise in Riley’s picture. No turn can do that.'),
  'p.c3': same('Fold the sheet over line m, and the L lands exactly on Riley’s picture. It is a flip.'),
  'p.x-upside': same('Upside down happens in a flip too. Trace the corners: the order tells a turn from a flip.'),
  'p.x-one': same('One corner is not enough. Every corner has to match.'),
  'p.x-other': same('True, but it is the reason for a different line. Which reason makes this line true?'),
  'p.done': same('That’s a proof: three claims, each with its reason, and the picture backs every one. Riley’s picture is a flip.'),
};
