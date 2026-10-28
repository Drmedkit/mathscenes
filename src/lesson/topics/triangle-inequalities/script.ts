// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/triangle-inequalities/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');
const same = (t: string) => ({ html: t, say: t });

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Three straight sticks: ${A('9 in')}, ${B('4 in')} and ${B('5 in')}. Can you lay them end to end as the three sides of a triangle? Pick one, and say how sure you are.`,
    say: 'Three straight sticks: nine inches, four inches and five inches. Can you lay them end to end as the three sides of a triangle? Pick one, and say how sure you are.',
  },
  'q.cb.flat': same('You said yes, a very flat one. The arcs showed it: the two short sticks meet only on the long one. That is a straight line, with no inside: not a triangle.'),
  'q.cb.pair': {
    html: 'You said yes, because 9 + 4 beats 5 and 9 + 5 beats 4. Those sums contain the long stick, so they always pass. The one check that can fail is the two short sticks against the long one: 4 + 5 is only 9.',
    say: 'You said yes, because nine plus four beats five, and nine plus five beats four. Those sums contain the long stick, so they always pass. The one check that can fail is the two short sticks against the long one: four plus five is only nine.',
  },
  'q.cb.no': {
    html: 'You said no, and the proof agrees: the two shorter sides must add to more than the longest. 4 + 5 = 9 only lays them flat along it.',
    say: 'You said no, and the proof agrees: the two shorter sides must add to more than the longest. Four plus five is exactly nine, which only lays them flat along it.',
  },
  // ---------- 2 worked example ----------
  'e.intro': same('To settle the sticks we need two tools about one triangle: equal sides and equal angles, then longer sides and larger angles. The picture moves first, then the line.'),
  'e.step0': {
    html: `Read only the marks: ${A(`${ov('AB')} ≅ ${ov('AC')}`)}, the reason is ${S('Given')}. Each side faces one angle: ${ov('AB')} faces ∠C, ${ov('AC')} faces ∠B.`,
    say: 'Read only the marks: A B is congruent to A C, and the reason is: given. Each side faces one angle: A B faces angle C, and A C faces angle B.',
  },
  'e.step1': {
    html: `Compare the triangle with its own mirror image: A stays, B and C swap. ${ov('AB')} matches ${ov('AC')}, ∠A matches itself, ${ov('AC')} matches ${ov('AB')}. Side, included angle, side: ${S('△ABC ≅ △ACB')} by ${S('SAS')}.`,
    say: 'Compare the triangle with its own mirror image: A stays, and B and C swap. A B matches A C, angle A matches itself, and A C matches A B. Side, included angle, side: triangle A B C is congruent to triangle A C B, by S A S.',
  },
  'e.step2': {
    html: `In that match, ∠B corresponds to ∠C. So ${S('∠B ≅ ∠C')} (CPCTC). Equal sides face equal angles: the ${B('isosceles theorem')}. Its converse, equal angles face equal sides, is a separate statement with its own proof (ASA).`,
    say: 'In that match, angle B corresponds to angle C. So angle B is congruent to angle C. Equal sides face equal angles: the isosceles theorem. Its converse, equal angles face equal sides, is a separate statement with its own proof.',
  },
  'e.step3': {
    html: `Now stretch ${ov('AC')}. The angle facing it, ${B('∠B')}, grows, and ∠C shrinks. ${S('The longer side faces the larger angle')}, the shorter side the smaller one, and equal sides are the tie.`,
    say: 'Now stretch A C. The angle facing it, angle B, grows, and angle C shrinks. The longer side faces the larger angle, the shorter side the smaller one, and equal sides are the tie.',
  },
  'e.why': { html: 'Why does comparing △ABC with △ACB prove ∠B ≅ ∠C?', say: 'Why does comparing triangle A B C with triangle A C B prove that angle B is congruent to angle C?' },
  'e.why.ok': { html: 'Right: the match is a congruence by SAS, and in it ∠B lands on ∠C.', say: 'Right: the match is a congruence by S A S, and in it angle B lands on angle C.' },
  'e.why.look': { html: 'A drawing that looks symmetric proves nothing. The congruence does: SAS, then corresponding angles.', say: 'A drawing that looks symmetric proves nothing. The congruence does: S A S, then corresponding angles.' },
  'e.why.flip': same('A mirror image is still congruent: a reflection is a rigid motion. That is exactly what the proof uses.'),
  // ---------- 3 your turn ----------
  't.intro': same('Your turn: three triangles, the same two tools.'),
  't.a': {
    html: `In △PQR, ${ov('PQ')} ≅ ${ov('PR')} and m∠P = 40°. Find m∠Q.`,
    say: 'In triangle P Q R, P Q is congruent to P R, and angle P is forty degrees. Find the measure of angle Q.',
  },
  't.a.ok': { html: 'Right: ∠Q and ∠R face the equal sides, so they are equal, and they share 140°: 70° each.', say: 'Right: angles Q and R face the equal sides, so they are equal, and they share one hundred forty degrees: seventy each.' },
  't.a.base': { html: '40° is ∠P, the angle between the congruent sides. The equal angles are the two that face them.', say: 'Forty degrees is angle P, the angle between the congruent sides. The equal angles are the two that face them.' },
  't.a.both': { html: '140° is what ∠Q and ∠R share together. Each gets half.', say: 'One hundred forty degrees is what angles Q and R share together. Each gets half.' },
  't.a.other': { html: 'Which angles face the congruent sides? Those two are equal, and all three share 180°.', say: 'Which angles face the congruent sides? Those two are equal, and all three share one hundred eighty degrees.' },
  't.b': {
    html: `In △XYZ, ∠X ≅ ∠Y, ${'XZ'} = 11 cm and XY = 15 cm. Which other side must be 11 cm?`,
    say: 'In triangle X Y Z, angle X is congruent to angle Y, X Z is eleven centimeters, and X Y is fifteen centimeters. Which other side must be eleven centimeters?',
  },
  't.b.ok': { html: 'Right: ∠X faces YZ and ∠Y faces XZ. Equal angles face equal sides, by the converse.', say: 'Right: angle X faces Y Z, and angle Y faces X Z. Equal angles face equal sides, by the converse.' },
  't.b.adj': { html: 'XY runs between the two equal angles; it faces ∠Z. The equal sides are the ones facing ∠X and ∠Y.', say: 'X Y runs between the two equal angles; it faces angle Z. The equal sides are the ones facing angles X and Y.' },
  't.b.none': { html: 'The converse of the isosceles theorem is true (ASA proves it): equal angles face equal sides.', say: 'The converse of the isosceles theorem is true, and A S A proves it: equal angles face equal sides.' },
  't.c': {
    html: 'In △JKM, m∠J = 48° and m∠K = 75°. Order the sides from shortest to longest.',
    say: 'In triangle J K M, angle J is forty-eight degrees, and angle K is seventy-five degrees. Order the sides from shortest to longest.',
  },
  't.c.ok': { html: 'Right: ∠M = 57°, so the angles go J, M, K, and the sides facing them go KM, JK, JM.', say: 'Right: angle M is fifty-seven degrees, so the angles go J, M, K, and the sides facing them go K M, J K, J M.' },
  't.c.rev': same('Reversed: the shortest side faces the smallest angle.'),
  't.c.third': { html: 'Find ∠M first: 180° − 48° − 75° = 57°. It sits between the other two.', say: 'Find angle M first: one hundred eighty, minus forty-eight, minus seventy-five, is fifty-seven degrees. It sits between the other two.' },
  't.done': same('Both tools work in both directions now: equal sides with equal angles, longer sides with larger angles.'),
  // ---------- 4 prove it ----------
  'p.intro': same('Back to the sticks. In every triangle, is the longest side shorter than the other two together?'),
  'p.build': { html: 'Let’s prove it for any triangle ABC. Extend BA past A to a point D with AD = AC. Fill in each “because”.', say: 'Let’s prove it for any triangle A B C. Extend B A past A to a point D, with A D equal to A C. Fill in each because.' },
  'p.build-test': { html: 'Let’s test that with a proof for any triangle ABC. Extend BA past A to a point D with AD = AC. Fill in each “because”.', say: 'Let’s test that with a proof, for any triangle A B C. Extend B A past A to a point D, with A D equal to A C. Fill in each because.' },
  'p.claim1': { html: '∠ACD = ∠ADC', say: 'Angle A C D equals angle A D C.' },
  'p.claim2': { html: '∠BCD > ∠BDC', say: 'Angle B C D is larger than angle B D C.' },
  'p.claim3': { html: 'BA + AC > BC', say: 'B A plus A C is longer than B C.' },
  'p.c1': { html: 'Triangle ACD is isosceles, so its base angles match.', say: 'Triangle A C D is isosceles, so its base angles match.' },
  'p.c2': { html: 'Angle BCD holds angle ACD and more, so it beats angle BDC.', say: 'Angle B C D holds angle A C D and more, so it beats angle B D C.' },
  'p.c3': { html: 'The larger angle faces the longer side: BD beats BC, and BD is BA plus AC. Proved, for every triangle.', say: 'The larger angle faces the longer side: B D beats B C, and B D is B A plus A C. Proved, for every triangle.' },
  'p.x-look': same('Looks are not a reason: a proof must work for every triangle, not this drawing.'),
  'p.x-ex': same('Examples are evidence. A proof covers every triangle at once.'),
  'p.x-other': same('That reason belongs to a different step. What does this line need?'),
  'p.flat': { html: 'One case is left: what if C lies on segment AB itself?', say: 'One case is left: what if C lies on segment A B itself?' },
  'p.flat.ok': { html: 'Right: then AC + CB is exactly AB. The three points are collinear: no triangle. That is the sticks: 4 + 5 = 9.', say: 'Right: then A C plus C B is exactly A B. The three points are collinear: no triangle. That is the sticks: four plus five is nine.' },
  'p.flat.deg': same('Three points on one line have no inside: that is a segment, not a triangle.'),
  'p.flat.never': { html: 'Equality can happen: exactly when C lies on segment AB. Then there is no triangle.', say: 'Equality can happen: exactly when C lies on segment A B. Then there is no triangle.' },
  'p.done': same('So three lengths make a triangle exactly when the two shorter add to more than the longest. Equal means flat.'),
};
