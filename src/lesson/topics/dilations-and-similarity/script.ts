// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours:
// a = the figure we start from / k, b = the center and rays, p = the other figure, s = the answer / the image), `say`
// is the same line written to be read aloud (no digits or symbols). pages/lessons/dilations-and-similarity/voice/
// lines.json holds the `say` texts (the test keeps the two in step). The page shows a line and calls ctx.say(id).
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`, p = (x: string) => `<b class="p">${x}</b>`;
export const HALF = fr(1, 2), THREE_HALVES = fr(3, 2);

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numWords(n: number): string {
  if (n < 20) return ONES[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? '-' + ONES[n % 10]! : '');
  return String(n);
}
const FRW: Record<string, string> = { '1/2': 'one half', '3/2': 'three halves', '9/6': 'nine sixths', '5/4': 'five fourths', '1/3': 'one third' };
/** the panel text read aloud: fractions, symbols and numbers as words, tags out */
export function toSay(h: string): string {
  return h
    .replace(/<span class="fr"><span>(\d+)<\/span><span>(\d+)<\/span><\/span>/g, (_, n: string, d: string) => ` ${FRW[`${n}/${d}`] ?? `${n} over ${d}`} `)
    .replace(/<[^>]+>/g, '').replace(/½/g, ' one half ')
    .replace(/△/g, 'triangle ').replace(/″/g, ' double prime ').replace(/′/g, ' prime ')
    .replace(/ → /g, ', ').replace(/→/g, ', ').replace(/ ÷ /g, ' divided by ').replace(/ × /g, ' times ').replace(/ = /g, ' equals ').replace(/ ≠ /g, ' is not ')
    .replace(/°/g, ' degrees').replace(/ ~ /g, ' is similar to ')
    .replace(/\((−?\d+), (−?\d+)\)/g, '$1, $2').replace(/−(\d)/g, 'negative $1').replace(/ − /g, ' minus ')
    .replace(/\d+/g, d => numWords(Number(d)))
    .replace(/\s+([,.:;?!])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}
const same = (t: string) => ({ html: t, say: toSay(t) });
const two = (html: string, say: string) => ({ html, say });

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': same(`A dilation has a ${b('center O')} and a ${a('scale factor k = 2')}. Dilate ${a('△ABC')} about O.`),
  'q.ask': same('Where does the corner C (1, 4) land? Pick a point, and say how sure you are.'),
  'q.sure': same('How sure are you?'),
  // 2. Worked example
  'e.intro': same('Four steps. Press each one: the picture moves first, then the board writes it down.'),
  'e.s1': same(`A dilation pushes every point straight away from the center. Draw a ${b('ray from O')} through each corner: each image lands on its own ray.`),
  'e.s2': same(`k = 2 means ${s('twice as far from O')}. O to C is one amber bar; O to C′ is two of them. So C (1, 4) lands on ${s('C′ (2, 8)')}.`),
  'e.s3': two(`Do the same for A and B, and join the image. With the center at the origin, every coordinate doubles: ${s('(x, y) → (2x, 2y)')}.`,
    'Do the same for A and B, and join the image. With the center at the origin, every coordinate doubles: x, y goes to two x, two y.'),
  'e.s4': same(`Check what stays. The right angle is still a right angle, and A → B → C still goes counterclockwise. Every side doubled: 8 ÷ 4 = 4 ÷ 2 = ${s('2')}.`),
  'e.why': same('Quick check: why is point 1, (−1, 5), not the image of C?'),
  'e.w-ok': same('Yes. The center is O, so C′ must be on ray OC. Point 1 was pushed out from the middle of the triangle instead.'),
  'e.w-add': same('Adding 2 to each coordinate gives (3, 6), point 3. A dilation multiplies the distance from O by 2; it does not add 2.'),
  'e.w-mid': same('The center is whatever the problem says: here, O. The middle of the triangle is a different center, and it gives a different image.'),
  // 3. Your turn
  't.intro': two(`Your turn. Dilate ${a('△PQR')} about ${b('O')} with ${a('k = ' + HALF)}. The rays and the image of P are done for you.`,
    'Your turn. Dilate triangle PQR about O with k equals one half. The rays and the image of P are done for you.'),
  't.p': same(`P (−6, 4) is 6 left and 4 up from O. Half as far: ${s('P′ (−3, 2)')}.`),
  't.q-ask': same('Your step: where does Q (−2, 4) land?'),
  't.q-ok': same(`Yes: half of (−2, 4) is ${s('(−1, 2)')}. Q′ is on ray OQ, half as far from O.`),
  't.q-big': two(`That doubled it. k = ${HALF} is less than 1, so the image comes closer to O.`, 'That doubled it. k equals one half is less than one, so the image comes closer to O.'),
  't.q-sign': same('Right size, wrong sign. Q is left of O, so Q′ is left of O too: half of −2 is −1.'),
  't.q-one': same('Halve both coordinates, not just one.'),
  't.q-same': same('That is Q itself. Here Q moves halfway toward O.'),
  't.q-no': same('Count from O to Q: 2 left and 4 up. Take half of each.'),
  't.len-ask': same('PR is 6 units long. How long is P′R′?'),
  't.len-ok': two(`Yes: ${HALF} × 6 = ${s('3')}.`, 'Yes: one half times six equals three.'),
  't.len-big': two(`12 is 6 × 2. The image is smaller: ${HALF} × 6.`, 'Twelve is six times two. The image is smaller: one half times six.'),
  't.len-same': same('Only k = 1 keeps lengths. Here every length is halved.'),
  't.len-sub': two(`The scale factor multiplies: ${HALF} × 6, not 6 − ${HALF}.`, 'The scale factor multiplies: one half times six, not six minus one half.'),
  't.len-no': two(`Multiply the length by the scale factor, ${HALF}.`, 'Multiply the length by the scale factor, one half.'),
  't.true-ask': same('Which is true for △P′Q′R′?'),
  't.true-ok': same('Right: a dilation multiplies every length by k and keeps every angle.'),
  't.true-add': two(`The sides are multiplied by ${HALF}, not shortened by 2: the 6 became 3, the 4 became 2.`, 'The sides are multiplied by one half, not shortened by two: the six became three, the four became two.'),
  't.true-ang': same('Angles are not halved: the right angle at P′ is still 90°.'),
  't.cb-right': same('At the start you picked point 2, and you were right: C′ is on ray OC, twice as far from O.'),
  't.cb-mid': same('At the start you picked point 1. That grows the triangle from its own middle. The center was O, so every image lies on a ray from O.'),
  't.cb-add': same('At the start you picked point 3. That adds 2 to each coordinate. A dilation multiplies the distance from the center instead.'),
  't.cb-none': same('Every image lands on its ray from the center, k times as far away.'),
  // 4. Prove it
  'p.intro': same(`Riley has two rectangles: ${a('R is 6 by 4')} and ${p('S is 9 by 5')}. Riley says: “Both have four right angles, so R and S are similar.”`),
  'p.build': same('Now prove it. Fill each “because” with the reason that makes the line true.'),
  'p.build-test': same('Let’s test it. Fill each “because” with the reason that makes the line true, and see where it leads.'),
  'p.c1': same('Right. A dilation stretches every side by the same k, and rigid motions never change a length.'),
  'p.c2': two(`Right. ${THREE_HALVES} × 6 = 9, but ${THREE_HALVES} × 4 = 6, and S is only 5 tall: a strip is left over.`, 'Right. Three halves times six equals nine, but three halves times four equals six, and S is only five tall: a strip is left over.'),
  'p.c3': same('Right. Matching angles are not enough for four-sided shapes. The sides have to share one ratio too.'),
  'p.no-angles': same('That is Riley’s mistake. A long thin rectangle and a square both have four right angles, but they are not the same shape.'),
  'p.no-diff': same('Similar figures are compared by dividing, not subtracting: the question is whether one k works for every side.'),
  'p.no-one': same('One pair of sides is never enough. The short sides must give the same k as the long sides.'),
  'p.x-other': same('True, but it is the reason for a different line. Which reason makes this line true?'),
  'p.done': same('That’s a proof: three claims, each with its reason, and the picture backs every one. R and S are not similar.'),
};
