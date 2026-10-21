// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours),
// `say` is the same line written to be read aloud; pages/lessons/square-and-cube-roots/voice/lines.json holds the
// `say` texts (the test keeps the two in step). The page shows a line with ctx.say(id) next to it.
import { sq, cb } from './items';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A cube-shaped gift box holds exactly ${a('64 one-inch cubes')}: ${a('64 cubic inches')}.`, say: 'A cube-shaped gift box holds exactly sixty-four one-inch cubes: sixty-four cubic inches.' },
  'q.ask': { html: 'How long is each edge of the box?', say: 'How long is each edge of the box?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `Laid flat, the ${a('64')} cubes make one square layer, ${b('8 by 8')}. Its side is the square root: ${sq(64)} = ${b('8')}.`, say: 'Laid flat, the sixty-four cubes make one square layer, eight by eight. Its side is the square root: the square root of sixty-four is eight.' },
  'e.s2': { html: `In the box they stack in layers of 4 by 4 = 16 cubes. Four layers fill it: 16 × 4 = ${a('64')}.`, say: 'In the box they stack in layers of four by four, sixteen cubes. Four layers fill it: sixteen times four is sixty-four.' },
  'e.s3': { html: `Count along one edge: ${s('4 cubes')}. The edge is ${s('4 inches')}.`, say: 'Count along one edge: four cubes. The edge is four inches.' },
  'e.s4': { html: `Check: 4 × 4 × 4 = ${a('64')}. So the cube root of 64 is 4: ${cb(64)} = ${s('4')}. The little 3 means: one number, used 3 times.`, say: 'Check: four times four times four is sixty-four. So the cube root of sixty-four is four. The little three means: one number, used three times.' },
  'e.why': { html: 'Quick check: why is the edge 4 inches, and not 8?', say: 'Quick check: why is the edge four inches, and not eight?' },
  'e.w-ok': { html: 'Yes. 8 × 8 = 64 uses 8 twice: that is the flat layer. A cube uses its edge three times, and 8 × 8 × 8 = 512.', say: 'Yes. Eight times eight is sixty-four, but that uses eight twice: that is the flat layer. A cube uses its edge three times, and eight times eight times eight is five hundred twelve.' },
  'e.w-sq': { html: 'The little 3 changes the question: which number, used three times, makes 64? An 8-inch box would hold 8 × 8 × 8 = 512 cubes.', say: 'The little three changes the question: which number, used three times, makes sixty-four? An eight-inch box would hold five hundred twelve cubes.' },
  'e.w-div': { html: '64 ÷ 3 is 21 and a third, and a box with that edge would hold over 9,000 cubes. A cube root is not dividing by 3.', say: 'Sixty-four divided by three is twenty-one and a third, and a box with that edge would hold over nine thousand cubes. A cube root is not dividing by three.' },
  // 3. Your turn
  't.intro': { html: `A bigger cube-shaped box holds ${a('216 one-inch cubes')}. The cubes are stacked for you.`, say: 'A bigger cube-shaped box holds two hundred sixteen one-inch cubes. The cubes are stacked for you.' },
  't.count': { html: 'How long is one edge of this box?', say: 'How long is one edge of this box?' },
  't.fill': { html: 'Type a number in the box first.', say: 'Type a number in the box first.' },
  't.c-ok': { html: `Yes: ${s('6 cubes')} along the edge, so the edge is ${s('6 inches')}.`, say: 'Yes: six cubes along the edge, so the edge is six inches.' },
  't.c-div': { html: 'That divides 216 by 3. Count the cubes along one bottom edge instead.', say: 'That divides two hundred sixteen by three. Count the cubes along one bottom edge instead.' },
  't.c-other': { html: 'Count the cubes along one bottom edge of the box.', say: 'Count the cubes along one bottom edge of the box.' },
  't.check': { html: 'Check it by cubing: 6 × 6 × 6 = ?', say: 'Check it by cubing: six times six times six is what?' },
  't.k-ok': { html: `Yes: 6 × 6 × 6 = ${a('216')}. The edge, used three times, makes the volume.`, say: 'Yes: six times six times six is two hundred sixteen. The edge, used three times, makes the volume.' },
  't.k-mult': { html: '6³ is not 6 × 3. It is 6 × 6 × 6: first 36, then 216.', say: 'Six cubed is not six times three. It is six times six times six: first thirty-six, then two hundred sixteen.' },
  't.k-sq': { html: '6 × 6 = 36 is one layer. Six layers: 36 × 6.', say: 'Six times six, thirty-six, is one layer. There are six layers: thirty-six times six.' },
  't.k-other': { html: 'Multiply 6 × 6 first, then times 6 again.', say: 'Multiply six times six first, then times six again.' },
  't.write': { html: 'Tap the chips to write it with a root sign.', say: 'Tap the chips to write it with a root sign.' },
  't.w-ok': { html: `Yes: ${cb(216)} = ${s('6')}, because 6³ = 216.`, say: 'Yes: the cube root of two hundred sixteen is six, because six cubed is two hundred sixteen.' },
  't.w-sq': { html: 'That is the square root sign. A cube needs the root with the little 3.', say: 'That is the square root sign. A cube needs the root with the little three.' },
  't.w-div': { html: '72 is 216 ÷ 3. The cube root is the edge: 6.', say: 'Seventy-two is two hundred sixteen divided by three. The cube root is the edge: six.' },
  't.w-other': { html: 'Root sign first, then the volume under it, then the edge.', say: 'Root sign first, then the volume under it, then the edge.' },
  't.bound': { html: `One more. A box holds ${a('200 cubic inches')}. Between which two whole numbers is its edge?`, say: 'One more. A box holds two hundred cubic inches. Between which two whole numbers is its edge?' },
  't.b-ok': { html: `Yes: 125 < 200 < 216, so ${s(`5 < ${cb(200)} < 6`)}. This edge is not a whole number of inches.`, say: 'Yes: two hundred is between one hundred twenty-five and two hundred sixteen, so the cube root of two hundred is between five and six. This edge is not a whole number of inches.' },
  't.b-sq': { html: '14 and 15 bound the square root of 200. For a cube use cubes: 5³ = 125 and 6³ = 216.', say: 'Fourteen and fifteen bound the square root of two hundred. For a cube, use cubes: five cubed is one hundred twenty-five, and six cubed is two hundred sixteen.' },
  't.b-cubes': { html: 'Those are the cubes around 200. Their cube roots are the bounds.', say: 'Those are the cubes around two hundred. Their cube roots are the bounds.' },
  't.b-other': { html: 'Which cubes sit just below and just above 200? Try 5³ and 6³.', say: 'Which cubes sit just below and just above two hundred? Try five cubed and six cubed.' },
  't.cb-right': { html: 'At the start you picked 4 inches, and you were right. Now you can show why.', say: 'At the start you picked four inches, and you were right. Now you can show why.' },
  't.cb-sq': { html: `At the start you picked 8 inches: that is the side of the flat layer, ${sq(64)}. The box's edge is the cube root: ${s('4 inches')}.`, say: "At the start you picked eight inches: that is the side of the flat layer, the square root of sixty-four. The box's edge is the cube root: four inches." },
  't.cb-div': { html: `At the start you picked 21⅓ inches: that divides by 3. The edge is ${s('4 inches')}, since 4 × 4 × 4 = 64.`, say: 'At the start you picked twenty-one and a third inches: that divides by three. The edge is four inches, since four times four times four is sixty-four.' },
  // 4. Prove it
  'p.intro': { html: `Jordan writes: “${sq(49)} = ±7, because (−7)² = 49 too.”`, say: 'Jordan writes: the square root of forty-nine is plus or minus seven, because negative seven squared is forty-nine too.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `x² = 49 has two solutions, ${s('x = 7 and x = −7')},`, say: 'x squared equals forty-nine has two solutions, x equals seven and x equals negative seven,' },
  'p.c2': { html: `but the symbol ${sq(49)} names only ${s('7')},`, say: 'but the symbol, the square root of forty-nine, names only seven,' },
  'p.c3': { html: `so x = ±${sq(49)} = ±7, and Jordan’s ${sq(49)} = ±7 is wrong.`, say: "so x is plus or minus the square root of forty-nine, plus or minus seven, and Jordan's line is wrong." },
  'p.x-pm': { html: "That is Jordan's idea, the one being tested. The symbol names one number; the equation has two solutions.", say: "That is Jordan's idea, the one being tested. The symbol names one number; the equation has two solutions." },
  'p.x-pos': { html: 'Check it: (−7) × (−7) = 49, positive. So −7 IS a solution of the equation.', say: 'Check it: negative seven times negative seven is positive forty-nine. So negative seven is a solution of the equation.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: three claims, each with its reason, and the picture backs every one. The equation has two solutions; the root sign names one.", say: "That's a proof: three claims, each with its reason, and the picture backs every one. The equation has two solutions; the root sign names one." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
