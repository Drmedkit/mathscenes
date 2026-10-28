// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/triangle-congruence/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Nia wants a copy of ${A('△ABC')}. She measures three parts: ${A('AB = 7 in')}, ${A('BC = 5 in')} and ${A('m∠A = 40°')}, and builds a triangle with the same three parts. Must her triangle be congruent to △ABC? Pick one, and say how sure you are.`,
    say: 'Nia wants a copy of triangle A B C. She measures three parts: A B is seven inches, B C is five inches, and angle A is forty degrees. Then she builds a triangle with the same three parts. Must her triangle be congruent to triangle A B C? Pick one, and say how sure you are.',
  },
  'q.cb.yes': { html: 'You said three matching parts always fix the triangle. The swing just showed two different triangles with the same three parts: the angle was not between the two sides.', say: 'You said three matching parts always fix the triangle. The swing just showed two different triangles with the same three parts: the angle was not between the two sides.' },
  'q.cb.flip': { html: 'You said it works unless she flips it. Flipping was never the problem: a flipped copy is congruent. The problem is that the same parts fit two different triangles.', say: 'You said it works unless she flips it. Flipping was never the problem: a flipped copy is congruent. The problem is that the same parts fit two different triangles.' },
  'q.cb.not': { html: 'You said not necessarily, and the swing agrees: the same two sides and a non-included angle fit two different triangles.', say: 'You said not necessarily, and the swing agrees: the same two sides and an angle that is not between them fit two different triangles.' },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Which three parts are enough? Watch one criterion, SAS, from the marks to the proof. The picture moves first, then the line.', say: 'Which three parts are enough? Watch one criterion, S A S, from the marks to the proof. The picture moves first, then the line.' },
  'e.step0': {
    html: `Read only the marks. One tick: ${A(`${ov('AB')} ≅ ${ov('DE')}`)}. One arc: ${B('∠B ≅ ∠E')}. Two ticks: ${A(`${ov('BC')} ≅ ${ov('EF')}`)}. Three pairs, each with the reason ${S('Given')}. Nothing else counts, however it looks.`,
    say: 'Read only the marks. One tick: segment A B is congruent to segment D E. One arc: angle B is congruent to angle E. Two ticks: segment B C is congruent to segment E F. Three pairs, each with the reason: given. Nothing else counts, however it looks.',
  },
  'e.step1': {
    html: `Where does the angle sit? ∠B is the corner where ${A(ov('AB'))} and ${A(ov('BC'))} meet: it is ${B('included')} between them. Side, angle, side in a row: the pattern is ${S('SAS')}.`,
    say: 'Where does the angle sit? Angle B is the corner where A B and B C meet: it is included between them. Side, angle, side in a row: the pattern is S A S.',
  },
  'e.step2': {
    html: `Why is that enough? Flip a copy of △ABC over, as in a mirror: a reflection is a rigid motion. Slide B onto E. Turn about E until ray BA lies along ray ED: A lands on D, because ${ov('AB')} ≅ ${ov('DE')}. Then ∠B ≅ ∠E puts ray BC along ray EF, and ${ov('BC')} ≅ ${ov('EF')} puts C on F. ${S('Every vertex has its own reason.')}`,
    say: 'Why is that enough? Flip a copy of triangle A B C over, as in a mirror: a reflection is a rigid motion. Slide B onto E. Turn about E until ray B A lies along ray E D: A lands on D, because A B is congruent to D E. Then the congruent angles put ray B C along ray E F, and the congruent sides put C on F. Every vertex has its own reason.',
  },
  'e.step3': {
    html: `Write the conclusion with matching vertices in matching places: A went to D, B to E, C to F. So ${S('△ABC ≅ △DEF')}, by ${S('SAS')}. The motion works for every pair with these marks, not only this drawing.`,
    say: 'Write the conclusion with matching vertices in matching places: A went to D, B to E, C to F. So triangle A B C is congruent to triangle D E F, by S A S. The motion works for every pair with these marks, not only this drawing.',
  },
  'e.why': { html: 'Quick check: why must the angle sit between the two sides?', say: 'Quick check: why must the angle sit between the two sides?' },
  'e.why.ok': { html: 'Right. The included angle points the second side along the right ray; its length then fixes the third vertex.', say: 'Right. The included angle points the second side along the right ray. Its length then fixes the third vertex.' },
  'e.why.order': { html: 'Not quite. The letters are not a mnemonic: S, A, S in a row means the angle sits between the two sides. That is what made each vertex land.', say: 'Not quite. The letters are not a mnemonic. Side, angle, side in a row means the angle sits between the two sides. That is what made each vertex land.' },
  'e.why.any': { html: 'Not quite. With an angle that is not between the sides, the second side can swing to two different places. You will see it in Prove it.', say: 'Not quite. With an angle that is not between the sides, the second side can swing to two different places. You will see it in Prove it.' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `Your turn. ${ov('AC')} and ${ov('BD')} cross at E, and ${A('E is the midpoint of both')}. Prove ${S('△AEB ≅ △CED')}. First put the lines in an order that works (two are decoys), then give each line its reason.`,
    say: 'Your turn. A C and B D cross at E, and E is the midpoint of both. Prove that triangle A E B is congruent to triangle C E D. First put the lines in an order that works. Two of them are decoys. Then give each line its reason.',
  },
  't.wrong': { html: 'Not that one yet.', say: 'Not that one yet. Read the note under the proof.' },
  't.order-done': { html: 'The lines are in a working order. Now the reasons, top to bottom.', say: 'The lines are in a working order. Now the reasons, top to bottom.' },
  't.next': { html: 'The triangles are congruent. What else do you now know, for free?', say: 'The triangles are congruent. What else do you now know, for free?' },
  't.next.ok': { html: `Right: ${ov('AB')} and ${ov('CD')} sit in matching places of △AEB ≅ △CED. Corresponding parts of congruent triangles are congruent: ${S('CPCTC')}.`, say: 'Right: A B and C D sit in matching places of the congruence. Corresponding parts of congruent triangles are congruent. That is C P C T C.' },
  't.next.corr': { html: `Not quite. ${ov('AB')} matches the side of △CED in the same places: C and D, not D and E.`, say: 'Not quite. A B matches the side of the other triangle in the same places: C D, not D E.' },
  't.next.none': { html: 'Not quite. Once the triangles are congruent, every pair of corresponding parts is congruent, marked or not.', say: 'Not quite. Once the triangles are congruent, every pair of corresponding parts is congruent, marked or not.' },
  // ---------- 4 prove it ----------
  'p.intro': { html: 'Back to Nia. Two sides and an angle that is not between them: SSA. Does it always fix the triangle?', say: 'Back to Nia. Two sides and an angle that is not between them: S S A. Does it always fix the triangle?' },
  'p.build': { html: 'Let us build it and see. For each line, pick the reason that makes it true.', say: 'Let us build it and see. For each line, pick the reason that makes it true. First line: C lies on the ray from A that makes forty degrees with A B, and on the circle of radius five inches about B.' },
  'p.build-test': { html: 'Test it by building the triangle. For each line, pick the reason that makes it true.', say: 'Test it by building the triangle. For each line, pick the reason that makes it true. First line: C lies on the ray from A that makes forty degrees with A B, and on the circle of radius five inches about B.' },
  'p.c1': { html: 'Right. Next line: there are two places for C.', say: 'Right. Next line: there are two places for C.' },
  'p.c2': { html: 'Right. Last line: SSA is not a congruence criterion.', say: 'Right. Last line: S S A is not a congruence criterion.' },
  'p.c3': { html: 'Same three parts, two different triangles: SSA is not a criterion.', say: 'Same three parts, two different triangles. S S A is not a criterion.' },
  'p.x-flip': { html: 'Not that one: facing a different way never stops congruence. Look at the third sides.', say: 'Not that one. Facing a different way never stops congruence. Look at the third sides.' },
  'p.x-ex': { html: 'Not that one: one drawing that works proves nothing about every triangle.', say: 'Not that one. One drawing that works proves nothing about every triangle.' },
  'p.x-other': { html: 'True, but it is not the reason for this line. Read the line again.', say: 'True, but it is not the reason for this line. Read the line again.' },
  'p.claim1': { html: 'C lies on the ray from A that makes 40° with AB, and on the circle of radius 5 in about B.', say: 'C lies on the ray from A that makes forty degrees with A B, and on the circle of radius five inches about B.' },
  'p.claim2': { html: 'There are two places for C: C₁ and C₂.', say: 'There are two places for C.' },
  'p.claim3': { html: 'SSA is not a congruence criterion.', say: 'S S A is not a congruence criterion.' },
  'p.hl': { html: `One change: make the given angle a right angle. ${A('AB = 4 in')}, ${A('BC = 5 in')}, ${A('∠A = 90°')}. How many triangles now?`, say: 'One change: make the given angle a right angle. A B is four inches, B C is five inches, and angle A is ninety degrees. How many triangles now?' },
  'p.hl.ok': { html: `Right. The circle meets the line at two points, mirror images across line AB, and only one is on the ray. One triangle: ${S('HL')} is a criterion.`, say: 'Right. The circle meets the line at two points, mirror images across line A B, and only one of them is on the ray. One triangle. H L is a criterion.' },
  'p.hl.two': { html: 'Look again: the second point is below line AB, on the far side of A, off the ray.', say: 'Look again. The second point is below line A B, on the far side of A, off the ray.' },
  'p.hl.none': { html: 'Look again: the circle does reach the ray, once.', say: 'Look again. The circle does reach the ray, once.' },
  'p.done': { html: 'That is the whole story: SSS, SAS, ASA, AAS and HL fix a triangle; AAA and SSA do not.', say: 'That is the whole story. S S S, S A S, A S A, A A S and H L fix a triangle. A A A and S S A do not.' },
};
