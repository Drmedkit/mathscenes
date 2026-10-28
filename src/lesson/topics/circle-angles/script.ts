// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/circle-angles/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const L = (html: string, say: string) => ({ html, say });

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': L(`A round plaza has a gate in its wall, from ${A('A')} to ${A('B')}. Three friends stand on the far side of the wall, at ${B('P')}, ${B('Q')} and ${B('R')}, and each measures how wide the gate looks: the angle between the lines to A and to B. Who sees the widest gate? Pick one, and say how sure you are.`,
    'A round plaza has a gate in its wall, from A to B. Three friends stand on the far side of the wall, at P, Q and R, and each measures how wide the gate looks: the angle between the lines to A and to B. Who sees the widest gate? Pick one, and say how sure you are.'),
  'q.cb.near': L('You said the friend nearest the gate sees it widest. Close up it does look bigger, but the angle is the same everywhere on that arc: half of arc AB. All three see exactly the same angle.',
    'You said the friend nearest the gate sees it widest. Close up it does look bigger, but the angle is the same everywhere on that arc: half of arc A B. All three see exactly the same angle.'),
  'q.cb.same': L('You said all three see the same angle. The proof backs you: every one of them is an inscribed angle on arc AB, so each is half of that arc.',
    'You said all three see the same angle. The proof backs you: every one of them is an inscribed angle on arc A B, so each is half of that arc.'),
  'q.cb.across': L('You said the friend straight across sees it widest. Standing straight across feels central, but every point of that arc sees the gate at half of arc AB: the same angle.',
    'You said the friend straight across sees it widest. Standing straight across feels central, but every point of that arc sees the gate at half of arc A B: the same angle.'),
  // ---------- 2 worked example ----------
  'e.intro': L('One circle, one arc, and three angles that stand on it.', 'One circle, one arc, and three angles that stand on it.'),
  'e.step0': L(`The ${A('central angle')} AOB has its vertex at the center. An arc's measure IS its central angle: ${A('arc AB = 100°')}.`,
    'The central angle A O B has its vertex at the center. An arc\'s measure is its central angle: arc A B is one hundred degrees.'),
  'e.step1': L(`Now the vertex C sits ON the circle: an ${B('inscribed angle')}. Slide C along the arc: it reads ${B('50°')} the whole way. Half of the arc.`,
    'Now the vertex C sits on the circle: an inscribed angle. Slide C along the arc: it reads fifty degrees the whole way. Half of the arc.'),
  'e.step2': L(`Push C across the chord, onto arc AB itself. Now the angle opens onto the OTHER arc, ${A('260°')}, and reads ${S('130°')}: still half its arc.`,
    'Push C across the chord, onto arc A B itself. Now the angle opens onto the other arc, two hundred sixty degrees, and reads one hundred thirty degrees: still half its arc.'),
  'e.why': L('Why is the inscribed angle exactly half the central angle?', 'Why is the inscribed angle exactly half the central angle?'),
  'e.why.ok': L('Yes. Two radii make an isosceles triangle, and the central angle is its exterior angle: the sum of two equal angles. You prove it in a minute.',
    'Yes. Two radii make an isosceles triangle, and the central angle is its exterior angle: the sum of two equal angles. You prove it in a minute.'),
  'e.why.far': L('Distance is not it: C slid nearer and farther and the angle never changed.', 'Distance is not it: C slid nearer and farther and the angle never changed.'),
  'e.why.look': L('Looking is not a reason. The readout says fifty, but a reason must say why for every position of C.', 'Looking is not a reason. The readout says fifty, but a reason must say why for every position of C.'),
  // ---------- 3 your turn ----------
  't.intro': L(`Arc AB measures ${A('128°')}. C, D and E are on the circle; E is on arc AB itself.`, 'Arc A B measures one hundred twenty-eight degrees. C, D and E are on the circle; E is on arc A B itself.'),
  't.c': L(`Worked: ∠ACB is inscribed and stands on arc AB, so it is half: ${S('64°')}.`, 'Worked: angle A C B is inscribed and stands on arc A B, so it is half: sixty-four degrees.'),
  't.d.ask': L('Your turn: what is m∠ADB?', 'Your turn: what is the measure of angle A D B?'),
  't.d.ok': L('Right: D is on the same arc as C, so it sees the same arc AB. Same arc, same angle.', 'Right: D is on the same arc as C, so it sees the same arc A B. Same arc, same angle.'),
  't.d.full': L('That is the whole arc. An angle with its vertex on the circle is half its arc.', 'That is the whole arc. An angle with its vertex on the circle is half its arc.'),
  't.d.supp': L('D is on the same side of the chord as C: same arc, so the same angle, not the supplement.', 'D is on the same side of the chord as C: same arc, so the same angle, not the supplement.'),
  't.d.other': L('Which arc does ∠ADB open onto? Then take half of it.', 'Which arc does angle A D B open onto? Then take half of it.'),
  't.e.ask': L('And m∠AEB? E is on arc AB itself.', 'And the measure of angle A E B? E is on arc A B itself.'),
  't.e.ok': L('Right: E opens onto the other arc, 360° − 128° = 232°, and half of that is 116°. Check: 64° + 116° = 180°.', 'Right: E opens onto the other arc, two hundred thirty-two degrees, and half of that is one hundred sixteen. Check: sixty-four plus one hundred sixteen is one hundred eighty.'),
  't.e.same': L('E is on the other side of chord AB: it cannot see arc AB, it sees the major arc.', 'E is on the other side of chord A B: it cannot see arc A B, it sees the major arc.'),
  't.e.full': L('That is the major arc itself. Take half of it.', 'That is the major arc itself. Take half of it.'),
  't.e.other': L('Find the arc E opens onto: 360° minus arc AB. Then halve it.', 'Find the arc E opens onto: three hundred sixty minus arc A B. Then halve it.'),
  't.done': L('Same arc, same angle; across the chord, supplementary. Now prove why the angle is half.', 'Same arc, same angle; across the chord, supplementary. Now prove why the angle is half.'),
  // ---------- 4 prove it ----------
  'p.intro': L(`The easiest case first: the center O lies on side CB, so CB is a diameter. Call ${B('x = m∠ACB')}. Build the proof, then give every line its reason.`,
    'The easiest case first: the center O lies on side C B, so C B is a diameter. Call x the measure of angle A C B. Build the proof, then give every line its reason.'),
  'p.wrong': L('Not that one.', 'Not that one.'),
  'p.proved': L(`Proved: ${S('x = ½ m(arc AB)')}. The other two cases (center inside or outside the angle) add or subtract two of these.`,
    'Proved: x is half of arc A B. The other two cases, with the center inside or outside the angle, add or subtract two of these.'),
  'p.plaza': L('Back to the plaza. The gate cuts off an arc of 70°, and the three friends all stand on the other arc.', 'Back to the plaza. The gate cuts off an arc of seventy degrees, and the three friends all stand on the other arc.'),
  'p.next': L('So how wide does the gate look to each friend?', 'So how wide does the gate look to each friend?'),
  'p.next.ok': L('Right: each angle is inscribed on the same 70° arc, so each is 35°.', 'Right: each angle is inscribed on the same seventy degree arc, so each is thirty-five degrees.'),
  'p.next.near': L('Nearer does not mean wider: all three angles stand on the same arc.', 'Nearer does not mean wider: all three angles stand on the same arc.'),
  'p.next.full': L('Seventy is the arc. Their vertices are on the circle, so the angles are half of it.', 'Seventy is the arc. Their vertices are on the circle, so the angles are half of it.'),
};
