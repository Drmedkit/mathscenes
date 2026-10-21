// script.ts: every voiced line of parts 1-4: the panel HTML (h) and the spoken text (s, written to be read aloud).
// pages/lessons/circles/voice/lines.json holds the same spoken texts ({id: {text}}); the test keeps them equal.
// Colours: b.a = the area (amber), b.b = the circumference (teal), b.s = the answer (lime); r and d stay plain.
export const SCRIPT: Record<string, { h: string; s: string }> = {
  // 1 the question
  'q.intro': {
    h: 'A pizza is <b>12 inches across</b>. How much cheese covers the top? That is the pizza’s <b class="a">area</b>, in square inches.',
    s: "A pizza is twelve inches across. How much cheese covers the top? That is the pizza's area, in square inches.",
  },
  'q.ask': { h: 'Pick an answer, and say how sure you are.', s: 'Pick an answer, and say how sure you are.' },
  // 2 worked example
  'e.intro': {
    h: 'Four steps. Press each one: the picture moves first, then the notation.',
    s: "Let's work it out in four steps. Press each one, and watch the picture first.",
  },
  'e.step0': {
    h: 'The radius goes from the center to the crust: half of the <b>12 inches</b> across. r = 12 ÷ 2 = <b>6 in</b>.',
    s: 'The radius goes from the center to the crust. It is half of the twelve inches across: six inches.',
  },
  'e.step1': {
    h: 'Cut the pizza into 16 wedges and lay them in a row, one up, one down. The crust is the <b class="b">circumference</b>: C = π × 12 = 12π in. Half of it runs along the top: <b class="b">6π</b>.',
    s: 'Cut the pizza into sixteen wedges and lay them in a row, one up, one down. The crust is the circumference: pi times twelve, twelve pi inches. Half of it runs along the top: six pi.',
  },
  'e.step2': {
    h: 'The same cheese now makes an almost-rectangle, <b class="b">6π</b> long and <b>6</b> tall: a wedge’s side is the radius. <b class="a">A = 6π × 6 = 36π</b> square inches. That is π × r².',
    s: "The same cheese now makes an almost rectangle, six pi long and six tall. A wedge's side is the radius. The area is six pi times six: thirty-six pi square inches. That is pi times r squared.",
  },
  'e.step3': {
    h: '36π ≈ 36 × 3.14 ≈ <b class="s">113 square inches</b>. Check: the shape holds about 3 squares of 6 by 6, and 3 × 36 = 108. Close.',
    s: 'Thirty-six pi is about thirty-six times three point one four: about one hundred thirteen square inches. Check: the shape holds about three squares of six by six, and three times thirty-six is one hundred eight. Close.',
  },
  'e.why': { h: 'Quick check: why is the long side 6π, not 12π?', s: 'Quick check. Why is the long side six pi, not twelve pi?' },
  'e.why.ok': {
    h: 'Yes. Half the wedges have their crust on top, half at the bottom. The top gets half the circumference.',
    s: 'Yes. Half the wedges have their crust on top, half at the bottom. The top gets half the circumference.',
  },
  'e.why.all': {
    h: 'The whole crust is 12π, but only half of it is on top: the other half runs along the bottom. So the long side is 6π.',
    s: 'The whole crust is twelve pi, but only half of it is on top. The other half runs along the bottom. So the long side is six pi.',
  },
  'e.why.d': {
    h: '12 inches is the way across. The top is made of crust, half the way around: 6π, about 19 inches.',
    s: 'Twelve inches is the way across. The top is made of crust, half the way around: six pi, about nineteen inches.',
  },
  // 3 your turn
  't.intro': {
    h: 'Now a round rug, <b>10 feet across</b>. How much floor does it cover? The first two steps are done for you.',
    s: 'Now a round rug, ten feet across. How much floor does it cover? The first two steps are done for you.',
  },
  't.given': {
    h: 'r = 10 ÷ 2 = 5 ft, and the edge of the rug is C = π × 10 = <b class="b">10π ft</b>. Watch the wedges.',
    s: 'The radius is ten divided by two, five feet. The edge of the rug is pi times ten, ten pi feet. Watch the wedges.',
  },
  't.sides': { h: 'How long is the top of the near-rectangle, and how tall is it?', s: 'How long is the top of the near rectangle, and how tall is it?' },
  't.sides.ok': {
    h: 'Yes: the top is half the edge, <b class="b">5π ft</b>, and the height is the radius, <b>5 ft</b>.',
    s: 'Yes. The top is half the edge, five pi feet, and the height is the radius, five feet.',
  },
  't.sides.half': {
    h: 'The whole edge is 10π, but the top only gets half of it. The other half runs along the bottom.',
    s: 'The whole edge is ten pi, but the top only gets half of it. The other half runs along the bottom.',
  },
  't.sides.d': {
    h: 'The height is the side of one wedge, from the center to the edge: the radius, not the diameter.',
    s: 'The height is the side of one wedge, from the center to the edge. That is the radius, not the diameter.',
  },
  't.sides.other': { h: 'Top: half of 10π. Height: the side of one wedge, the radius.', s: 'The top is half of ten pi. The height is the side of one wedge, the radius.' },
  't.area': { h: 'So what is the area, in terms of π?', s: 'So what is the area, in terms of pi?' },
  't.area.ok': {
    h: 'Yes: 5π × 5 = <b class="a">25π</b> square feet. That is π × 5².',
    s: 'Yes. Five pi times five is twenty-five pi square feet. That is pi times five squared.',
  },
  't.area.pow': { h: '5² means 5 × 5, not 5 × 2. Long side × height: 5π × 5.', s: 'Five squared means five times five, not five times two. Long side times height: five pi times five.' },
  't.area.d': { h: 'That squares the diameter, 10. The height of the shape is the radius, 5.', s: 'That squares the diameter, ten. The height of the shape is the radius, five.' },
  't.area.half': { h: 'Use the top, 5π, not the whole edge, 10π: 5π × 5.', s: 'Use the top, five pi, not the whole edge, ten pi. Five pi times five.' },
  't.area.other': { h: 'Area = long side × height = 5π × 5.', s: 'The area is the long side times the height: five pi times five.' },
  't.round': { h: 'About how many square feet is that? Use π ≈ 3.14.', s: 'About how many square feet is that? Use three point one four for pi.' },
  't.round.c': {
    h: '31.4 is 10π, the edge around the rug. The floor it covers is the area, 25π.',
    s: 'Thirty-one point four is ten pi, the edge around the rug. The floor it covers is the area, twenty-five pi.',
  },
  't.round.sq': { h: 'That squares π too. Only the radius is squared: 25 × 3.14.', s: 'That squares pi too. Only the radius is squared: twenty-five times three point one four.' },
  't.round.three': { h: '75 is the quick estimate with π ≈ 3. With 3.14 it is a bit more.', s: 'Seventy-five is the quick estimate with pi as three. With three point one four it is a bit more.' },
  't.round.other': { h: 'Multiply 25 × 3.14.', s: 'Multiply twenty-five by three point one four.' },
  't.done': {
    h: '25π ≈ 25 × 3.14 = <b class="s">78.5 square feet</b>. Check: about 3 × 25 = 75. Close.',
    s: 'Twenty-five pi is about twenty-five times three point one four: seventy-eight point five square feet. Check: about three times twenty-five is seventy-five. Close.',
  },
  't.cb.rr': {
    h: 'At the start you picked <b>36 square inches</b>: 6 × 6, one square of side r. The pizza holds about 3.14 of those squares: 36π ≈ <b class="s">113</b>.',
    s: 'At the start you picked thirty-six square inches. That is six times six, one square of side r. The pizza holds about three point one four of those squares: about one hundred thirteen.',
  },
  't.cb.c': {
    h: 'At the start you picked <b>about 38</b>: that is π × 12, the crust, a length around the edge. The cheese is an area: πr² = 36π ≈ <b class="s">113</b>.',
    s: 'At the start you picked about thirty-eight. That is pi times twelve, the crust, a length around the edge. The cheese is an area: pi r squared, thirty-six pi, about one hundred thirteen.',
  },
  't.cb.right': {
    h: 'At the start you picked <b>about 113 square inches</b>, and that was right: π × 6² = 36π. Now you know why.',
    s: 'At the start you picked about one hundred thirteen square inches, and that was right: pi times six squared, thirty-six pi. Now you know why.',
  },
  't.cb.none': { h: 'At the start: the 12-inch pizza has 36π ≈ 113 square inches of cheese.', s: 'At the start: the twelve inch pizza has thirty-six pi, about one hundred thirteen square inches of cheese.' },
  't.sure.0': { h: 'You were guessing then. Now you can explain it.', s: 'You were guessing then. Now you can explain it.' },
  't.sure.1': { h: 'You were pretty sure then.', s: 'You were pretty sure then.' },
  't.sure.2': { h: 'You were certain then.', s: 'You were certain then.' },
  // 4 prove it
  'p.intro': {
    h: 'Sam says: “A <b>16-inch</b> pizza is twice as wide as an <b>8-inch</b> pizza. So <b>two</b> 8-inch pizzas are as much pizza as one 16-inch pizza.” Is Sam right?',
    s: 'Sam says: a sixteen inch pizza is twice as wide as an eight inch pizza. So two eight inch pizzas are as much pizza as one sixteen inch pizza. Is Sam right?',
  },
  'p.build': { h: 'Prove it. Fill each “because” with the reason that makes the line true.', s: 'Prove it. Fill each because with the reason that makes the line true.' },
  'p.test': { h: 'Let’s test it: build the argument and see where it leads.', s: "Let's test it. Build the argument, and see where it leads." },
  'p.no.k': {
    h: 'That is Sam’s idea. The width is × 2, but the area uses r twice: × 2 × 2 = 4.',
    s: "That is Sam's idea. The width is times two, but the area uses r twice: two times two is four.",
  },
  'p.no.pi': { h: 'π is the same for every circle, about 3.14, big or small.', s: 'Pi is the same for every circle, about three point one four, big or small.' },
  'p.no.add': { h: 'Sizes are multiplied, not added: the radius is × 2, not + 4.', s: 'Sizes are multiplied, not added. The radius is times two, not plus four.' },
  'p.no.other': { h: 'True, but it is the reason for a different line. Which reason makes this line true?', s: 'True, but it is the reason for a different line. Which reason makes this line true?' },
  'p.c1': { h: '', s: 'Right. Sixteen divided by eight is two. The radii, four and eight inches: times two.' },
  'p.c2': { h: '', s: 'The crust is two pi r. Double r, double the crust: eight pi becomes sixteen pi.' },
  'p.c3': { h: '', s: "But the area is pi r squared, and r is used twice: two times two is four. Sixteen pi becomes sixty-four pi. Four small pizzas fit the big one's box the same way." },
  'p.c4': { h: '', s: 'Two small pizzas are only thirty-two pi. It takes four to match sixty-four pi. Sam is wrong.' },
  'p.done': {
    h: 'That’s a proof: each line has its reason, and the picture backs every one. Lengths double; the area is four times as big.',
    s: "That's a proof. Each line has its reason, and the picture backs every one. Lengths double, and the area is four times as big.",
  },
};
