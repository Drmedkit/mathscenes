// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/similarity/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `A roof frame: the brace DE runs parallel to the beam BC. ${A('AD = 4 ft')}, ${A('DB = 6 ft')} and the brace is ${A('DE = 5 ft')}. How long is the beam BC? Pick one, and say how sure you are.`,
    say: 'A roof frame: the brace D E runs parallel to the beam B C. A D is four feet, D B is six feet, and the brace D E is five feet. How long is the beam B C? Pick one, and say how sure you are.',
  },
  'q.cb.part': { html: 'You paired AD with DB, the part below it. But the beam belongs to the big triangle, whose side is the whole AB = 10. Four tenths of BC is five, so BC = 12.5 ft.', say: 'You paired A D with D B, the part below it. But the beam belongs to the big triangle, whose side is the whole of A B, ten feet. Four tenths of B C is five, so B C is twelve and a half feet.' },
  'q.cb.add': { html: 'You added the extra 6 ft. Similar triangles grow by a factor, not by an amount: AB is 10/4 times AD, so BC is 10/4 times DE, 12.5 ft.', say: 'You added the extra six feet. Similar triangles grow by a factor, not by an amount: A B is ten fourths of A D, so B C is ten fourths of D E, twelve and a half feet.' },
  'q.cb.ok': { html: 'You said 12.5 ft, and the proof agrees: AD pairs with the whole side AB, and AD/DB = AE/EC only holds on the two cut sides.', say: 'You said twelve and a half feet, and the proof agrees: A D pairs with the whole side A B, and the part to part ratio only holds on the two cut sides.' },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Why must the two triangles have the same shape? Watch the proof, then the dilation that carries one onto the other.', say: 'Why must the two triangles have the same shape? Watch the proof, then the dilation that carries one onto the other.' },
  'e.step0': {
    html: `Two angle pairs. Both triangles share ${A('∠A')} (Reflexive). The brace is parallel to the beam, so ${B('∠ADE ≅ ∠ABC')}: corresponding angles. No side lengths are needed.`,
    say: 'Two angle pairs. Both triangles share angle A, by the reflexive property. The brace is parallel to the beam, so angle A D E matches angle A B C: corresponding angles. No side lengths are needed.',
  },
  'e.step1': { html: `Two angle pairs are enough for triangles: ${S('△ADE ~ △ABC')} by AA. The order matters: A with A, D with B, E with C.`, say: 'Two angle pairs are enough for triangles: triangle A D E is similar to triangle A B C, by A A. The order matters: A with A, D with B, E with C.' },
  'e.step2': { html: `Why AA works: dilate △ADE from A by ${A('k = AB/AD = 10/4')}. D lands on B, the parallel brace lands on the beam, and E lands on C.`, say: 'Why A A works: dilate the small triangle from A by k equals ten over four. D lands on B, the parallel brace lands on the beam, and E lands on C.' },
  'e.step3': { html: `Every side grows by the same ${A('k = 10/4')}. So ${B('AD/AB = DE/BC')}: 4/10 = 5/BC, and ${S('BC = 12.5 ft')}.`, say: 'Every side grows by the same factor, ten fourths. So A D over A B equals D E over B C: four tenths equals five over B C, and B C is twelve and a half feet.' },
  'e.why': { html: 'Why does AD pair with AB = 10, and not with DB = 6?', say: 'Why does A D pair with A B, which is ten, and not with D B, which is six?' },
  'e.why.ok': { html: 'Right: AB is the side of the big triangle that matches AD. DB is only part of it.', say: 'Right: A B is the side of the big triangle that matches A D. D B is only part of it.' },
  'e.why.either': { html: 'Not either: AD and DB are both on the line, but only AB is a side of the big triangle.', say: 'Not either: A D and D B are both on the line, but only A B is a side of the big triangle.' },
  'e.why.next': { html: 'DB is next to the beam, but it is not a side of either triangle. Match a side of the small triangle with a side of the big one.', say: 'D B is next to the beam, but it is not a side of either triangle. Match a side of the small triangle with a side of the big one.' },
  // ---------- 3 your turn ----------
  't.intro': { html: `Your turn: an hourglass. ${A('AB ∥ CD')}, and AC and BD cross at E. ${A('AE = 6')}, ${A('EC = 9')}, ${A('AB = 8')}. First: which statement is justified?`, say: 'Your turn: an hourglass. A B is parallel to C D, and A C and B D cross at E. A E is six, E C is nine, and A B is eight. First: which statement is justified?' },
  't.a.ok': { html: 'Right: vertical angles at E, and alternate interior angles at A and C. A matches C, B matches D, E matches E: a half-turn about E, then a dilation.', say: 'Right: vertical angles at E, and alternate interior angles at A and C. A matches C, B matches D, E matches E: a half turn about E, then a dilation.' },
  't.a.pos': { html: 'Not by position: the bottom triangle is turned upside down. A matches C through the alternate interior angles, not the vertex below it.', say: 'Not by position: the bottom triangle is turned upside down. A matches C through the alternate interior angles, not the vertex below it.' },
  't.a.none': { html: 'The chevrons mark AB parallel to CD: that gives alternate interior angles as a second pair.', say: 'The arrow marks say A B is parallel to C D: that gives alternate interior angles as a second pair.' },
  't.b': { html: 'What is the scale factor from △ABE to △CDE?', say: 'What is the scale factor from triangle A B E to triangle C D E?' },
  't.b.ok': { html: 'Right: EC/AE = 9/6 = 3/2, new over old.', say: 'Right: E C over A E, nine over six, which is three halves. New over old.' },
  't.b.flip': { html: 'That is the factor the other way. From △ABE to △CDE: a side of △CDE over its partner, 9/6.', say: 'That is the factor the other way. From A B E to C D E: a side of C D E over its partner, nine over six.' },
  't.b.add': { html: 'That is a difference, 9 − 6. A scale factor is a ratio: 9/6.', say: 'That is a difference, nine minus six. A scale factor is a ratio: nine over six.' },
  't.b.other': { html: 'Use the pair you know on both triangles: EC matches AE, so k = 9/6.', say: 'Use the pair you know in both triangles: E C matches A E, so k is nine over six.' },
  't.c': { html: 'Now find CD.', say: 'Now find C D.' },
  't.c.ok': { html: 'Right: CD = 3/2 × 8 = 12.', say: 'Right: C D is three halves of eight, which is twelve.' },
  't.c.flip': { html: 'That multiplies by 2/3. △CDE is the bigger one: multiply AB by 3/2.', say: 'That multiplies by two thirds. Triangle C D E is the bigger one: multiply A B by three halves.' },
  't.c.add': { html: 'That adds 3. Similar sides are multiplied by one factor: 8 × 3/2.', say: 'That adds three. Similar sides are multiplied by one factor: eight times three halves.' },
  't.c.other': { html: 'CD matches AB (A with C, B with D). Multiply 8 by the scale factor 3/2.', say: 'C D matches A B, because A goes with C and B goes with D. Multiply eight by three halves.' },
  't.done': { html: 'One more idea is hiding in the first figure: the parallel cuts both sides in the same ratio. Time to prove it.', say: 'One more idea is hiding in the first figure: the parallel cuts both sides in the same ratio. Time to prove it.' },
  // ---------- 4 prove it ----------
  'p.intro': { html: 'Back to the roof frame, with AE = 4.8 ft and EC = 7.2 ft. Claim: a segment parallel to one side cuts the other two sides in the same ratio, AD/DB = AE/EC. Always, or only for these numbers?', say: 'Back to the roof frame, with A E four point eight feet and E C seven point two feet. The claim: a segment parallel to one side cuts the other two sides in the same ratio. A D over D B equals A E over E C. Always, or only for these numbers?' },
  'p.build': { html: 'Build the proof: tap the reason for each line.', say: 'Build the proof: tap the reason for each line.' },
  'p.build-test': { html: 'Checking numbers shows it here, not always. Build the general proof: tap the reason for each line.', say: 'Checking numbers shows it here, not always. Build the general proof: tap the reason for each line.' },
  'p.claim1': { html: '△ADE ~ △ABC, with scale factor k = AB/AD.', say: 'Triangle A D E is similar to triangle A B C, with scale factor k, A B over A D.' },
  'p.claim2': { html: 'AB = k·AD and AC = k·AE, with the same k.', say: 'A B is k times A D, and A C is k times A E, with the same k.' },
  'p.claim3': { html: 'DB = (k − 1)·AD and EC = (k − 1)·AE.', say: 'D B is k minus one times A D, and E C is k minus one times A E.' },
  'p.c1': { html: 'AA: the shared angle and the corresponding angles.', say: 'A A: the shared angle and the corresponding angles.' },
  'p.c2': { html: 'One scale factor for every pair of corresponding sides.', say: 'One scale factor for every pair of corresponding sides.' },
  'p.c3': { html: `Whole minus part, on both sides. So ${S('AD/DB = AE/EC = 1/(k − 1)')}, for every parallel, not just these numbers.`, say: 'Whole minus part, on both sides. So A D over D B equals A E over E C, both one over k minus one, for every parallel, not just these numbers.' },
  'p.x-part': { html: 'DB and EC are parts, not sides of either triangle: they are not corresponding sides.', say: 'D B and E C are parts, not sides of either triangle: they are not corresponding sides.' },
  'p.x-look': { html: 'Looking cut at the same place is not a reason: the proof must work for every parallel.', say: 'Looking cut at the same place is not a reason: the proof must work for every parallel.' },
  'p.x-other': { html: 'That reason does not fit this line yet.', say: 'That reason does not fit this line yet.' },
  'p.last': { html: 'Does the side-splitter also give AD/DB = DE/BC?', say: 'Does the side splitter also give A D over D B equals D E over B C?' },
  'p.last.ok': { html: 'Right: DE and BC are not cut. They pair with whole sides: DE/BC = AD/AB.', say: 'Right: D E and B C are not cut. They pair with whole sides: D E over B C equals A D over A B.' },
  'p.last.no': { html: 'DE and BC are not cut by anything: only the two cut sides have part to part ratios. DE/BC = AD/AB.', say: 'D E and B C are not cut by anything: only the two cut sides have part to part ratios. D E over B C equals A D over A B.' },
};
