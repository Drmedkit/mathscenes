// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the whole (straight angle, 180), b = a given angle, s = the unknown / the answer, p = the focus), `say` is the
// same line written to be read aloud ("the measure of angle A O B", "sixty-five degrees" is left to the voice as
// "65 degrees"); pages/lessons/angle-relationships/voice/lines.json holds the `say` texts (the test keeps them in step).
const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

/** the panel text read aloud: tags out, angle names letter by letter, symbols as words */
export function spoken(t: string): string {
  return t.replace(/<[^>]+>/g, '')
    .replace(/m∠/g, 'the measure of angle ').replace(/∠/g, 'angle ')
    .replace(/(\d)°/g, '$1 degrees').replace(/°/g, ' degrees')
    .replace(/\b([A-Z])([A-Z])([A-Z])\b/g, '$1 $2 $3').replace(/\b([A-Z])([A-Z])\b/g, '$1 $2')
    .replace(/ − /g, ' minus ').replace(/ \+ /g, ' plus ').replace(/ = /g, ' equals ')
    .replace(/[“”]/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, c => c.toUpperCase());
}
const same = (t: string) => ({ html: t, say: spoken(t) });

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': same(`Main Street and Oak Avenue are both straight, and they cross. At one corner the angle between them is ${b('65°')}.`),
  'q.ask': same(`What is the angle at the corner ${s('across the intersection')}?`),
  'q.sure': same('How sure are you?'),
  // 2. Worked example
  'e.intro': same('Four steps. Press each one: the picture moves first, then the notation.'),
  'e.s1': same(`The streets become two lines, ${a('AC')} and ${a('BD')}, crossing at O. The only number we know: ${b('m∠AOB = 65°')}.`),
  'e.s2': same(`∠AOB and ∠BOC share the side OB, and their outer sides OA and OC are opposite rays of line AC. That makes them a linear pair: together they fill a ${a('straight angle, 180°')}.`),
  'e.s3': same(`So ${b('65')} + ${s('x')} = ${a('180')}, and ${s('x = 115')}. The angle at the next corner, ${s('m∠BOC')}, is ${s('115°')}.`),
  'e.s4': same(`Line BD gives a second linear pair: 115 + m∠COD = 180, so ${s('m∠COD = 65°')}. The angle across the crossing equals the one we started with.`),
  'e.why': same('Quick check: why do ∠AOB and ∠BOC add up to 180°?'),
  'e.w-ok': same('Yes. The drawn line makes a straight angle, and the two angles fill it exactly.'),
  'e.w-adj': same('Being next to each other is not enough: adjacent angles can add up to anything. The drawn line is what makes 180°.'),
  'e.w-look': same('Looks are not a reason. The reason is in the figure: line AC is drawn.'),
  // 3. Your turn
  't.intro': same(`Now lines ${a('PR')} and ${a('QS')} cross at O, and ${b('m∠POQ = 38°')}. The first two steps are done for you.`),
  't.pair': same(`∠POQ and ∠QOR are a linear pair on line PR: they add up to ${a('180°')}.`),
  't.x-ask': same(`Write the equation, then type ${s('m∠QOR')}.`),
  't.x-ok': same(`Yes: 38 + 142 = 180, so ${s('m∠QOR = 142°')}.`),
  't.x-swap': same('That uses 90. A straight angle is 180°: 38 + x = 180.'),
  't.x-equal': same('That copies the 38°. These two angles sit side by side on a line: they add up to 180°, they are not equal.'),
  't.x-whole': same('180 is the whole straight angle. Take away the 38° you know.'),
  't.x-other': same('Not quite. 38 + x = 180: what is x?'),
  't.y-ask': same(`Now go across the crossing. What is ${s('m∠ROS')}?`),
  't.y-ok': same('Yes: ∠QOR and ∠ROS are a linear pair on line QS, so 180 − 142 = 38. Vertical angles are equal, even when they open sideways.'),
  't.y-supp': same('142° is the angle next to it. Use line QS: 142 + m∠ROS = 180.'),
  't.y-swap': same('A straight angle is 180°, not 90°: 142 + m∠ROS = 180.'),
  't.done': same('The last corner, ∠SOP, is 142°: it is across from ∠QOR.'),
  't.cb-right': same('You were right: 65°. The angle across a crossing always equals the angle you start from, and now you can show why.'),
  't.cb-supp': same('115° is the corner next door: those two are a linear pair. The corner across is 65°.'),
  't.cb-unknown': same('It had no number on it, but it could still be found: two linear pairs give 65°.'),
  't.cb-none': same('The corner across the intersection is 65°.'),
  // 4. Prove it
  'p.intro': same('Jordan measured five crossings with a protractor. Every time, the angles across from each other were equal. Jordan says: “That proves it for every crossing.”'),
  'p.build': same('Right: five examples are not every crossing. Let’s build a proof that works for any two lines. Choose a reason for each statement.'),
  'p.build-test': same('Five checks cannot cover every crossing: there are endlessly many. Let’s build a proof that does. Choose a reason for each statement.'),
  'p.given': same(`Given: lines ${a('AC')} and ${a('BD')} cross at O. Prove: ${b('m∠1')} = ${s('m∠3')}.`),
  'p.r1': same('m∠1 + m∠2 = 180°'),
  'p.r2': same('m∠2 + m∠3 = 180°'),
  'p.r3': same('m∠1 + m∠2 = m∠2 + m∠3'),
  'p.r4': same('m∠1 = m∠3'),
  'p.c1': same('Yes. Line AC is drawn, so ∠1 and ∠2 fill a straight angle.'),
  'p.c2': same('Yes. The same with line BD: ∠2 and ∠3 fill the other straight angle.'),
  'p.c3': same('Both sums are 180°, so they are equal to each other.'),
  'p.c4': same('Take ∠2 away from both sides, and what is left is ∠1 = ∠3.'),
  'p.x-measure': same('Measuring checks one crossing. A reason in a proof has to work for every crossing.'),
  'p.x-adj': same('Adjacent alone does not give 180°. Which drawn line makes the straight angle?'),
  'p.x-other': same('True, but it is the reason for a different statement. Which reason makes this one true?'),
  'p.done': same('That’s a proof. It never used a measurement, so it works for every pair of crossing lines. Watch: whatever the crossing, ∠1 equals ∠3.'),
};
