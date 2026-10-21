// script.ts: every voiced line of parts 1-4, by id. `html` is what the panel shows (role colours: amber = leg a,
// teal = leg b, lime = the hypotenuse c / the answer), `say` is the same line written to be read aloud (no digits, no
// symbols). pages/lessons/pythagoras-intro/voice/lines.json holds the `say` texts; the test keeps the two in step.
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;
const R = (n: string) => `√<span style="border-top:1.5px solid currentColor;padding:1px 1px 0">${n}</span>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': {
    html: `A right triangle on grid paper: its legs are ${a('3 inches')} and ${b('4 inches')}, and each grid square is 1 inch. How long is the ${s('slanted side')}? Pick an answer and say how sure you are.`,
    say: 'A right triangle on grid paper: its legs are three inches and four inches, and each grid square is one inch. How long is the slanted side? Pick an answer and say how sure you are.',
  },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s0': {
    html: `The square corner is the right angle. The side across from it is the ${s('hypotenuse')}, ${s('<i>c</i>')}. The two sides that make the right angle are the legs, ${a('<i>a</i>')} and ${b('<i>b</i>')}.`,
    say: 'The square corner is the right angle. The side across from it is the hypotenuse, c. The two sides that make the right angle are the legs, a and b.',
  },
  'e.s1': {
    html: `A square on the 3 inch leg covers ${a('3 × 3 = 9')} square inches. On the 4 inch leg: ${b('4 × 4 = 16')}. That is what ${a('<i>a</i>²')} and ${b('<i>b</i>²')} mean: areas of squares.`,
    say: 'A square on the three inch leg covers three times three, nine square inches. On the four inch leg: four times four, sixteen. That is what a squared and b squared mean: areas of squares.',
  },
  'e.s2': {
    html: `The square on ${s('<i>c</i>')} is tilted, so surround it: the upright square around it is 7 by 7 = 49. Take away the 4 corner triangles of 6 each: ${s('<i>c</i>² = 49 − 24 = 25')}.`,
    say: 'The square on c is tilted, so surround it: the upright square around it is seven by seven, forty-nine. Take away the four corner triangles of six each: c squared is forty-nine minus twenty-four, twenty-five.',
  },
  'e.s3': {
    html: `${a('9')} + ${b('16')} = ${s('25')}: the two leg squares together cover the hypotenuse square exactly. So ${s('<i>c</i> = ' + R('25') + ' = 5 inches')}.`,
    say: 'Nine plus sixteen is twenty-five: the two leg squares together cover the hypotenuse square exactly. So c is the square root of twenty-five: five inches.',
  },
  'e.rule': {
    html: `It works for every right triangle: ${a('<i>a</i>²')} + ${b('<i>b</i>²')} = ${s('<i>c</i>²')}. This is the Pythagorean theorem.`,
    say: 'It works for every right triangle: a squared plus b squared equals c squared. This is the Pythagorean theorem.',
  },
  'e.why': { html: 'Quick check: why is the slanted side 5 inches, and not 7?', say: 'Quick check: why is the slanted side five inches, and not seven?' },
  'e.why-ok': { html: 'Yes. The side of a square is the number that, times itself, makes its area: 5 × 5 = 25.', say: 'Yes. The side of a square is the number that, times itself, makes its area: five times five is twenty-five.' },
  'e.why-add': { html: 'Walking along both legs is 3 + 4 = 7 inches. The slanted side cuts across the corner, so it is shorter: 5 inches.', say: 'Walking along both legs is three plus four, seven inches. The slanted side cuts across the corner, so it is shorter: five inches.' },
  'e.why-area': { html: '25 is the area of the square, in square inches. The side is the number that times itself makes 25: 5.', say: 'Twenty-five is the area of the square, in square inches. The side is the number that times itself makes twenty-five: five.' },
  // 3. Your turn
  't.intro': { html: `Your turn: legs of ${a('6 inches')} and ${b('8 inches')}. The first two steps are done for you.`, say: 'Your turn: legs of six inches and eight inches. The first two steps are done for you.' },
  't.area': { html: `What is the area of the square on the hypotenuse, ${s('<i>c</i>²')}?`, say: 'What is the area of the square on the hypotenuse, c squared?' },
  't.area-ok': { html: `Yes: ${a('36')} + ${b('64')} = ${s('100')} square inches. The two leg squares fill the hypotenuse square.`, say: 'Yes: thirty-six plus sixty-four is one hundred square inches. The two leg squares fill the hypotenuse square.' },
  't.area-add': { html: '14 adds the side lengths, 6 + 8. The theorem adds the AREAS of the squares: 36 + 64.', say: 'Fourteen adds the side lengths, six plus eight. The theorem adds the areas of the squares: thirty-six plus sixty-four.' },
  't.area-sub': { html: 'The square on the hypotenuse is the biggest one: the two leg squares together cover it. 36 + 64 = ?', say: 'The square on the hypotenuse is the biggest one: the two leg squares together cover it. Thirty-six plus sixty-four is what?' },
  't.area-side': { html: '10 inches is a side. The question asks for the AREA of the square on the hypotenuse.', say: 'Ten inches is a side. The question asks for the area of the square on the hypotenuse.' },
  't.area-no': { html: 'The two leg squares together cover the hypotenuse square. Add their areas.', say: 'The two leg squares together cover the hypotenuse square. Add their areas.' },
  't.empty': { html: 'Type a number first.', say: 'Type a number first.' },
  't.c': { html: `Now the side: how long is the hypotenuse, ${s('<i>c</i>')}?`, say: 'Now the side: how long is the hypotenuse, c?' },
  't.c-ok': { html: `Yes: 10 × 10 = 100, so ${s('<i>c</i> = ' + R('100') + ' = 10 inches')}.`, say: 'Yes: ten times ten is one hundred, so c is the square root of one hundred, ten inches.' },
  't.c-area': { html: '100 is the area of the square. The side is the number that times itself makes 100.', say: 'One hundred is the area of the square. The side is the number that times itself makes one hundred.' },
  't.c-half': { html: '50 is half of 100. A square root is not half: which number times itself makes 100?', say: 'Fifty is half of one hundred. A square root is not half: which number times itself makes one hundred?' },
  't.c-add': { html: '6 + 8 walks along both legs. The hypotenuse cuts across the corner, so it is shorter.', say: 'Six plus eight walks along both legs. The hypotenuse cuts across the corner, so it is shorter.' },
  't.c-no': { html: 'Which number times itself makes 100?', say: 'Which number times itself makes one hundred?' },
  't.cb-right': { html: 'At the start you picked 5 inches, and you were right. Now you can show why: the two leg squares add up to the hypotenuse square.', say: 'At the start you picked five inches, and you were right. Now you can show why: the two leg squares add up to the hypotenuse square.' },
  't.cb-add': { html: 'At the start you picked 7 inches. That adds the legs, but the slanted side cuts across the corner. Add the squares, not the sides.', say: 'At the start you picked seven inches. That adds the legs, but the slanted side cuts across the corner. Add the squares, not the sides.' },
  't.cb-count': { html: 'At the start you picked 6 inches, maybe by counting the grid squares the slanted side crosses. Most of them it only clips. The areas tell the truth: 5 inches.', say: 'At the start you picked six inches, maybe by counting the grid squares the slanted side crosses. Most of them it only clips. The areas tell the truth: five inches.' },
  't.cb-none': { html: 'Square the legs, add, take the square root. That is how every hypotenuse is found.', say: 'Square the legs, add, take the square root. That is how every hypotenuse is found.' },
  // 4. Prove it
  'p.intro': {
    html: `Sam checked two right triangles, 3, 4, 5 and 6, 8, 10: both work. Sam says: “So ${a('<i>a</i>²')} + ${b('<i>b</i>²')} = ${s('<i>c</i>²')} is true for every right triangle.” Is Sam's check a proof?`,
    say: 'Sam checked two right triangles, three four five and six eight ten: both work. Sam says: so a squared plus b squared equals c squared is true for every right triangle. Is Sam’s check a proof?',
  },
  'p.yes': { html: 'Two examples can’t cover every right triangle. Here is an argument that can. Fill each “because” with the reason that makes the line true.', say: 'Two examples can’t cover every right triangle. Here is an argument that can. Fill each because with the reason that makes the line true.' },
  'p.build': { html: 'Right: examples are not a proof. Here is an argument that is. Fill each “because” with the reason that makes the line true.', say: 'Right: examples are not a proof. Here is an argument that is. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `Right. Four equal sides and four right angles: the middle is a square, ${s('<i>c</i> by <i>c</i>')}.`, say: 'Right. Four equal sides and four right angles: the middle is a square, c by c.' },
  'p.c2': { html: `Right. The triangles slide into two rectangles, ${a('<i>a</i>')} by ${b('<i>b</i>')}. Uncovered: a square on ${a('<i>a</i>')} and a square on ${b('<i>b</i>')}.`, say: 'Right. The triangles slide into two rectangles, a by b. Uncovered: a square on a and a square on b.' },
  'p.c3': { html: `Right. Same big square, same four triangles, so the same area is uncovered: ${s('<i>c</i>²')} = ${a('<i>a</i>²')} + ${b('<i>b</i>²')}.`, say: 'Right. Same big square, same four triangles, so the same area is uncovered: c squared equals a squared plus b squared.' },
  'p.no-looks': { html: 'Looks can fool you. The reason is the angles: the two sharp angles of a right triangle add to 90°, so each corner is 180° − 90° = 90°.', say: 'Looks can fool you. The reason is the angles: the two sharp angles of a right triangle add to ninety degrees, so each corner is one hundred eighty minus ninety, ninety degrees.' },
  'p.no-ex': { html: 'Examples are what Sam had. This argument never uses particular numbers, so it works for any right triangle.', say: 'Examples are what Sam had. This argument never uses particular numbers, so it works for any right triangle.' },
  'p.no-area': { html: `${a('<i>a</i>²')} and ${b('<i>b</i>²')} are areas of squares on the legs, not the area of the triangle.`, say: 'a squared and b squared are areas of squares on the legs, not the area of the triangle.' },
  'p.no-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: it never used particular numbers, so it holds for every right triangle. And it needs the right angle: the 90° corners made the middle a square.', say: 'That’s a proof: it never used particular numbers, so it holds for every right triangle. And it needs the right angle: the ninety degree corners made the middle a square.' },
};
