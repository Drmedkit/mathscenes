// script.ts: every voiced panel line of parts 1-4, the panel HTML beside the spoken text (no digits or symbols).
// pages/lessons/right-triangle-trig/voice/lines.json is generated from this table (the topic test checks it).
const A = (s: string) => `<b class="a">${s}</b>`, B = (s: string) => `<b class="b">${s}</b>`, S = (s: string) => `<b class="s">${s}</b>`;

export const SCRIPT: Record<string, { html: string; say: string }> = {
  // ---------- 1 the question ----------
  'q.intro': {
    html: `A kite string is ${A('100 ft')} long, pulled straight, and makes a ${A('40°')} angle with the horizontal at your hand. Nobody can reach the kite to measure. How high is it above your hand? Pick one, and say how sure you are.`,
    say: 'A kite string is one hundred feet long, pulled straight, and makes a forty degree angle with the horizontal at your hand. Nobody can reach the kite to measure. How high is it above your hand? Pick one, and say how sure you are.',
  },
  'q.cb.lin': {
    html: 'You scaled the height with the angle: 40/90 of 100 ft. But the height does not grow in step with the angle (at 90° it would be 100 ft, at 60° already 86.6 ft). The fixed ratio of a 40° triangle gives 64.3 ft.',
    say: 'You scaled the height with the angle: forty ninetieths of a hundred feet. But the height does not grow in step with the angle. At sixty degrees it is already eighty six point six feet. The fixed ratio of a forty degree triangle gives sixty four point three feet.',
  },
  'q.cb.size': {
    html: 'You said it cannot be known without another length. The angle fixes the shape: every right triangle with a 40° angle is similar, so its height is always 0.643 of its string. That is sin 40°.',
    say: 'You said it cannot be known without another length. The angle fixes the shape: every right triangle with a forty degree angle is similar, so its height is always about zero point six four three of its string. That is the sine of forty degrees.',
  },
  'q.cb.ok': {
    html: 'You said about 64 ft, and that is right: the 40° angle fixes the shape, so the height is sin 40° ≈ 0.643 of the string, about 64.3 ft.',
    say: 'You said about sixty four feet, and that is right: the forty degree angle fixes the shape, so the height is the sine of forty degrees, about zero point six four three of the string. About sixty four point three feet.',
  },
  // ---------- 2 worked example ----------
  'e.intro': { html: 'Four steps from the angle to the height. Watch the picture first; the notation follows.', say: 'Four steps from the angle to the height. Watch the picture first; the notation follows.' },
  'e.step0': {
    html: `Name the sides from the ${A('40°')} angle. The string is across from the right angle: the ${'<b>hypotenuse</b>'}. The height does not touch the 40° angle: the ${A('opposite leg')}. The ground line touches it: the ${B('adjacent leg')}.`,
    say: 'Name the sides from the forty degree angle. The string is across from the right angle: the hypotenuse. The height does not touch the forty degree angle: the opposite leg. The line along the ground touches it: the adjacent leg.',
  },
  'e.step1': {
    html: `A 30 ft string at the same 40° rises 19.28 ft: opposite over hypotenuse is 0.643. Both triangles have a right angle and a 40° angle, so they are similar (AA). Dilate the small one from your hand: every side grows by the same factor, so the ratio stays ${S('0.643')}. It belongs to the angle: we call it sin 40°.`,
    say: 'A thirty foot string at the same forty degrees rises nineteen point two eight feet: opposite over hypotenuse is about zero point six four three. Both triangles have a right angle and a forty degree angle, so they are similar, by angle angle. Dilate the small one from your hand: every side grows by the same factor, so the ratio stays the same. It belongs to the angle: we call it the sine of forty degrees.',
  },
  'e.step2': {
    html: `Sine is ${A('opposite')} over hypotenuse. Here: sin 40° = h / 100. One unknown, one equation.`,
    say: 'Sine is opposite over hypotenuse. Here: the sine of forty degrees equals h over one hundred. One unknown, one equation.',
  },
  'e.step3': {
    html: `Multiply both sides by 100: h = 100 sin 40°. In degree mode that is 64.278…; round once, at the end: ${S('h ≈ 64.3 ft')}.`,
    say: 'Multiply both sides by one hundred: h equals one hundred times the sine of forty degrees. In degree mode that is sixty four point two seven eight; round once, at the end: about sixty four point three feet.',
  },
  'e.why': { html: 'Why may we use the 30 ft triangle’s ratio for the kite?', say: 'Why may we use the thirty foot triangle’s ratio for the kite?' },
  'e.why.ok': { html: 'Right: same angles, so similar; one scale factor for every side, and it cancels in the ratio.', say: 'Right: same angles, so similar. One scale factor for every side, and it cancels in the ratio.' },
  'e.why.size': { html: 'The kite triangle is bigger, but every side is bigger by the same factor. The ratio does not change with size.', say: 'The kite triangle is bigger, but every side is bigger by the same factor. The ratio does not change with size.' },
  'e.why.any': { html: 'Not for every angle: a 60° triangle has a different shape and a different ratio. It works because both angles are 40°.', say: 'Not for every angle: a sixty degree triangle has a different shape and a different ratio. It works because both angles are forty degrees.' },
  // ---------- 3 your turn ----------
  'tt.intro': {
    html: `A ladder leans against a wall at ${A('75°')} with the level ground, its foot ${A('4 ft')} from the wall. How long is the ladder? First: which ratio links the 75°, the 4 ft and the ladder L?`,
    say: 'A ladder leans against a wall at seventy five degrees with the level ground, its foot four feet from the wall. How long is the ladder? First: which ratio links the seventy five degrees, the four feet and the ladder L?',
  },
  'tt.a.ok': { html: 'Right: from 75°, the 4 ft touches the angle (adjacent) and the ladder is the hypotenuse.', say: 'Right: from seventy five degrees, the four feet touches the angle, so it is adjacent, and the ladder is the hypotenuse.' },
  'tt.a.sin': { html: 'The 4 ft touches the 75° angle, so it is the adjacent leg, not the opposite one.', say: 'The four feet touches the seventy five degree angle, so it is the adjacent leg, not the opposite one.' },
  'tt.a.tan': { html: 'Tangent pairs the two legs: it would bring in the wall height, a second unknown.', say: 'Tangent pairs the two legs: it would bring in the wall height, a second unknown.' },
  'tt.b': { html: 'Now solve cos 75° = 4 / L. How long is the ladder, to the nearest tenth of a foot?', say: 'Now solve: cosine of seventy five degrees equals four over L. How long is the ladder, to the nearest tenth of a foot?' },
  'tt.b.ok': { html: `Right: L = 4 ÷ cos 75° = 15.45…, so ${S('L ≈ 15.5 ft')}. Longer than the 4 ft leg, as a hypotenuse must be.`, say: 'Right: L is four divided by the cosine of seventy five degrees, fifteen point four five, so about fifteen point five feet. Longer than the four foot leg, as a hypotenuse must be.' },
  'tt.b.mul': { html: 'L is in the denominator, so multiplying gives a "ladder" of 1 ft, shorter than a leg. Multiply both sides by L, then divide: L = 4 ÷ cos 75°.', say: 'L is in the denominator, so multiplying gives a ladder of about one foot, shorter than a leg. Multiply both sides by L, then divide: L equals four divided by the cosine of seventy five degrees.' },
  'tt.b.rad': { html: 'That is what radian mode gives. Check the calculator: cos 60° should show 0.5.', say: 'That is what radian mode gives. Check the calculator: the cosine of sixty degrees should show one half.' },
  'tt.b.other': { html: 'Divide 4 by cos 75° (in degree mode), then round once to the nearest tenth.', say: 'Divide four by the cosine of seventy five degrees, in degree mode, then round once to the nearest tenth.' },
  'tt.c': { html: 'Ladder makers suggest the 4-to-1 rule. A 16 ft ladder with its foot 4 ft from the wall: what angle does it make with the ground, to the nearest degree?', say: 'Ladder makers suggest the four to one rule. A sixteen foot ladder with its foot four feet from the wall: what angle does it make with the ground, to the nearest degree?' },
  'tt.c.ok': { html: `Right: cos x = 4/16, so x = cos⁻¹(0.25) = 75.52…°, ${S('about 76°')}. The rule puts a ladder near 75°.`, say: 'Right: the cosine of x is four sixteenths, so x is the inverse cosine of one quarter, seventy five point five degrees, about seventy six degrees. The rule puts a ladder near seventy five degrees.' },
  'tt.c.sin': { html: 'That is the angle at the top, against the wall: sin⁻¹ pairs the 4 ft with the ladder as if it were opposite. From the ground angle, 4 ft is adjacent: cos⁻¹.', say: 'That is the angle at the top, against the wall. From the ground angle, the four feet is adjacent, so use the inverse cosine.' },
  'tt.c.ratio': { html: '0.25 is the ratio, not the angle. The inverse key turns the ratio back into an angle: cos⁻¹(0.25).', say: 'Zero point two five is the ratio, not the angle. The inverse key turns the ratio back into an angle.' },
  'tt.c.other': { html: 'cos x = 4/16. Use cos⁻¹ in degree mode, then round to the nearest degree.', say: 'The cosine of x is four sixteenths. Use the inverse cosine in degree mode, then round to the nearest degree.' },
  'tt.done': { html: 'Side from an angle: pick the ratio, solve, size check. Angle from two sides: the inverse key.', say: 'A side from an angle: pick the ratio, solve, and check the size. An angle from two sides: the inverse key.' },
  // ---------- 4 prove it ----------
  'p.intro': { html: 'In right triangle ABC (right angle at C), is sin A = cos B always, or only for some angles?', say: 'In right triangle A B C, with the right angle at C, is the sine of A equal to the cosine of B always, or only for some angles?' },
  'p.build': { html: 'Build the reason, link by link. Tap the reason that makes each claim true.', say: 'Build the reason, link by link. Tap the reason that makes each claim true.' },
  'p.build-test': { html: 'Test it: sin 30° = 0.5 and cos 60° = 0.5. It holds for every right triangle; build the reason, link by link.', say: 'Test it: the sine of thirty degrees is one half, and so is the cosine of sixty degrees. It holds for every right triangle. Build the reason, link by link.' },
  'p.claim1': { html: '∠A and ∠B add to 90°', say: 'Angle A and angle B add to ninety degrees' },
  'p.claim2': { html: 'the leg a is opposite ∠A and adjacent to ∠B', say: 'the leg a is opposite angle A and adjacent to angle B' },
  'p.claim3': { html: 'sin A = a/c and cos B = a/c, so sin A = cos(90° − A)', say: 'the sine of A is a over c, and the cosine of B is a over c, so the sine of A equals the cosine of ninety degrees minus A' },
  'p.c1': { html: 'Right: the angles add to 180°, and C takes 90°.', say: 'Right: the angles add to one hundred eighty degrees, and C takes ninety.' },
  'p.c2': { html: 'Right: opposite and adjacent depend on where you stand.', say: 'Right: opposite and adjacent depend on where you stand.' },
  'p.c3': { html: `Right: the same leg over the same hypotenuse. ${S('sin A = cos(90° − A)')} for every acute angle A.`, say: 'Right: the same leg over the same hypotenuse. The sine of A equals the cosine of ninety degrees minus A, for every acute angle.' },
  'p.x-all': { html: 'Sine and cosine are equal only at 45°. They match when the angles are complementary.', say: 'Sine and cosine of the same angle are equal only at forty five degrees. They match when the angles are complementary.' },
  'p.x-pos': { html: 'Position on the page does not name a side. Stand at the angle: the leg it touches is adjacent.', say: 'Position on the page does not name a side. Stand at the angle: the leg it touches is adjacent.' },
  'p.x-other': { html: 'That reason does not make this claim true. Look at what the claim says.', say: 'That reason does not make this claim true. Look at what the claim says.' },
  'p.last': { html: 'So which equals sin 40°?', say: 'So which one equals the sine of forty degrees?' },
  'p.last.ok': { html: 'Right: 90° − 40° = 50°. The kite’s height is also 100 cos 50°, using the angle at the kite.', say: 'Right: ninety minus forty is fifty. The kite’s height is also one hundred times the cosine of fifty degrees, using the angle at the kite.' },
  'p.last.same': { html: 'sin 40° ≈ 0.643 but cos 40° ≈ 0.766: equal only at 45°. Use the complement.', say: 'The sine of forty is about zero point six four three, but the cosine of forty is about zero point seven six six. They are equal only at forty five degrees. Use the complement.' },
  'p.last.sin': { html: 'sin 50° is the cosine of 40°, not the sine. Switch the function AND use the complement.', say: 'The sine of fifty is the cosine of forty, not the sine. Switch the function and use the complement.' },
};
