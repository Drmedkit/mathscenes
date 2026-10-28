// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/triangle-centers/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;
const ov = (s: string) => [...s].map(ch => ch + '̅').join('');

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `Three towns, ${A('Ashford (A)')}, ${A('Brook (B)')} and ${A('Cedar Falls (C)')}, share one water tower. They agree it must stand ${B('exactly the same distance')} from all three town halls. Where should it go? Pick one, and say how sure you are.`,
    say: 'Three towns, Ashford, Brook and Cedar Falls, share one water tower. They agree it must stand exactly the same distance from all three town halls. Where should it go? Pick one, and say how sure you are.',
  },
  'q.cb.mid': { html: 'You picked the middle of the triangle. The centroid looked central, but its distances to the towns came out different. The fair spot is where the perpendicular bisectors meet, and here it is not even inside the triangle.', say: 'You picked the middle of the triangle. The centroid looked central, but its distances to the towns came out different. The fair spot is where the perpendicular bisectors meet, and here it is not even inside the triangle.' },
  'q.cb.bis': { html: 'You picked the angle bisectors. That point is the same distance from the three roads, not from the three towns. The towns need the perpendicular bisectors, and here that point lies outside the triangle.', say: 'You picked the angle bisectors. That point is the same distance from the three roads, not from the three towns. The towns need the perpendicular bisectors, and here that point lies outside the triangle.' },
  'q.cb.pb': { html: 'You picked the perpendicular bisectors, and the proof backs you: every point on them is equidistant from two towns, and the third one passes through the same point. Here it even lies outside the triangle.', say: 'You picked the perpendicular bisectors, and the proof backs you: every point on them is equidistant from two towns, and the third one passes through the same point. Here it even lies outside the triangle.' },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'A triangle has four famous centers. Test each one: is it the same distance from the three towns? The picture moves first, then the numbers.', say: 'A triangle has four famous centers. Test each one: is it the same distance from the three towns? The picture moves first, then the numbers.' },
  'e.step0': {
    html: `The ${A('medians')} join each town to the midpoint of the opposite road. All three meet at the ${S('centroid G')}, the balance point. But its distances to the towns are ${B('all different')}.`,
    say: 'The medians join each town to the midpoint of the opposite road. All three meet at the centroid, G, the balance point. But its distances to the towns are all different.',
  },
  'e.step1': {
    html: `The ${A('angle bisectors')} meet at the ${S('incenter I')}. It is the same distance from the three ${B('roads')}, measured along perpendiculars. From the towns themselves it is not.`,
    say: 'The angle bisectors meet at the incenter, I. It is the same distance from the three roads, measured along perpendiculars. From the towns themselves it is not.',
  },
  'e.step2': {
    html: `The ${A('perpendicular bisectors')} of the roads meet at the ${S('circumcenter O')}. Its three distances ${B('match')}, so a circle about O passes through all three towns. The angle at Brook is obtuse, so O lies ${S('outside')} the triangle.`,
    say: 'The perpendicular bisectors of the roads meet at the circumcenter, O. Its three distances match, so a circle about O passes through all three towns. The angle at Brook is obtuse, so O lies outside the triangle.',
  },
  'e.step3': {
    html: `The ${A('altitudes')}, extended, meet at the ${S('orthocenter H')}, outside too for an obtuse triangle. It has no equal distances at all. So the tower goes at ${S('O')}.`,
    say: 'The altitudes, extended, meet at the orthocenter, H, outside too for an obtuse triangle. It has no equal distances at all. So the tower goes at O.',
  },
  'e.why': { html: 'Why is O the same distance from all three towns?', say: 'Why is O the same distance from all three towns?' },
  'e.why.ok': { html: 'Right. On the perpendicular bisector of a road, every point is equidistant from its two towns. O is on two of them, so all three distances match. Part four proves that first fact.', say: 'Right. On the perpendicular bisector of a road, every point is equidistant from its two towns. O is on two of them, so all three distances match. Part four proves that first fact.' },
  'e.why.mid': { html: 'O is not in the middle at all: it is outside the triangle. Its equal distances come from the perpendicular bisectors.', say: 'O is not in the middle at all: it is outside the triangle. Its equal distances come from the perpendicular bisectors.' },
  'e.why.bis': { html: 'That is the incenter: equal distances to the roads. O is on the perpendicular bisectors, which give equal distances to the towns.', say: 'That is the incenter: equal distances to the roads. O is on the perpendicular bisectors, which give equal distances to the towns.' },
  // ---------- 3 your turn ----------
  't.intro': {
    html: `M and N are the midpoints of ${ov('BC')} and ${ov('AC')}. The medians ${ov('AM')} and ${ov('BN')} meet at G. ${A('AB = 14 cm')}, ${A('AM = 12 cm')}, ${A('BN = 15 cm')}. The first step is done for you.`,
    say: 'M and N are the midpoints of B C and A C. The medians A M and B N meet at G. A B is fourteen centimeters, A M is twelve, and B N is fifteen. The first step is done for you.',
  },
  't.mn': {
    html: `${ov('MN')} joins two midpoints: a ${A('midsegment')}. It is parallel to the third side ${ov('AB')} and half as long: ${S('MN = 7 cm')}.`,
    say: 'M N joins two midpoints: a midsegment. It is parallel to the third side, A B, and half as long: M N is seven centimeters.',
  },
  't.ag.ask': { html: 'G is the centroid. How long is AG?', say: 'G is the centroid. How long is A G?' },
  't.ag.ok': { html: `Right: the centroid cuts each median ${S('2 : 1')}, the long part at the vertex. AG = two thirds of 12 = 8 cm.`, say: 'Right: the centroid cuts each median two to one, the long part at the vertex. A G is two thirds of twelve, eight centimeters.' },
  't.ag.bisects': { html: 'G is not the midpoint of the median. It splits AM two to one.', say: 'G is not the midpoint of the median. It splits A M two to one.' },
  't.ag.ratio': { html: 'That is the short part. The long part, two thirds of the median, is next to the vertex A.', say: 'That is the short part. The long part, two thirds of the median, is next to the vertex A.' },
  't.ag.three': { html: 'The split is two to one, not three to one: AG is two thirds of AM.', say: 'The split is two to one, not three to one: A G is two thirds of A M.' },
  't.ag.other': { html: 'The centroid splits a median into thirds: two thirds from the vertex to G.', say: 'The centroid splits a median into thirds: two thirds from the vertex to G.' },
  't.gn.ask': { html: 'Now the other median. How long is GN?', say: 'Now the other median. How long is G N?' },
  't.gn.ok': { html: `Right: GN is the short part, one third of 15: ${S('5 cm')}. Every median is cut at its two-thirds point.`, say: 'Right: G N is the short part, one third of fifteen: five centimeters. Every median is cut at its two thirds point.' },
  't.gn.long': { html: 'That is BG, the long part. GN is next to the midpoint: one third of BN.', say: 'That is B G, the long part. G N is next to the midpoint: one third of B N.' },
  't.gn.half': { html: 'G is not halfway along BN. GN is one third of it.', say: 'G is not halfway along B N. G N is one third of it.' },
  't.gn.other': { html: 'Split BN into thirds: two thirds from B to G, one third from G to N.', say: 'Split B N into thirds: two thirds from B to G, one third from G to N.' },
  't.done': { html: 'Two centers, two theorems: a midsegment is half the third side, and the centroid sits two thirds of the way down every median. Now prove the fact behind the water tower.', say: 'Two centers, two theorems: a midsegment is half the third side, and the centroid sits two thirds of the way down every median. Now prove the fact behind the water tower.' },
  // ---------- 4 prove it ----------
  'p.intro': {
    html: `The tower rests on one fact: ${B('a point on the perpendicular bisector of a segment is the same distance from its endpoints')}. Measuring one drawing proves nothing. Build the proof: order the lines, then give each its reason.`,
    say: 'The tower rests on one fact: a point on the perpendicular bisector of a segment is the same distance from its endpoints. Measuring one drawing proves nothing. Build the proof: order the lines, then give each its reason.',
  },
  'p.wrong': { html: 'Not that one. Read the reason under it.', say: 'Not that one. Read the reason under it.' },
  'p.proved': { html: `Proved, for every point on the line, not just this drawing: ${S('PA = PB')}.`, say: 'Proved, for every point on the line, not just this drawing: P A equals P B.' },
  'p.next': { html: 'Back to the towns. O is on the perpendicular bisectors of AB and BC. Why must the third one, of AC, pass through O too?', say: 'Back to the towns. O is on the perpendicular bisectors of A B and B C. Why must the third one, of A C, pass through O too?' },
  'p.next.ok': { html: 'Right: OA = OB and OB = OC give OA = OC, and a point equidistant from A and C lies on their perpendicular bisector. That converse is proved with SSS.', say: 'Right: O A equals O B, and O B equals O C, so O A equals O C. And a point equidistant from A and C lies on their perpendicular bisector. That converse is proved with S S S.' },
  'p.next.two': { html: 'Any two lines that are not parallel meet. That says nothing about where a third line goes.', say: 'Any two lines that are not parallel meet. That says nothing about where a third line goes.' },
  'p.next.look': { html: 'Looking right is not a reason: a drawing can be off by a hair. The reason is OA = OC.', say: 'Looking right is not a reason: a drawing can be off by a hair. The reason is that O A equals O C.' },
  'p.next.circ': { html: 'That uses the theorem backwards: it starts from a point on the bisector, which is what we need to show. Use the converse.', say: 'That uses the theorem backwards: it starts from a point on the bisector, which is what we need to show. Use the converse.' },
  'p.done': { html: `So all three perpendicular bisectors meet at O, and ${S('the circle about O passes through all three towns')}: the tower is fair.`, say: 'So all three perpendicular bisectors meet at O, and the circle about O passes through all three towns: the tower is fair.' },
};
