// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the surface / area, b = the edge / perimeter, s = the answer), `say` is the same line written to be read aloud;
// pages/lessons/composite-figures/voice/lines.json holds the `say` texts (the test keeps the two in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A ${a('patio')} is a 12 ft by 8 ft rectangle with a half circle on one 8 ft end. Flexible ${b('edging')} will go all the way around its edge.`, say: 'A patio is a twelve foot by eight foot rectangle, with a half circle on one eight foot end. Flexible edging will go all the way around its edge.' },
  'q.ask': { html: `How much ${b('edging')} is needed?`, say: 'How much edging is needed?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Split it: a 12 by 8 ${a('rectangle')} and a ${a('half circle')}. They meet along the dashed seam, so the half circle’s diameter is the 8 ft side and its radius is ${s('4 ft')}.`, say: "Split it: a twelve by eight rectangle and a half circle. They meet along the dashed seam, so the half circle's diameter is the eight foot side, and its radius is four feet." },
  'e.s2': { html: `${a('Area')}: add the parts. The rectangle is 12 × 8; the half circle is half of π × 4². Together ${s('96 + 8π ft²')}, the stones for the patio.`, say: 'Area: add the parts. The rectangle is twelve times eight. The half circle is half of pi times four squared. Together, ninety-six plus eight pi square feet: the stones for the patio.' },
  'e.s3': { html: `${b('Perimeter')}: walk around the edge once. 12, the curved edge, 12, 8. The curve is half of a circle with diameter 8: ½ · 8π = 4π. The seam is inside the patio, so the edging never touches it.`, say: 'Perimeter: walk around the edge once. Twelve, the curved edge, twelve, eight. The curve is half of a circle with diameter eight: half of eight pi, which is four pi. The seam is inside the patio, so the edging never touches it.' },
  'e.s4': { html: `Combine like terms: ${s('32 + 4π ft')}, exactly. Round only at the end: with π ≈ 3.14 that is about ${s('44.6 ft')} of edging.`, say: 'Combine like terms: thirty-two plus four pi feet, exactly. Round only at the end: with pi about three point one four, that is about forty-four point six feet of edging.' },
  'e.why': { html: 'Quick check: why is the 8 ft seam not part of the edging?', say: 'Quick check. Why is the eight foot seam not part of the edging?' },
  'e.w-ok': { html: 'Yes. The seam is where the two parts meet, inside the patio. Walking around the edge, you never step on it.', say: 'Yes. The seam is where the two parts meet, inside the patio. Walking around the edge, you never step on it.' },
  'e.w-seam': { html: 'Not every line in a drawing is an edge. The seam only shows where the parts meet; the edging runs along the outside.', say: 'Not every line in a drawing is an edge. The seam only shows where the parts meet. The edging runs along the outside.' },
  'e.w-across': { html: 'The curve bends out, so it is longer than the straight 8 ft: half of 8π, about 12.6 ft. And the seam still is not on the edge.', say: 'The curve bends out, so it is longer than the straight eight feet: half of eight pi, about twelve point six feet. And the seam still is not on the edge.' },
  // 3. Your turn
  't.intro': { html: `A ${a('flower bed')} is shaped like a running track: a 14 ft by 8 ft rectangle with a half circle on each 8 ft end. ${b('Edging')} goes around it.`, say: 'A flower bed is shaped like a running track: a fourteen foot by eight foot rectangle, with a half circle on each eight foot end. Edging goes around it.' },
  't.s1': { html: `Split it: a rectangle and two half circles, each with diameter 8, so radius ${s('4 ft')}.`, say: 'Split it: a rectangle and two half circles, each with diameter eight, so radius four feet.' },
  't.s2': { html: `${a('Area')}: 14 × 8, plus two half circles, which make one whole circle: π × 4². That is ${s('112 + 16π ft²')} of soil.`, say: 'Area: fourteen times eight, plus two half circles, which make one whole circle: pi times four squared. That is one hundred twelve plus sixteen pi square feet of soil.' },
  't.walk': { html: `Your step: which pieces does the ${b('edging')} run along?`, say: 'Your step. Which pieces does the edging run along?' },
  't.w-ok': { html: 'Yes: two straight sides and two curves. The two 8 ft seams are inside the bed.', say: 'Yes. Two straight sides and two curves. The two eight foot seams are inside the bed.' },
  't.w-seam': { html: 'The two 8 ft lines are seams, inside the bed where the parts meet. The edging never runs there.', say: 'The two eight foot lines are seams, inside the bed where the parts meet. The edging never runs there.' },
  't.w-curve': { html: 'The curved ends are edges too. The edging bends around them.', say: 'The curved ends are edges too. The edging bends around them.' },
  't.exact': { html: `Now write the ${b('perimeter')} exactly: a number part plus a π part.`, say: 'Now write the perimeter exactly: a number part, plus a pi part.' },
  't.e-ok': { html: `Yes: 14 + 14 = 28, and each curve is half of 8π, so the two make 8π: ${s('28 + 8π ft')}.`, say: 'Yes. Fourteen plus fourteen is twenty-eight, and each curve is half of eight pi, so the two make eight pi: twenty-eight plus eight pi feet.' },
  't.e-half': { html: 'That is one curve. There are two, and together they make a whole circle’s circumference.', say: "That is one curve. There are two, and together they make a whole circle's circumference." },
  't.e-area': { html: 'π × 4² is the circle’s area. The edge is the circumference: π × 8.', say: "Pi times four squared is the circle's area. The edge is the circumference: pi times eight." },
  't.e-unlike': { html: '28 is not a π term, so it cannot join 8π. Keep them apart: 28 + 8π.', say: 'Twenty-eight is not a pi term, so it cannot join eight pi. Keep them apart.' },
  't.e-seam': { html: 'That has the two 8 ft seams in it. They are inside the bed: leave them out.', say: 'That has the two eight foot seams in it. They are inside the bed. Leave them out.' },
  't.e-no': { html: 'Add the straight sides; then the two curves, each half of π × 8.', say: 'Add the straight sides. Then the two curves, each half of pi times eight.' },
  't.round': { html: 'About how many feet is that? Round to the nearest tenth, at the end.', say: 'About how many feet is that? Round to the nearest tenth, at the end.' },
  't.r-ok': { html: `Yes: 28 + 8π ≈ ${s('53.1 ft')} of edging.`, say: 'Yes. Twenty-eight plus eight pi is about fifty-three point one feet of edging.' },
  't.r-unlike': { html: 'That is 36π: only the 8 is multiplied by π. Work out 8π first, then add 28.', say: 'That is thirty-six pi. Only the eight is multiplied by pi. Work out eight pi first, then add twenty-eight.' },
  't.r-early': { html: 'π was rounded too early. Keep 3.14 (or the π key) and round only the final answer.', say: 'Pi was rounded too early. Keep three point one four, or the pi key, and round only the final answer.' },
  't.r-no': { html: '8π is about 25.13. Add 28, then round to the nearest tenth.', say: 'Eight pi is about twenty-five point one three. Add twenty-eight, then round to the nearest tenth.' },
  't.fill': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: 'At the start you picked 32 + 4π ft, and you were right. Now you can show why.', say: 'At the start you picked thirty-two plus four pi feet, and you were right. Now you can show why.' },
  't.cb-seam': { html: `At the start you picked 40 + 4π ft: that walks along the seam. The seam is inside, so the edging is ${s('32 + 4π ft')}.`, say: 'At the start you picked forty plus four pi feet. That walks along the seam. The seam is inside, so the edging is thirty-two plus four pi feet.' },
  't.cb-curve': { html: `At the start you picked 32 ft: that leaves out the curved edge. The edging bends around it too: ${s('32 + 4π ft')}.`, say: 'At the start you picked thirty-two feet. That leaves out the curved edge. The edging bends around it too: thirty-two plus four pi feet.' },
  // 4. Prove it
  'p.intro': { html: `Riley says: “Cut a piece out of a shape, and its ${b('perimeter')} always gets smaller.” Test it: a 10 ft by 6 ft table top gets a half-circle notch of radius 2 ft cut into one long side.`, say: 'Riley says: cut a piece out of a shape, and its perimeter always gets smaller. Test it. A ten foot by six foot table top gets a half circle notch, of radius two feet, cut into one long side.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'The notch takes away 4 ft of straight edge,', say: 'The notch takes away four feet of straight edge,' },
  'p.c2': { html: 'but it adds a curved edge of 2π ft, about 6.3 ft,', say: 'but it adds a curved edge of two pi feet, about six point three feet,' },
  'p.c3': { html: `so the perimeter goes ${s('up')}, from 32 to 28 + 2π ≈ 34.3 ft, while the area goes down. Riley is wrong.`, say: 'so the perimeter goes up, from thirty-two to twenty-eight plus two pi, about thirty-four point three feet, while the area goes down. Riley is wrong.' },
  'p.x-shrink': { html: 'The cut also makes a new edge, all along the curve. That edge counts.', say: 'The cut also makes a new edge, all along the curve. That edge counts.' },
  'p.x-together': { html: "That is Riley's idea, the one being tested. A rule that says always needs to hold for every shape.", say: "That is Riley's idea, the one being tested. A rule that says always needs to hold for every shape." },
  'p.x-across': { html: 'The curve bends, so it is longer than the straight gap: half of 4π, about 6.3 ft.', say: 'The curve bends, so it is longer than the straight gap: half of four pi, about six point three feet.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof by counterexample. One cut that makes the perimeter longer is enough to break “always”.", say: "That's a proof by counterexample. One cut that makes the perimeter longer is enough to break always." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
