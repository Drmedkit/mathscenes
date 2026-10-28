// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/constructions/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');
const same = (html: string, say?: string) => ({ html, say: say ?? html.replace(/<[^>]+>/g, '') });

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Jun and Ava both need the midpoint of ${A(ov('AB'))}. Jun measures it with a ruler, ${A('9.8 cm')}, and marks ${A('4.9 cm')}. Ava opens her compass wider than half, swings equal arcs from A and from B, and joins the two crossings. Whose method gives the midpoint exactly, even in principle? Pick one, and say how sure you are.`,
    say: 'Jun and Ava both need the midpoint of segment A B. Jun measures it with a ruler, nine point eight centimeters, and marks four point nine. Ava opens her compass wider than half, swings equal arcs from A and from B, and joins the two crossings. Whose method gives the midpoint exactly, even in principle? Pick one, and say how sure you are.',
  },
  'q.cb.jun': same('You picked Jun’s ruler. A ruler reading is only as good as the reading: nine point eight might be nine point eight one. Ava’s arcs force the midpoint for every segment, and you just proved why.'),
  'q.cb.ava': same('You picked Ava’s arcs, and the proof agrees: one compass width, two congruences, and the midpoint and the right angle are forced. No reading involved.'),
  'q.cb.same': same('You said both just draw a point. The arcs are not decoration: each one records a distance, and those distances are exactly what the proof used.'),
  // ---------- 2 worked example ----------
  'e.intro': same('Watch Ava’s construction one step at a time. Each arc is a distance condition; nothing is measured.'),
  'e.step0': {
    html: `Open the compass ${A('wider than half')} of ${ov('AB')} (any such width). Needle on A: every point on these arcs is exactly that width, ${A('w')}, from A.`,
    say: 'Open the compass wider than half of segment A B, any such width. Needle on A: every point on these arcs is exactly that width, w, from A.',
  },
  'e.step1': {
    html: `${A('Keep the width.')} Needle on B. The crossings P and Q are on both arcs, so they inherit both conditions: ${B('PA = PB = w')} and ${B('QA = QB = w')}.`,
    say: 'Keep the width. Needle on B. The crossings P and Q are on both arcs, so they inherit both conditions: P A equals P B equals w, and Q A equals Q B equals w.',
  },
  'e.step2': same(`Join P and Q with the straightedge: a line through two points you already have. It crosses ${ov('AB')} at M.`, 'Join P and Q with the straightedge: a line through two points you already have. It crosses segment A B at M.'),
  'e.step3': {
    html: `M is the ${S('midpoint')}, and line PQ is ${S('perpendicular')} to ${ov('AB')}: the perpendicular bisector. Both conditions at once. Why they are forced is your job in Prove it.`,
    say: 'M is the midpoint, and line P Q is perpendicular to segment A B: the perpendicular bisector. Both conditions at once. Why they are forced is your job in Prove it.',
  },
  'e.why': same('Why did the compass have to keep the same width from B?'),
  'e.why.ok': same('Yes. With one width, each crossing is as far from A as from B. That equality is the whole construction.'),
  'e.why.neat': same('Neatness has nothing to do with it. The equal width is what makes P and Q equally far from A and B.'),
  'e.why.any': same('Not any arcs: with two different widths, P is farther from one end than the other, and the line misses the midpoint.'),
  // ---------- 3 your turn ----------
  't.intro': same('Your turn: bisect the angle at O. Tap the steps in an order that works. One step is not a construction step.'),
  't.decoy': same('That step reads a protractor. A construction never measures: the angle must be halved by arcs alone.'),
  't.early': same('Not yet. That step needs a point or a width that is not on the paper yet.'),
  't.order-done': same('Ray OX is constructed. Now, why does it really bisect the angle?', 'Ray O X is constructed. Now, why does it really bisect the angle?'),
  't.next': same('Why is the angle at O split into two congruent angles?'),
  't.next.ok': same('Yes. O A equals O B from one arc, A X equals B X from the equal arcs, and O X is shared: S S S. Then the angles at O are corresponding parts.'),
  't.next.look': same('Looks are not a reason. Find three pairs of equal sides the compass gave you.'),
  't.next.sas': same('S A S would need the two angles at O to be equal, and that is what you are proving. Use only the sides the compass gave you.'),
  // ---------- 4 prove it ----------
  'p.intro': same('Back to Ava. Does her construction give the midpoint at a right angle for every segment and every allowed width, or only when it is drawn carefully?'),
  'p.build': same('Then prove it. Fill each “because” with the reason that earns the line. Two chips are traps.'),
  'p.build-test': same('Let us see what the arcs force, not what a careful drawing shows. Fill each “because” with the reason that earns the line. Two chips are traps.'),
  'p.claim1': same(`${B('PA = PB')} and ${B('QA = QB')}`, 'P A equals P B and Q A equals Q B'),
  'p.claim2': same(`${B('△APQ ≅ △BPQ')}, so ∠APM ≅ ∠BPM`, 'Triangle A P Q is congruent to triangle B P Q, so angle A P M is congruent to angle B P M'),
  'p.claim3': same(`${S('AM = BM')} and ${S('∠AMP = ∠BMP = 90°')}`, 'A M equals B M, and angles A M P and B M P are both ninety degrees'),
  'p.c1': same('The arcs about A and B were drawn with one width: P and Q are each equally far from A and B.'),
  'p.c2': same('Three pairs of sides: S S S. So the two angles at P match.'),
  'p.c3': same('S A S on the two lower triangles: the halves match, and the two angles at M are equal and fill a straight angle. Each is ninety degrees.'),
  'p.x-look': same('Looking like the middle is not a reason. Which equal lengths did the compass give you?'),
  'p.x-measure': same('A protractor reading checks one drawing. The proof must work for every segment and every width.'),
  'p.x-other': same('That reason does not earn this line. What does the line need, and which step gave it?'),
  'p.done': same('Proved: for every segment and every width wider than half, line P Q bisects the segment at a right angle. That is why a construction is exact, and a ruler reading is not.'),
};
