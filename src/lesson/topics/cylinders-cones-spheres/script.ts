// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the cone / the ball (amber), b = the can (teal), s = the answer), `say` is the same line written to be read
// aloud. pages/lessons/cylinders-cones-spheres/voice/lines.json holds the `say` texts (the test keeps them in step).
const a = (x: string) => `<b class="a">${x}</b>`, b = (x: string) => `<b class="b">${x}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `A ${a('cone-shaped paper cup')} and a ${b('can')} have the same radius, 4 in, and the same height, 6 in.`, say: 'A cone-shaped paper cup and a can have the same radius, four inches, and the same height, six inches.' },
  'q.ask': { html: 'You fill the cup with water and pour it into the can, again and again. How many full cups fill the can?', say: 'You fill the cup with water and pour it into the can, again and again. How many full cups fill the can?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `One layer is the base circle: π · 3² = 9π in². The can is 5 in of layers: 9π · 5 = ${b('45π in³')}.`, say: 'One layer is the base circle: pi times three squared, nine pi square inches. The can is five inches of layers: nine pi times five is forty-five pi cubic inches.' },
  'e.s2': { html: `Three full cones fill the can exactly. So one cone holds a third of it: 45π ÷ 3 = ${a('15π in³')}.`, say: 'Three full cones fill the can exactly. So one cone holds a third of it: forty-five pi divided by three is fifteen pi cubic inches.' },
  'e.s3': { html: `A ball with radius 3 in is 6 in tall, so its can is 6 in tall: 9π · 6 = ${b('54π')}. The ball’s water fills two thirds of it: ${a('36π in³')}.`, say: 'A ball with radius three inches is six inches tall, so its can is six inches tall: nine pi times six is fifty-four pi. The ball’s water fills two thirds of it: thirty-six pi cubic inches.' },
  'e.s4': { html: `It works for any size. Cylinder: ${s('π r² h')}. Cone: ${s('⅓ π r² h')}. Sphere: two thirds of π r² · 2r, which is ${s('⁴⁄₃ π r³')}.`, say: 'It works for any size. Cylinder: pi r squared h. Cone: one third pi r squared h. Sphere: two thirds of pi r squared times two r, which is four thirds pi r cubed.' },
  'e.why': { html: 'Quick check: why was the ball’s can 6 in tall, not 5 in?', say: 'Quick check. Why was the ball’s can six inches tall, not five?' },
  'e.w-ok': { html: 'Yes. The can that just holds a ball is as tall as the ball, and a ball is as tall as its diameter: two radii.', say: 'Yes. The can that just holds a ball is as tall as the ball, and a ball is as tall as its diameter: two radii.' },
  'e.w-any': { html: 'A taller can holds more, so the ball would fill less than two thirds of it. The two thirds is for the can exactly as tall as the ball.', say: 'A taller can holds more, so the ball would fill less than two thirds of it. The two thirds is for the can exactly as tall as the ball.' },
  'e.w-half': { html: 'The ball fills two thirds of its can, not half. The 6 in is the ball’s own height, its diameter.', say: 'The ball fills two thirds of its can, not half. The six inches is the ball’s own height, its diameter.' },
  // 3. Your turn
  't.intro': { html: `A ${a('snow-cone cup')} has radius 2 in and height 6 in, and so does its ${b('can')}. The first two steps are done for you.`, say: 'A snow-cone cup has radius two inches and height six inches, and so does its can. The first two steps are done for you.' },
  't.s1': { html: `Layers: π · 2² = 4π in², times 6 in: the can holds ${b('24π in³')}.`, say: 'Layers: pi times two squared is four pi square inches, times six inches. The can holds twenty-four pi cubic inches.' },
  't.s2': { html: `The cup is a third of it: 24π ÷ 3 = ${a('8π in³')}.`, say: 'The cup is a third of it: twenty-four pi divided by three is eight pi cubic inches.' },
  't.h': { html: 'Now a gumball with radius 2 in. How tall is the can that just holds it?', say: 'Now a gumball with radius two inches. How tall is the can that just holds it?' },
  't.h-ok': { html: 'Yes: 4 in. The gumball is as tall as its diameter, 2 + 2.', say: 'Yes, four inches. The gumball is as tall as its diameter, two plus two.' },
  't.h-six': { html: 'Six inches was the cup’s can. This can only has to be as tall as the gumball.', say: 'Six inches was the cup’s can. This can only has to be as tall as the gumball.' },
  't.h-r': { html: 'Two inches reaches only to the gumball’s middle. It is as tall as its diameter.', say: 'Two inches reaches only to the gumball’s middle. It is as tall as its diameter.' },
  't.h-no': { html: 'The can is exactly as tall as the gumball. How tall is a ball with radius 2 in?', say: 'The can is exactly as tall as the gumball. How tall is a ball with radius two inches?' },
  't.v': { html: 'Its can holds π · 2² · 4 = 16π in³. How much does the gumball hold, exactly?', say: 'Its can holds pi times two squared times four, sixteen pi cubic inches. How much does the gumball hold, exactly?' },
  't.v-ok': { html: `Yes: two thirds of 16π is ${s('³²⁄₃ π in³')}, about 33.5 in³.`, say: 'Yes. Two thirds of sixteen pi is thirty-two thirds pi cubic inches, about thirty-three and a half.' },
  't.v-half': { html: 'Half of the can would be 8π. Watch the pour: a ball fills two thirds of its can.', say: 'Half of the can would be eight pi. Watch the pour: a ball fills two thirds of its can.' },
  't.v-can': { html: '16π is the whole can. The ball leaves room in the corners: it fills two thirds.', say: 'Sixteen pi is the whole can. The ball leaves room in the corners: it fills two thirds.' },
  't.v-third': { html: 'One third is the cone. The ball fills two thirds of its can.', say: 'One third is the cone. The ball fills two thirds of its can.' },
  't.v-no': { html: 'Take two thirds of 16: multiply by 2, divide by 3. A fraction is fine.', say: 'Take two thirds of sixteen: multiply by two, divide by three. A fraction is fine.' },
  't.fill': { html: 'Type a number first.', say: 'Type a number first.' },
  't.cb-right': { html: 'At the start you picked 3 cups, and you were right. Now you can show why: a cone is one third of its matching cylinder.', say: 'At the start you picked three cups, and you were right. Now you can show why: a cone is one third of its matching cylinder.' },
  't.cb-half': { html: 'At the start you picked 2 cups. A cone looks like half a can, but the pour shows it: three cups fill it.', say: 'At the start you picked two cups. A cone looks like half a can, but the pour shows it: three cups fill it.' },
  't.cb-four': { html: 'At the start you picked 4 cups. The pour shows it takes exactly three.', say: 'At the start you picked four cups. The pour shows it takes exactly three.' },
  // 4. Prove it
  'p.intro': { html: `Jordan says: “My ${a('cone vase')} has radius 3 in and height 10 in. A ${b('can')} with radius 3 in and height 5 in holds 45π in³. A cone is a third of a cylinder, so my vase holds 15π in³.” Is Jordan right?`, say: 'Jordan says: my cone vase has radius three inches and height ten inches. A can with radius three inches and height five inches holds forty-five pi cubic inches. A cone is a third of a cylinder, so my vase holds fifteen pi cubic inches. Is Jordan right?' },
  'p.test': { html: 'Let’s test it. Build the argument, and see where it leads.', say: 'Let’s test it. Build the argument, and see where it leads.' },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: 'Jordan’s can is not the vase’s match,', say: 'Jordan’s can is not the vase’s match,' },
  'p.c2': { html: 'The vase’s own cylinder holds 9π · 10 = 90π in³,', say: 'The vase’s own cylinder holds nine pi times ten, ninety pi cubic inches,' },
  'p.c3': { html: `So the vase holds ${s('30π in³')}, twice Jordan’s answer,`, say: 'So the vase holds thirty pi cubic inches, twice Jordan’s answer,' },
  'p.ok1': { html: 'Right. The vase is twice as tall as the can, so the can is not its match.', say: 'Right. The vase is twice as tall as the can, so the can is not its match.' },
  'p.ok2': { html: 'Right. Same base, 9π, stacked 10 in high.', say: 'Right. Same base, nine pi, stacked ten inches high.' },
  'p.x-any': { html: 'That is exactly Jordan’s slip. The one third only works for the cylinder with the same base and the same height.', say: 'That is exactly Jordan’s slip. The one third only works for the cylinder with the same base and the same height.' },
  'p.x-half': { html: 'A cone fills one third of its cylinder, not half: three cones fill it.', say: 'A cone fills one third of its cylinder, not half. Three cones fill it.' },
  'p.x-twice': { html: 'The one third is used once, on the cone’s own cylinder. Dividing again makes it far too small.', say: 'The one third is used once, on the cone’s own cylinder. Dividing again makes it far too small.' },
  'p.x-other': { html: 'True, but it is the reason for a different line. Which reason makes this line true?', say: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.done': { html: 'That’s a proof: three claims, each with its reason, and the pour backs the last one. Jordan used a cylinder that was not the cone’s match.', say: 'That’s a proof: three claims, each with its reason, and the pour backs the last one. Jordan used a cylinder that was not the cone’s match.' },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
