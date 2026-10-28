// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/geometry-foundations/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`, W = (s: string) => `<b class="w">${s}</b>`;
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Rita draws ${ov('AB')} and a point M on it, then starts a proof with the line ${S('AM = MB')}. Every line of a proof needs a reason. What may she write in the reason column? Pick one, and say how sure you are.`,
    say: 'Rita draws segment A B and a point M on it, then starts a proof with the line: A M equals M B. Every line of a proof needs a reason. What may she write in the reason column? Pick one, and say how sure you are.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'A first real proof, in four steps. The picture moves first, then the line and its reason.', say: 'A first real proof, in four steps. The picture moves first, then the line and its reason.' },
  'e.step0': {
    html: `Given: A, B, C, D lie on a line in that order, and ${A('AC')} = ${B('BD')}. Prove: AB = CD. Line 1 is the given itself, with the reason ${S('Given')}. The drawing may show the order of the points, nothing more.`,
    say: 'Given: A, B, C, D lie on a line in that order, and A C equals B D. Prove: A B equals C D. Line one is the given itself, with the reason: given. The drawing may show the order of the points, nothing more.',
  },
  'e.step1': {
    html: `Split each whole. B is between A and C, so ${A('AC = AB + BC')}. C is between B and D, so ${B('BD = BC + CD')}. Both lines cite the ${S('Segment Addition Postulate')}: a starting statement of the course.`,
    say: 'Split each whole. B is between A and C, so A C equals A B plus B C. C is between B and D, so B D equals B C plus C D. Both lines cite the segment addition postulate: a starting statement of the course.',
  },
  'e.step2': {
    html: `AC and BD are equal, and each one equals a sum. Put the sums in their places: AB + BC = BC + CD. The reason is the ${S('Substitution Property of Equality')}.`,
    say: 'A C and B D are equal, and each one equals a sum. Put the sums in their places: A B plus B C equals B C plus C D. The reason is the substitution property of equality.',
  },
  'e.step3': {
    html: `Both sides share BC. Take it away from both: ${S('AB = CD')}, by the ${S('Subtraction Property of Equality')}. Now the ticks on AB and CD are earned: every line has a reason, and none of them is “it looks that way”.`,
    say: 'Both sides share B C. Take it away from both: A B equals C D, by the subtraction property of equality. Now the ticks on A B and C D are earned: every line has a reason, and none of them is: it looks that way.',
  },
  'e.why': { html: 'Quick check: AB and CD looked equal from the start. Why not write AB = CD in line 1?', say: 'Quick check: A B and C D looked equal from the start. Why not write A B equals C D in line one?' },
  'e.why.ok': { html: 'Right: a drawing may show how points lie, not sizes. Only givens, markings and accepted statements count.', say: 'Right: a drawing may show how points lie, not sizes. Only givens, markings and accepted statements count.' },
  'e.why.look': { html: 'An accurate-looking drawing can still be off, and the next one may look different. Looks are never a reason.', say: 'An accurate looking drawing can still be off, and the next one may look different. Looks are never a reason.' },
  'e.why.circ': { html: 'That is what we are proving. Writing it first would assume the answer: that is circular.', say: 'That is what we are proving. Writing it first would assume the answer: that is circular.' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `Your turn: the ${A('vertical angles')} ∠1 and ∠3. Given: ∠1, ∠2 and ∠2, ∠3 are linear pairs. Prove: ∠1 ≅ ∠3. Lines 1 and 2 are written for you.`,
    say: 'Your turn: the vertical angles, angle one and angle three. Given: angle one and angle two, and angle two and angle three, are linear pairs. Prove: angle one is congruent to angle three. Lines one and two are written for you.',
  },
  't.r3': { html: 'Line 3 puts the two sums in each other’s place. Which reason fits?', say: 'Line three puts the two sums in each other’s place. Which reason fits?' },
  't.r3.ok': { html: 'Right: both sums equal 180°, so they equal each other.', say: 'Right: both sums equal one hundred eighty degrees, so they equal each other.' },
  't.r3.circ': { html: 'That is the theorem we are proving. It cannot be a reason inside its own proof.', say: 'That is the theorem we are proving. It cannot be a reason inside its own proof.' },
  't.r3.add': { html: 'Nothing was added to both sides. The two sums were put in each other’s place.', say: 'Nothing was added to both sides. The two sums were put in each other’s place.' },
  't.s4': { html: 'Line 4 uses the Subtraction Property: take m∠2 away from both sides. Which statement is line 4?', say: 'Line four uses the subtraction property: take the measure of angle two away from both sides. Which statement is line four?' },
  't.s4.ok': { html: 'Right: m∠2 leaves both sides.', say: 'Right: the measure of angle two leaves both sides.' },
  't.s4.fig': { html: 'Close, but ∠1 is the angle itself, a figure. Numbers are equal: m∠1 = m∠3.', say: 'Close, but angle one is the angle itself, a figure. Numbers are equal: the measure of angle one equals the measure of angle three.' },
  't.s4.side': { html: 'm∠2 has to leave both sides, not one.', say: 'The measure of angle two has to leave both sides, not one.' },
  't.r5': { html: 'Line 5 turns equal measures into congruent angles. Which reason?', say: 'Line five turns equal measures into congruent angles. Which reason?' },
  't.r5.ok': { html: 'Right: congruent angles are angles with equal measures. A definition works both ways.', say: 'Right: congruent angles are angles with equal measures. A definition works both ways.' },
  't.r5.circ': { html: 'Still circular: that theorem is what this proof establishes.', say: 'Still circular: that theorem is what this proof establishes.' },
  't.r5.lp': { html: 'The Linear Pair Postulate gives a sum of 180°, not congruence.', say: 'The linear pair postulate gives a sum of one hundred eighty degrees, not congruence.' },
  't.status': { html: 'Every line has a reason. Before this proof, “vertical angles are congruent” was something you had measured. What is it now?', say: 'Every line has a reason. Before this proof, vertical angles are congruent was something you had measured. What is it now?' },
  't.status.ok': { html: 'Right: a theorem, the Vertical Angles Theorem. Watch: any crossing, the same proof.', say: 'Right: a theorem, the vertical angles theorem. Watch: any crossing, the same proof.' },
  't.status.conj': { html: 'It was a conjecture while it was only measured. A proof from accepted statements makes it a theorem.', say: 'It was a conjecture while it was only measured. A proof from accepted statements makes it a theorem.' },
  't.status.post': { html: 'A postulate is accepted without proof. This one now has a proof: a theorem.', say: 'A postulate is accepted without proof. This one now has a proof: a theorem.' },
  'q.cb.look': { html: 'Back to Rita: you picked “it looks that way”. A drawing can show where M is on the line, never that AM = MB.', say: 'Back to Rita: you picked, it looks that way. A drawing can show where M is on the line, never that A M equals M B.' },
  'q.cb.measure': { html: 'Back to Rita: you picked measuring. A ruler checks one drawing, roughly. A reason has to hold for every figure that meets the givens.', say: 'Back to Rita: you picked measuring. A ruler checks one drawing, roughly. A reason has to hold for every figure that meets the givens.' },
  'q.cb.none': { html: 'Back to Rita: you were right. With no given and no marking, nothing licenses AM = MB. A given like “M is the midpoint” would: then the reason is the definition of midpoint.', say: 'Back to Rita: you were right. With no given and no marking, nothing licenses A M equals M B. A given like, M is the midpoint, would: then the reason is the definition of midpoint.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `Kai measured ∠3 and ∠6 in five drawings of parallel lines cut by a transversal. Every time they matched. Kai says: “${A('Alternate interior angles are congruent')}: proved.” Is it proved?`,
    say: 'Kai measured angle three and angle six in five drawings of parallel lines cut by a transversal. Every time they matched. Kai says: alternate interior angles are congruent: proved. Is it proved?',
  },
  'p.build': { html: 'Not yet: five drawings are five examples. Build the proof. First tap the lines in an order that works (two are decoys), then pick a reason for each.', say: 'Not yet: five drawings are five examples. Build the proof. First tap the lines in an order that works, two are decoys, then pick a reason for each.' },
  'p.build-test': { html: 'Five drawings are five examples, and the next drawing could differ. Build the real proof: first tap the lines in an order that works (two are decoys), then pick a reason for each.', say: 'Five drawings are five examples, and the next drawing could differ. Build the real proof: first tap the lines in an order that works, two are decoys, then pick a reason for each.' },
  'p.order-done': { html: 'The order works: every line comes after what it uses. Now the reasons, top to bottom.', say: 'The order works: every line comes after what it uses. Now the reasons, top to bottom.' },
  'p.done': { html: `Proved: from ${A('ℓ ∥ m')}, the Corresponding Angles Postulate and the Vertical Angles Theorem, ${S('m∠3 = m∠6')} for every transversal. That is the Alternate Interior Angles Theorem.`, say: 'Proved: from parallel lines, the corresponding angles postulate and the vertical angles theorem, angle three and angle six are equal for every transversal. That is the alternate interior angles theorem.' },
  'p.wrong': { html: 'Not that one: read the feedback under the proof.', say: 'Not that one: read the feedback under the proof.' },
};
void B; void W;
