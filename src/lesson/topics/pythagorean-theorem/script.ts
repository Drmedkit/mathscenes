// script.ts: every voiced line of parts 1-4, by id. `html` is what the panel shows (role colours: amber = the run /
// first leg, teal = the rise / second leg, lime = the hypotenuse, the answer), `say` is the same line written to be
// read aloud (no digits, no symbols). pages/lessons/pythagorean-theorem/voice/lines.json holds the `say` texts; the
// test keeps the two in step.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const R = (n: string) => `√<span style="border-top:1.5px solid currentColor;padding:1px 1px 0">${n}</span>`;
const sq = (x: string) => `${x}<sup>2</sup>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // ---------- 1. the question ----------
  'q.intro': {
    html: `A drone flies in a straight line from A(3, 4) to B(9, 12) on a map. Each grid unit is 1 mile. How far does it fly? Pick an answer, and say how sure you are.`,
    say: 'A drone flies in a straight line from A to B on a map. Each grid unit is one mile. How far does it fly? Pick an answer, and say how sure you are.',
  },
  // ---------- 2. worked example ----------
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one. The picture moves first, then the notation.' },
  'e.s0': {
    html: `Go ${a('across')} from A, then ${b('up')} to B. The corner C(9, 4) is a right angle: grid lines are perpendicular. So ${s('AB')} is the hypotenuse.`,
    say: 'Go across from A, then up to B. The corner C is a right angle, because grid lines are perpendicular. So A B is the hypotenuse.',
  },
  'e.s1': {
    html: `The legs are how far you move: the ${a('run')} is 9 − 3 = ${a('6')}, the ${b('rise')} is 12 − 4 = ${b('8')}.`,
    say: 'The legs are how far you move. The run is nine minus three, six. The rise is twelve minus four, eight.',
  },
  'e.s2': {
    html: `${sq('AB')} = ${sq(a('6'))} + ${sq(b('8'))} = 36 + 64 = 100.`,
    say: 'A B squared is six squared plus eight squared: thirty six plus sixty four, one hundred.',
  },
  'e.s3': {
    html: `AB = ${R('100')} = ${s('10 miles')}. It is longer than each leg and shorter than the trip around the corner (14): a sensible size.`,
    say: 'A B is the square root of one hundred: ten miles. It is longer than each leg, and shorter than the trip around the corner. A sensible size.',
  },
  'e.why': { html: 'Quick check: why are the legs 6 and 8, and not 9 and 12?', say: 'Quick check. Why are the legs six and eight, and not nine and twelve?' },
  'e.why-ok': {
    html: 'Yes. A leg is how far you move from A to B: 9 − 3 across and 12 − 4 up.',
    say: 'Yes. A leg is how far you move from A to B: nine minus three across, and twelve minus four up.',
  },
  'e.why-coord': {
    html: '9 and 12 say where B is, measured from the origin, not from A. That triangle would start at (0, 0).',
    say: 'Nine and twelve say where B is, measured from the origin, not from A. That triangle would start at zero, zero.',
  },
  'e.why-add': {
    html: 'Adding the coordinates (3 + 9, 4 + 12) gives no distance at all. Distance along a line is a difference: subtract.',
    say: 'Adding the coordinates gives no distance at all. Distance along a line is a difference, so subtract.',
  },
  // ---------- 3. your turn ----------
  't.intro': {
    html: `Now in 3-D: a box is ${a('3 in')} by ${a('4 in')} by ${b('12 in')}. How long is the longest stick that fits, from corner A to corner G? The first triangle is done for you.`,
    say: 'Now in three D. A box is three inches by four inches by twelve inches. How long is the longest stick that fits, from corner A to corner G? The first triangle is done for you.',
  },
  't.tri': { html: `AG goes through the inside of the box. Which right triangle has ${s('AG')} as its hypotenuse?`, say: 'A G goes through the inside of the box. Which right triangle has A G as its hypotenuse?' },
  't.tri-ok': {
    html: `Yes: AC on the floor, CG straight up, AG across. The right angle is at C: CG is perpendicular to the whole floor.`,
    say: 'Yes. A C on the floor, C G straight up, A G across. The right angle is at C, because C G is perpendicular to the whole floor.',
  },
  't.tri-floor': { html: 'ABC lies flat on the floor: its hypotenuse is the floor diagonal AC. AG also climbs the height.', say: 'A B C lies flat on the floor. Its hypotenuse is the floor diagonal, A C. A G also climbs the height.' },
  't.tri-front': { html: 'ABF lies on the front face: its hypotenuse is AF, a face diagonal, not AG.', say: 'A B F lies on the front face. Its hypotenuse is A F, a face diagonal, not A G.' },
  't.sq': { html: `In triangle ACG, the legs are ${a('AC = 5')} and ${b('CG = 12')}. What is ${sq('AG')}?`, say: 'In triangle A C G, the legs are A C, five, and C G, twelve. What is A G squared?' },
  't.sq-ok': { html: `Yes: 25 + 144 = 169.`, say: 'Yes. Twenty five plus one hundred forty four is one hundred sixty nine.' },
  't.sq-face': { html: '25 is the floor diagonal squared. AG also climbs 12 in: add 12².', say: 'Twenty five is the floor diagonal squared. A G also climbs twelve inches, so add twelve squared.' },
  't.sq-add': { html: 'That adds lengths. Square the legs first: 5² + 12².', say: 'That adds lengths. Square the legs first: five squared plus twelve squared.' },
  't.sq-no': { html: 'Square each leg, then add: 5 × 5 + 12 × 12.', say: 'Square each leg, then add. Five times five, plus twelve times twelve.' },
  't.len': { html: `${sq('AG')} = 169. How long is AG?`, say: 'A G squared is one hundred sixty nine. How long is A G?' },
  't.len-ok': { html: `Yes: ${R('169')} = ${s('13 in')}. A 13-inch stick just fits, corner to corner.`, say: 'Yes. The square root of one hundred sixty nine is thirteen inches. A thirteen inch stick just fits, corner to corner.' },
  't.len-root': { html: '169 is AG². The length is its square root: which number times itself makes 169?', say: 'One hundred sixty nine is A G squared. The length is its square root. Which number times itself makes one hundred sixty nine?' },
  't.len-half': { html: 'A square root is not half: 84.5 × 84.5 is far more than 169.', say: 'A square root is not half. Eighty four and a half times itself is far more than one hundred sixty nine.' },
  't.len-face': { html: '5 is the floor diagonal AC. AG climbs 12 in more, so it is longer.', say: 'Five is the floor diagonal, A C. A G climbs twelve inches more, so it is longer.' },
  't.len-add': { html: 'Adding lengths walks along the edges. The straight stick is shorter.', say: 'Adding lengths walks along the edges. The straight stick is shorter.' },
  't.len-no': { html: 'Which number times itself makes 169?', say: 'Which number times itself makes one hundred sixty nine?' },
  't.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': {
    html: 'At the start you picked 10 miles, and you were right. On the plane and in a box it is the same move: find the right triangle, square, add, take the root.',
    say: 'At the start you picked ten miles, and you were right. On the plane and in a box it is the same move: find the right triangle, square, add, take the root.',
  },
  't.cb-add': {
    html: 'At the start you picked 14 miles. That is the trip along the grid, 6 + 8. The straight line is shorter: the squares add, not the lengths.',
    say: 'At the start you picked fourteen miles. That is the trip along the grid. The straight line is shorter: the squares add, not the lengths.',
  },
  't.cb-coord': {
    html: 'At the start you picked 15 miles. That used B’s coordinates, 9 and 12, as the legs. The legs are how far you move: 6 and 8.',
    say: 'At the start you picked fifteen miles. That used the coordinates of B as the legs. The legs are how far you move: six and eight.',
  },
  't.cb-none': { html: 'Find the right triangle, square, add, take the root: on a map, in a box, anywhere.', say: 'Find the right triangle, square, add, take the root. On a map, in a box, anywhere.' },
  // ---------- 4. prove it: the converse ----------
  'p.intro': {
    html: `Lena’s triangle has sides 5, 12, 13, and 25 + 144 = 169. Lena: “Right triangle → ${sq('a')} + ${sq('b')} = ${sq('c')}, so ${sq('a')} + ${sq('b')} = ${sq('c')} → right triangle. Rules work backward.” Is her reason good?`,
    say: 'Lena’s triangle has sides five, twelve and thirteen, and twenty five plus one hundred forty four is one hundred sixty nine. Lena says: a right triangle gives a squared plus b squared equals c squared, so the equation gives a right triangle. Rules work backward. Is her reason good?',
  },
  'p.flip': {
    html: 'Test it: “a square has four right angles”. Backward it fails: a 2 by 5 rectangle has four too. So the converse needs a proof. Pick each reason.',
    say: 'Test it. A square has four right angles. Backward it fails: a two by five rectangle has four too. So the converse needs a proof. Pick each reason.',
  },
  'p.build': { html: 'Right: rules do not always flip. So prove the converse: pick each reason.', say: 'Right. Rules do not always flip. So prove the converse: pick each reason.' },
  'p.c1': { html: 'Right. Draw a right angle, mark 5 and 12 along its sides.', say: 'Right. Draw a right angle, and mark five and twelve along its sides.' },
  'p.c2': { html: 'Right. The new triangle IS right, so its hypotenuse is √169 = 13.', say: 'Right. The new triangle is right, so its hypotenuse is the square root of one hundred sixty nine: thirteen.' },
  'p.c3': { html: 'Right. Same three sides: it fits exactly on Lena’s triangle.', say: 'Right. Same three sides: it fits exactly on Lena’s triangle.' },
  'p.no-flip': { html: 'That is the reason we just tested: rules do not always flip.', say: 'That is the reason we just tested. Rules do not always flip.' },
  'p.no-looks': { html: 'Looks are not a reason: 89° looks square too. Use the three lengths.', say: 'Looks are not a reason. Eighty nine degrees looks square too. Use the three lengths.' },
  'p.no-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': {
    html: 'That proves the converse: same legs, the theorem gives the hypotenuse, same three sides give the same right angle.',
    say: 'That proves the converse. Same legs, the theorem gives the hypotenuse, and same three sides give the same right angle.',
  },
};
