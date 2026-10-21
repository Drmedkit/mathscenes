// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the solid, b = the plane, s = the cross-section), `say` is the same line written to be read aloud;
// pages/lessons/cross-sections/voice/lines.json holds the `say` texts (the test keeps the two in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A deli cuts a ${a('block of cheese 6 in long, 4 in wide and 3 in tall')}. The ${b('knife')} goes straight down, parallel to the end of the block, 2 in from the right end.`, say: 'A deli cuts a block of cheese six inches long, four inches wide and three inches tall. The knife goes straight down, parallel to the end of the block, two inches from the right end.' },
  'q.ask': { html: `What is the ${s('cross-section')} the knife makes?`, say: 'What is the cross-section the knife makes?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The ${b('plane')} of the cut is parallel to the end of the block: the ${a('4 in × 3 in')} face.`, say: 'The plane of the cut is parallel to the end of the block: the four inch by three inch face.' },
  'e.s2': { html: `It crosses ${s('4 faces')}: the top, the front, the bottom and the back. Each crossing is one side of the cross-section.`, say: 'It crosses four faces: the top, the front, the bottom and the back. Each crossing is one side of the cross-section.' },
  'e.s3': { html: `Slide the cut-off piece away. The ${s('cross-section')} is the flat face the cut leaves. It has no thickness. On the board it lies flat.`, say: 'Slide the cut-off piece away. The cross-section is the flat face the cut leaves. It has no thickness. On the board, it lies flat.' },
  'e.s4': { html: `It is a ${s('rectangle, 4 in × 3 in')}. Its sides run along the 4 in and 3 in edges, just like the end face.`, say: "It's a rectangle, four inches by three inches. Its sides run along the four inch and three inch edges, just like the end face." },
  'e.why': { html: 'Quick check: why is it 4 in × 3 in, and not 6 in × 4 in?', say: 'Quick check. Why is it four by three, and not six by four?' },
  'e.w-ok': { html: 'Yes. The cut is parallel to the 4 in × 3 in end, so its sides run along those two edges.', say: 'Yes. The cut is parallel to the four by three end, so its sides run along those two edges.' },
  'e.w-base': { html: 'Only a level cut copies the bottom face. This cut stands up, parallel to the end.', say: 'Only a level cut copies the bottom face. This cut stands up, parallel to the end.' },
  'e.w-piece': { html: 'The piece has thickness: it is a solid. The cross-section is only the flat face where the knife went.', say: 'The piece has thickness: it is a solid. The cross-section is only the flat face where the knife went.' },
  // 3. Your turn
  't.intro': { html: `This ${a('glass paperweight')} is a right rectangular pyramid: a ${a('6 in × 4 in')} rectangle for a base, and an apex right above the middle of the base.`, say: 'This glass paperweight is a right rectangular pyramid: a six by four inch rectangle for a base, and an apex right above the middle of the base.' },
  't.s1': { html: `The ${b('plane')} is parallel to the base, halfway up to the apex.`, say: 'The plane is parallel to the base, halfway up to the apex.' },
  't.s2': { html: `It crosses the ${s('4')} slanted faces, so the cross-section has 4 sides.`, say: 'It crosses the four slanted faces, so the cross-section has four sides.' },
  't.s3': { html: 'Lift off the top. The cross-section lies flat on the board.', say: 'Lift off the top. The cross-section lies flat on the board.' },
  't.name': { html: 'What is this cross-section?', say: 'What is this cross-section?' },
  't.n-ok': { html: `Yes. Halfway up, every slanted face has come halfway in toward the apex: half as long and half as wide, ${s('3 in × 2 in')}.`, say: 'Yes. Halfway up, every slanted face has come halfway in toward the apex: half as long and half as wide. Three inches by two inches.' },
  't.n-base': { html: 'That would be true for a box. A pyramid leans in, so the slice halfway up is smaller than the base.', say: 'That would be true for a box. A pyramid leans in, so the slice halfway up is smaller than the base.' },
  't.n-tri': { html: 'This cut crosses all 4 slanted faces, so it has 4 sides, each parallel to a base edge.', say: 'This cut crosses all four slanted faces, so it has four sides, each parallel to a base edge.' },
  't.rise': { html: 'Move the plane up and the rectangle shrinks. At the apex it is just a point.', say: 'Move the plane up, and the rectangle shrinks. At the apex, it is just a point.' },
  't.stand': { html: `Now stand the ${b('plane')} up: perpendicular to the base, parallel to the 4 in edges, through the apex. It crosses the base and 2 slanted faces: a ${s('triangle')}.`, say: 'Now stand the plane up: perpendicular to the base, parallel to the four inch edges, through the apex. It crosses the base and two slanted faces: a triangle.' },
  't.slide': { html: 'Slide it off the apex. What shape is the cross-section now?', say: 'Slide it off the apex. What shape is the cross-section now?' },
  't.s-ok': { html: `Yes: missing the apex, it crosses one more face, so there is a short top side, parallel to the bottom: a ${s('trapezoid')}.`, say: 'Yes. Missing the apex, it crosses one more face, so there is a short top side, parallel to the bottom: a trapezoid.' },
  't.s-tri': { html: 'Only a cut through the apex has its slanted sides meet. This one misses the apex and crosses a fourth face: 4 sides.', say: 'Only a cut through the apex has its slanted sides meet. This one misses the apex, and crosses a fourth face: four sides.' },
  't.s-rect': { html: 'A box would give a rectangle. The pyramid leans in, so the top side is shorter than the bottom.', say: 'A box would give a rectangle. The pyramid leans in, so the top side is shorter than the bottom.' },
  't.bottom': { html: 'How long is its bottom side?', say: 'How long is its bottom side?' },
  't.b-ok': { html: `Yes: the bottom side lies in the base, parallel to the 4 in edges, so it is ${s('4 in')} too.`, say: 'Yes. The bottom side lies in the base, parallel to the four inch edges, so it is four inches too.' },
  't.b-no': { html: 'The bottom side lies in the base and runs parallel to the 4 in edges. How long are they?', say: 'The bottom side lies in the base, and runs parallel to the four inch edges. How long are they?' },
  't.fill': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: 'At the start you picked 4 in × 3 in, and you were right. Now you can show why.', say: 'At the start you picked four by three, and you were right. Now you can show why.' },
  't.cb-base': { html: `At the start you picked 6 in × 4 in: that copies the bottom face. A standing cut parallel to the end gives ${s('4 in × 3 in')}.`, say: 'At the start you picked six by four: that copies the bottom face. A standing cut parallel to the end gives four by three.' },
  't.cb-piece': { html: `At the start you picked the piece that was cut off. The cross-section is only the flat face: ${s('4 in × 3 in')}.`, say: 'At the start you picked the piece that was cut off. The cross-section is only the flat face: four by three.' },
  // 4. Prove it
  'p.intro': { html: `Jordan says: “Tilt the cut just right and you can slice a ${a('cube')} so the cross-section is an octagon, with 8 sides.”`, say: 'Jordan says: tilt the cut just right, and you can slice a cube so the cross-section is an octagon, with eight sides.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument, and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Each side of a cross-section lies on one face of the cube,', say: 'Each side of a cross-section lies on one face of the cube,' },
  'p.c2': { html: 'and no face can hold two sides,', say: 'and no face can hold two sides,' },
  'p.c3': { html: `so a cube's cross-section has ${s('at most 6 sides')}: an octagon is impossible.`, say: "so a cube's cross-section has at most six sides. An octagon is impossible." },
  'p.x-rect': { html: 'Not true: a tilted cut can give a triangle, a pentagon or a hexagon. The reason has to come from the faces.', say: 'Not true. A tilted cut can give a triangle, a pentagon or a hexagon. The reason has to come from the faces.' },
  'p.x-tilt': { html: "That is Jordan's idea, the one being tested. A shape is possible only if a real cut makes it.", say: "That is Jordan's idea, the one being tested. A shape is possible only if a real cut makes it." },
  'p.x-two': { html: 'A face is flat, so the cut crosses it in one straight segment: one side, never two.', say: 'A face is flat, so the cut crosses it in one straight segment: one side, never two.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof. Six faces, one side each: at most six sides, and this cut reaches six. An octagon is impossible.", say: "That's a proof. Six faces, one side each: at most six sides, and this cut reaches six. An octagon is impossible." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
