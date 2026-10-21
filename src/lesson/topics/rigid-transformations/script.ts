// script.ts: every line the panel shows in parts 1-4, by voice line id. The spoken text of each id (written to be
// read aloud) is in pages/lessons/rigid-transformations/voice/lines.json; the test checks both have the same ids.
// Colour roles in the text: a = the preimage (amber), b = the motion (teal), s = the image / answer (lime), w = wrong.
export const SCRIPT: Record<string, string> = {
  // 1 The question
  'q.intro': `A puzzle game moves the tile <b class="a">ABC</b> to <b class="s">A′B′C′</b> in one single move. Which kind of move was it? Pick an answer, and say how sure you are.`,

  // 2 Worked example
  'e.intro': 'Four steps. Press each one: the picture moves first, then the board writes it down.',
  'e.step0': `Every point has a partner: <b class="a">A</b> goes to <b class="s">A′</b>, B to B′, C to C′. Match by the letters, never by where things sit on the page.`,
  'e.step1': `Go round <b class="a">A, B, C</b>: counterclockwise. Go round <b class="s">A′, B′, C′</b>: counterclockwise too. The order is kept, so it is a slide or a turn. A flip would reverse it.`,
  'e.step2': `The three dashed segments meet at the origin <b class="b">O</b>, each cut exactly in half. Every point stays as far from O as before: a half turn, <b class="b">180° about O</b>.`,
  'e.step3': `<b class="a">A(1, 1)</b> lands on <b class="s">A′(−1, −1)</b>. Every point does the same: both coordinates change sign. The rule is <b class="s">(x, y) → (−x, −y)</b>.`,
  'e.why': 'Quick check: why is this a turn, and not a flip?',
  'e.why.ok': 'Yes. A flip reverses the order of the corners. Here the order is kept, and every point turned 180° about O.',
  'e.why.flip': 'Upside down is not the test: a half turn looks upside down too. Check the order of the corners: it is kept.',
  'e.why.slide': 'Every motion moves points. In a slide they all move the same way; here A, B and C move in different directions.',

  // 3 Your turn
  't.intro': `A new tile, a new move. I'll do the first two steps; then it's your turn.`,
  't.given': `Matched: A to A′, B to B′, C to C′. The order A, B, C is counterclockwise in both, so it is kept: a slide or a turn.`,
  't.turn': `Find what stays fixed. Which single motion maps <b class="a">ABC</b> onto <b class="s">A′B′C′</b>?`,
  't.turn.ok': `Right: a quarter turn, <b class="b">90° counterclockwise about O</b>. O to A and O to A′ make a right angle.`,
  't.turn.reverse': `Follow A to A′ around O: it goes the other way, counterclockwise.`,
  't.turn.flip': `A flip would reverse the order of the corners, and here it is kept. It is a turn.`,
  't.rule': `Write the rule. <b class="a">A(2, 1)</b> went to <b class="s">A′(−1, 2)</b>, and <b class="a">B(5, 1)</b> to <b class="s">B′(−1, 5)</b>. Which rule does every point follow?`,
  't.rule.ok': `Right: <b class="s">(x, y) → (−y, x)</b>. The coordinates swap, and the new first one changes sign.`,
  't.rule.swap': `A plain swap gives A′ = (1, 2). The real A′ is (−1, 2): the new x also changes sign.`,
  't.rule.reverse': `That rule turns clockwise. Test it on A: it gives (1, −2), but A′ is (−1, 2).`,
  't.apply': `Use the rule on a new point. Where does <b class="a">D(4, −3)</b> land?`,
  't.apply.ok': `Right: <b class="s">D′(3, 4)</b>. Watch D turn the same quarter turn.`,
  't.apply.swap': `That only swaps the coordinates. The rule is (−y, x): the first coordinate is minus y.`,
  't.apply.reverse': `That turns D clockwise. The rule (−y, x) turns counterclockwise.`,
  't.apply.flip': `That reflects D across the y-axis. Use the rule: (−y, x).`,
  't.apply.miss': `Put the numbers in the rule: x = 4, y = −3, so (−y, x) = ?`,
  't.len': `Last check. <b class="a">AB</b> is 3 units long. How long is <b class="s">A′B′</b>?`,
  't.len.ok': `Right: a turn keeps every length, so A′B′ is 3 units, with no measuring.`,
  't.len.remeasure': `No need to measure. A rigid motion keeps every length, so A′B′ = AB = 3.`,
  't.len.moved': `How far the tile travels does not matter. The sides keep their lengths: A′B′ = 3.`,
  't.done': `Back to the puzzle game: the order of the corners was kept and every point turned about O, so the move was a <b class="s">turn</b>, a 180° rotation.`,

  // 4 Prove it
  'p.intro': `Maya uses the rule <b class="b">(x, y) → (2x, −y)</b> and says: “It flips the triangle over the x-axis, so it's a rigid motion. Look: the right angle at A is still a right angle.” Is Maya right?`,
  'p.build.no': 'Now prove it. Fill each “because” with the reason that makes the line true.',
  'p.build.yes': `Let's test it. Fill each “because” with the reason that makes the line true, and see where it leads.`,
  'p.c1': `B(3, 1) goes to B′(6, −1): the rule doubles x and flips the sign of y.`,
  'p.c2': `AB is 2 squares long, but A′B′ is 4 squares long. The side doubled.`,
  'p.c3': `A rigid motion keeps every length. One changed length is enough: Maya's rule is not a rigid motion.`,
  'p.done': `That's a proof: three claims, each with its reason, and the picture backs every one. One kept angle is not enough.`,
  'p.chip.angle': `That is exactly Maya's mistake: one kept angle does not mean every length is kept.`,
  'p.chip.size': 'A rigid motion keeps the size too. A wider copy is not a rigid image.',
  'p.chip.slide': 'The points do not all move the same way: B moves 3 to the right, A only 1. It is not a slide.',
  'p.chip.other': 'True, but it is the reason for a different line. Which one makes this line true?',
};
