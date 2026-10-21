// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = the original, teal = the line m, lime = the image, lavender = a focus or someone's claim), `say` is the same
// line written to be read aloud. pages/lessons/reflections/voice/lines.json holds the `say` texts (the test keeps the
// two in step). The page shows a line and calls ctx.say(id) with it.
const a = (s: string) => `<b class="a">${s}</b>`, m = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, p = (x: string) => `<b class="p">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A dab of wet ${a('paint')} sits at ${a('P')} on a sheet of graph paper. You fold the sheet along the crease ${m('m')} and press it flat.`, say: 'A dab of wet paint sits at P on a sheet of graph paper. You fold the sheet along the crease m, and press it flat.' },
  'q.ask': { html: 'Where does the paint print?', say: 'Where does the paint print?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one. The picture moves first, then the notation.' },
  'e.s0': { html: `The fold moves ${a('P')} straight toward the crease, at a right angle to ${m('m')}. It meets m at ${p('M')}.`, say: 'The fold moves P straight toward the crease, at a right angle to m. It meets m at the point M.' },
  'e.s1': { html: `From ${a('P')} to ${p('M')}: ${p('2')} diagonal steps, grid corner to grid corner.`, say: 'From P to M: two diagonal steps, grid corner to grid corner.' },
  'e.s2': { html: `${s('2')} more steps beyond m: that is ${s('P′')}, read “P prime”. P′ is as far behind m as P is in front of it.`, say: 'Two more steps beyond m. That is P prime. P prime is as far behind m as P is in front of it.' },
  'e.s3': { html: `Fold along m: ${a('P')} lands exactly on ${s('P′')}. The paint prints at spot 2.`, say: 'Fold along m, and P lands exactly on P prime. The paint prints at spot two.' },
  'e.why': { html: 'Quick check: why does the paint print at spot 2, and not straight across the page at spot 1?', say: 'Quick check. Why does the paint print at spot two, and not straight across the page at spot one?' },
  'e.w-ok': { html: 'Yes. Folding along m moves P at a right angle to m, so P′ is on the perpendicular from P.', say: 'Yes. Folding along m moves P at a right angle to m, so P prime is on the perpendicular from P.' },
  'e.w-across': { html: 'Only when m runs straight up and down the page. Here m is slanted, so the right angle is with m, not with the page.', say: 'Only when m runs straight up and down the page. Here m is slanted, so the right angle is with m, not with the page.' },
  'e.w-far': { html: 'Spots 1 and 3 are just as far from m as P. Only spot 2 is also on the perpendicular from P.', say: 'Spots one and three are just as far from m as P. Only spot two is also on the perpendicular from P.' },
  // 3. Your turn
  't.intro': { html: `Now reflect ${a('triangle ABC')} in ${m('m')}, one vertex at a time. Vertex ${a('A')} is done for you.`, say: 'Now reflect triangle A B C in m, one vertex at a time. Vertex A is done for you.' },
  't.a': { html: `${a('A')} is 2 diagonal steps from m, so ${s('A′')} is 2 steps beyond it.`, say: 'A is two diagonal steps from m, so A prime is two steps beyond it.' },
  't.count': { html: `Your turn. Count the diagonal steps from ${a('B')} to ${m('m')}, at a right angle to m.`, say: 'Your turn. Count the diagonal steps from B to m, at a right angle to m.' },
  't.c-ok': { html: `Yes: ${p('3')} steps from B to m.`, say: 'Yes. Three steps from B to m.' },
  't.c-across': { html: 'That counts squares straight across the page. Step diagonally, corner to corner, at a right angle to m.', say: 'That counts squares straight across the page. Step diagonally, corner to corner, at a right angle to m.' },
  't.c-points': { html: 'Count the steps, not the corners: start counting after B.', say: 'Count the steps, not the corners. Start counting after B.' },
  't.c-other': { html: 'Step from B toward m along the other diagonal, and count the steps.', say: 'Step from B toward m along the other diagonal, and count the steps.' },
  't.spot': { html: `Now count 3 steps beyond m. Which spot is ${s('B′')}?`, say: 'Now count three steps beyond m. Which spot is B prime?' },
  't.s-ok': { html: `Yes: 3 steps beyond m. That is ${s('B′')}.`, say: "Yes. Three steps beyond m. That's B prime." },
  't.s-short': { html: 'That spot is only 2 steps beyond m. Count 3, the same as from B to m.', say: 'That spot is only two steps beyond m. Count three, the same as from B to m.' },
  't.s-long': { html: 'That spot is 4 steps beyond m: one too many. Count 3, the same as from B to m.', say: 'That spot is four steps beyond m. One too many. Count three, the same as from B to m.' },
  't.c': { html: `${a('C')} is on m. Where is ${s('C′')}?`, say: 'C is on m. Where is C prime?' },
  't.cc-ok': { html: `Right. C is 0 steps from m, so C′ is 0 steps beyond: ${s('C′ = C')}.`, say: 'Right. C is zero steps from m, so C prime is zero steps beyond. C prime is C.' },
  't.cc-no': { html: 'C is ON m: 0 steps from it. 0 steps beyond m is still C. Points on the line stay put.', say: 'C is on m: zero steps from it. Zero steps beyond m is still C. Points on the line stay put.' },
  't.join': { html: `Join ${s('A′, B′, C′')} in order. Going A → B → C turns clockwise. Which way does A′ → B′ → C′ turn?`, say: 'Join A prime, B prime and C prime, in order. Going A, B, C turns clockwise. Which way does A prime, B prime, C prime turn?' },
  't.o-ok': { html: 'Right: the order is reversed. A reflection flips the triangle over; a slide never would.', say: 'Right. The order is reversed. A reflection flips the triangle over. A slide never would.' },
  't.o-no': { html: 'Trace it again: A′ → B′ → C′ goes the other way round. A reflection always reverses the order.', say: 'Trace it again. A prime, B prime, C prime goes the other way round. A reflection always reverses the order.' },
  't.cb-right': { html: 'At the start you picked spot 2, and you were right. Now you can say why: at a right angle to m, just as far beyond.', say: 'At the start you picked spot two, and you were right. Now you can say why: at a right angle to m, just as far beyond.' },
  't.cb-across': { html: 'At the start you picked spot 1, straight across the page. The fold moves P at a right angle to m, so the paint printed at spot 2.', say: 'At the start you picked spot one, straight across the page. The fold moves P at a right angle to m, so the paint printed at spot two.' },
  't.cb-far': { html: 'At the start you picked spot 3. It is as far from m as P, but moved along m. The image is on the perpendicular: spot 2.', say: 'At the start you picked spot three. It is as far from m as P, but moved along m. The image is on the perpendicular: spot two.' },
  // 4. Prove it
  'p.intro': { html: `Riley says: “${p('Q')} is the image of ${a('P')} in ${m('m')}, because Q is on the other side of m and just as far from it.”`, say: 'Riley says: Q is the image of P in m, because Q is on the other side of m, and just as far from it.' },
  'p.ask': { html: 'Is Riley right?', say: 'Is Riley right?' },
  'p.build': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: "Let's test it. Build the argument, and see where it leads." },
  'p.k1': { html: `The image of ${a('P')} has to be on the perpendicular from P to m,`, say: 'The image of P has to be on the perpendicular from P to m,' },
  'p.k2': { html: `But ${p('Q')} is not on that perpendicular,`, say: 'But Q is not on that perpendicular,' },
  'p.k3': { html: `So Q is not the image of P. The image ${s('P′')} is 2 steps beyond M,`, say: 'So Q is not the image of P. The image, P prime, is two steps beyond M,' },
  'p.c1': { html: 'Right. A fold moves every point at a right angle to the crease.', say: 'Right. A fold moves every point at a right angle to the crease.' },
  'p.c2': { html: 'And PQ crosses m on a slant: Q is moved along m, away from the perpendicular.', say: 'And P Q crosses m on a slant. Q is moved along m, away from the perpendicular.' },
  'p.c3': { html: 'P is 2 steps from m, so P′ is 2 steps beyond M on the same perpendicular. Q is not P′.', say: 'P is two steps from m, so P prime is two steps beyond M, on the same perpendicular. Q is not P prime.' },
  'p.x-far': { html: 'That is Riley’s mistake. Equal distance is not enough: Q must also be on the perpendicular from P.', say: "That is Riley's mistake. Equal distance is not enough. Q must also be on the perpendicular from P." },
  'p.x-side': { html: 'The other side is not enough: the image has to be at a right angle to m AND just as far.', say: 'The other side is not enough. The image has to be at a right angle to m, and just as far.' },
  'p.x-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the picture backs every one. Same distance is not enough; the right angle matters too.', say: "That's a proof. Three claims, each with its reason, and the picture backs every one. Same distance is not enough. The right angle matters too." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
