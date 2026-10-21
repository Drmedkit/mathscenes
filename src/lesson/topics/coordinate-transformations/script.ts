// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// amber = the preimage, teal = the move, lime = the image), `say` is the same line written to be read aloud;
// pages/lessons/coordinate-transformations/voice/lines.json holds the `say` texts (the test keeps the two in step).
// No imports, so a plain `node --experimental-strip-types` can read it.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const w = (x: string) => `<b class="w">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question: a sprite slides 5 right and 4 down; where does its tip A(−2, 3) land?
  'q.intro': { html: `A game screen is a coordinate grid. The tip of a sprite is at ${a('A(−2, 3)')}.`, say: 'A game screen is a coordinate grid. The tip of a sprite is at A: negative two, three.' },
  'q.move': { html: `The game slides the whole sprite ${b('5 right and 4 down')}.`, say: 'The game slides the whole sprite five right and four down.' },
  'q.ask': { html: `Where does the tip land? We call that point ${s('A′')}, “A prime”.`, say: 'Where does the tip land? We call that point A prime.' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example: the whole sprite, A(−2, 3), B(1, 4), C(−1, 1), slides 5 right and 4 down
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The whole sprite slides ${b('5 right and 4 down')}. Every point makes the same move: nothing turns or stretches.`, say: 'The whole sprite slides five right and four down. Every point makes the same move: nothing turns or stretches.' },
  'e.s2': { html: `${a('A')} goes ${b('5 right')}, so x changes: −2 + 5 = 3. Then ${b('4 down')}, so y changes: 3 − 4 = −1. ${s('A′ = (3, −1)')}.`, say: 'A goes five right, so x changes: negative two plus five is three. Then four down, so y changes: three minus four is negative one. A prime is three, negative one.' },
  'e.s3': { html: `The same move for ${a('B')} and ${a('C')}: add 5 to x, subtract 4 from y. ${s('B′ = (6, 0)')} lands on the x-axis.`, say: 'The same move for B and C: add five to x, and subtract four from y. B prime is six, zero: it lands on the x-axis.' },
  'e.s4': { html: `One rule for every point: ${s('(x, y) → (x + 5, y − 4)')}. Right and left change x; up and down change y.`, say: 'One rule for every point: x, y goes to x plus five, y minus four. Right and left change x. Up and down change y.' },
  'e.why': { html: 'Quick check: why does “5 right” change only x?', say: 'Quick check: why does five right change only x?' },
  'e.w-ok': { html: 'Yes. Right and left are across, along the x-axis. The point stays at the same height, so y does not change.', say: 'Yes. Right and left are across, along the x-axis. The point stays at the same height, so y does not change.' },
  'e.w-both': { html: 'Look at A going right: it stays on the same horizontal line, at height 3. Only x changes.', say: 'Look at A going right: it stays on the same horizontal line, at height three. Only x changes.' },
  'e.w-pos': { html: 'Not always: a point at x = −7 that moves 5 right lands at −2, still negative. Right ADDS to x.', say: 'Not always: a point at negative seven that moves five right lands at negative two, still negative. Right adds to x.' },
  // 3. Your turn: a logo mirrored across the y-axis, D(−5, 1), E(−1, 3), F(−3, −2) (faded from the end)
  't.intro': { html: `A designer mirrors half of a logo across the ${b('y-axis')}. The first two steps are done for you.`, say: 'A designer mirrors half of a logo across the y-axis. The first two steps are done for you.' },
  't.s1': { html: `Fold the grid along the ${b('y-axis')}: the logo flips onto the other side.`, say: 'Fold the grid along the y-axis: the logo flips onto the other side.' },
  't.s2': { html: `${a('D')} is 5 left of the y-axis, so ${s('D′')} is 5 right of it: ${s('D′ = (5, 1)')}. The fold moves D straight across, so y stays 1.`, say: 'D is five left of the y-axis, so D prime is five right of it: five, one. The fold moves D straight across, so y stays one.' },
  't.ask': { html: `Your step: ${a('F')} is at ${a('(−3, −2)')}. Where is ${s('F′')}?`, say: 'Your step: F is at negative three, negative two. Where is F prime?' },
  't.f-ok': { html: `Yes: F is 3 left of the axis, so ${s('F′')} is 3 right of it, at ${s('(3, −2)')}. Its y stays −2.`, say: 'Yes: F is three left of the axis, so F prime is three right of it, at three, negative two. Its y stays negative two.' },
  't.f-named': { html: 'That changes y. A fold across the y-axis moves F sideways, so x changes and y stays −2.', say: 'That changes y. A fold across the y-axis moves F sideways, so x changes, and y stays negative two.' },
  't.f-both': { html: 'Only one coordinate changes. A sideways fold keeps the height: y stays −2.', say: 'Only one coordinate changes. A sideways fold keeps the height: y stays negative two.' },
  't.f-same': { html: 'F′ is on the other side of the axis. The opposite of −3 is 3, a positive number.', say: 'F prime is on the other side of the axis. The opposite of negative three is three, a positive number.' },
  't.f-other': { html: 'Count from the y-axis: F is 3 left of it. F′ is 3 right of it, at the same height.', say: 'Count from the y-axis: F is three left of it. F prime is three right of it, at the same height.' },
  't.rule': { html: 'Now write the rule for every point: tap the new x, then the new y.', say: 'Now write the rule for every point: tap the new x, then the new y.' },
  't.r-ok': { html: `Yes: ${s('(x, y) → (−x, y)')}. Across the y-axis, x becomes its opposite and y stays.`, say: 'Yes: x, y goes to negative x, y. Across the y-axis, x becomes its opposite, and y stays.' },
  't.r-named': { html: 'That is the rule for the x-axis. This fold moves points sideways, so x is the one that changes.', say: 'That is the rule for the x-axis. This fold moves points sideways, so x is the one that changes.' },
  't.r-both': { html: 'Changing both signs would turn the logo upside down too. Only x changes.', say: 'Changing both signs would turn the logo upside down too. Only x changes.' },
  't.r-same': { html: 'Then nothing would move. The fold sends x to its opposite.', say: 'Then nothing would move. The fold sends x to its opposite.' },
  't.r-slot': { html: 'The first box is the new x, the second box is the new y.', say: 'The first box is the new x, the second box is the new y.' },
  't.cb-0': { html: `At the start you picked ${s('(3, −1)')}. Right: left and right change x, up and down change y. A sideways fold changes x too.`, say: 'At the start you picked three, negative one. Right: left and right change x, up and down change y. A sideways fold changes x too.' },
  't.cb-1': { html: `At the start you picked ${w('(−6, 8)')}: the move to the right went into y. Left and right change x only, the same idea as this fold.`, say: 'At the start you picked negative six, eight: the move to the right went into y. Left and right change x only, the same idea as this fold.' },
  't.cb-2': { html: `At the start you picked ${w('(−7, −1)')}. −2 + 5 is 3: start at −2 on the x-axis and go 5 to the right.`, say: 'At the start you picked negative seven, negative one. Negative two plus five is three: start at negative two and go five to the right.' },
  't.cb-sure': { html: 'And you were certain. Worth remembering: check which way the point moves before you change a number.', say: 'And you were certain. Worth remembering: check which way the point moves before you change a number.' },
  // 4. Prove it: Jordan reflects K(4, −3) across the x-axis and writes K′(−4, −3)
  'p.intro': { html: `Jordan reflects ${a('K(4, −3)')} across the ${b('x-axis')} and writes ${w('K′(−4, −3)')}: “It's the x-axis, so x changes sign.”`, say: "Jordan reflects K, four, negative three, across the x-axis, and writes K prime, negative four, negative three. It's the x-axis, so x changes sign." },
  'p.ask': { html: 'Is Jordan right?', say: 'Is Jordan right?' },
  'p.build-no': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.build-yes': { html: "Let's test it. Build the argument, and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.k1': { html: `A fold across the ${b('x-axis')} moves K straight up or down,`, say: 'A fold across the x-axis moves K straight up or down,' },
  'p.k2': { html: 'so K′ keeps the x-coordinate 4,', say: 'so K prime keeps the x-coordinate four,' },
  'p.k3': { html: `and K′ is 3 above the axis: ${s('K′ = (4, 3)')}.`, say: 'and K prime is three above the axis: four, three.' },
  'p.c1': { html: 'The fold line from K is vertical: it meets the x-axis at a right angle.', say: 'The fold line from K is vertical: it meets the x-axis at a right angle.' },
  'p.c2': { html: 'K and K′ sit on the same vertical line, x = 4.', say: 'K and K prime sit on the same vertical line, x equals four.' },
  'p.c3': { html: "3 below, 3 above. Jordan's point (−4, −3) is a fold across the y-axis instead.", say: "Three below, three above. Jordan's point is a fold across the y-axis instead." },
  'p.w-named': { html: "That's Jordan's slip. The axis names the mirror, not the coordinate that changes.", say: "That's Jordan's slip. The axis names the mirror, not the coordinate that changes." },
  'p.w-both': { html: 'Changing both signs is a half turn around the origin, not a fold.', say: 'Changing both signs is a half turn around the origin, not a fold.' },
  'p.w-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: `That's a proof: a fold across the x-axis moves points up or down, so x stays and y becomes its opposite: ${s('(x, y) → (x, −y)')}.`, say: "That's a proof: a fold across the x-axis moves points up or down, so x stays, and y becomes its opposite: x, y goes to x, negative y." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
