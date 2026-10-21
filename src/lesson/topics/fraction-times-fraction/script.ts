// script.ts: every line the panel shows in parts 1-4, by voice id. `html` is what the panel shows (role colours),
// `say` is the same line written to be read aloud; pages/lessons/fraction-times-fraction/voice/lines.json holds the
// `say` texts (the test keeps the two in step). The page shows a line with ctx.say(id) next to it.
import { fr } from '../../runtime/item';

const a = (s: string) => `<b class="a">${s}</b>`, b = (s: string) => `<b class="b">${s}</b>`, s = (x: string) => `<b class="s">${x}</b>`;

export const LINES: Record<string, { html: string; say: string }> = {
  // 1. The question
  'q.intro': { html: `${a(`${fr(3, 4)} of a pan of brownies`)} is frosted. Maya eats ${b(`${fr(2, 3)} of the frosted part`)}.`, say: 'Three fourths of a pan of brownies is frosted. Maya eats two thirds of the frosted part.' },
  'q.ask': { html: 'How much of the whole pan does Maya eat?', say: 'How much of the whole pan does Maya eat?' },
  'q.sure': { html: 'How sure are you?', say: 'How sure are you?' },
  // 2. Worked example
  'e.intro': { html: 'Four steps. Press each one: the picture moves first, then the notation.', say: 'Four steps. Press each one: the picture moves first, then the notation.' },
  'e.s1': { html: `The frosted part is cut into ${b('3')} equal rows. One row is ${b(fr(1, 3))} of the frosted part.`, say: 'The frosted part is cut into three equal rows. One row is one third of the frosted part.' },
  'e.s2': { html: `Maya eats ${b('2')} of the ${b('3')} rows: ${b(fr(2, 3))} of the ${a(fr(3, 4))}.`, say: 'Maya eats two of the three rows: two thirds of the three fourths.' },
  'e.s3': { html: `Run the cuts on through the whole pan: ${s('12')} equal cells. Maya's part is ${s('6')} of them, ${s(fr(6, 12))} of the pan.`, say: "Run the cuts on through the whole pan: twelve equal cells. Maya's part is six of them, six twelfths of the pan." },
  'e.s4': { html: `${b(fr(2, 3))} × ${a(fr(3, 4))} = ${s(fr(6, 12))}. Rows times columns on top; all the cells of ONE pan underneath.`, say: 'Two thirds times three fourths is six twelfths. Rows times columns on top; all the cells of one pan underneath.' },
  'e.why': { html: 'Quick check: why is 12 the bottom number?', say: 'Quick check: why is twelve the bottom number?' },
  'e.w-ok': { html: 'Yes. The bottom number counts the equal cells of ONE whole pan: 3 rows × 4 columns.', say: 'Yes. The bottom number counts the equal cells of one whole pan: three rows times four columns.' },
  'e.w-rule': { html: 'The rule is right, but it has a reason: the cuts make 3 × 4 = 12 equal cells in the whole pan.', say: 'The rule is right, but it has a reason: the cuts make three times four, twelve equal cells in the whole pan.' },
  'e.w-part': { html: 'The frosted part has only 9 cells. 12 counts the whole pan.', say: 'The frosted part has only nine cells. Twelve counts the whole pan.' },
  // 3. Your turn
  't.intro': { html: `Now ${a(`${fr(2, 5)} of a pan`)} is left. Sam packs ${b(`${fr(3, 4)} of what is left`)} for lunch. The first two steps are done for you.`, say: 'Now two fifths of a pan is left. Sam packs three fourths of what is left for lunch. The first two steps are done for you.' },
  't.count': { html: 'The cuts run on through the whole pan. What fraction of the whole pan does Sam pack?', say: 'The cuts run on through the whole pan. What fraction of the whole pan does Sam pack?' },
  't.fill': { html: 'Fill in the top and the bottom box.', say: 'Fill in the top and the bottom box.' },
  't.c-ok': { html: `Yes: ${s('6')} of the ${s('20')} cells of the whole pan, ${s(fr(6, 20))}.`, say: 'Yes: six of the twenty cells of the whole pan, six twentieths.' },
  't.c-part': { html: `${fr(3, 4)} is the part of the leftover. Against the whole pan there are 20 cells, and 6 are packed.`, say: 'Three fourths is the part of the leftover. Against the whole pan there are twenty cells, and six are packed.' },
  't.c-add': { html: 'That adds the cells of both fractions. Only the cells in both count: 3 rows × 2 columns.', say: 'That adds the cells of both fractions. Only the cells in both count: three rows times two columns.' },
  't.c-other': { html: 'Count the small cells: how many are packed, and how many are in the whole pan?', say: 'Count the small cells: how many are packed, and how many are in the whole pan?' },
  't.write': { html: 'Tap the chips to write it as one equation.', say: 'Tap the chips to write it as one equation.' },
  't.w-ok': { html: `Yes: ${b(fr(3, 4))} × ${a(fr(2, 5))} = ${s(fr(6, 20))}. “Of” means times.`, say: 'Yes: three fourths times two fifths is six twentieths. Of means times.' },
  't.w-add': { html: 'That adds or takes away. Sam packs a part OF the leftover: that is times.', say: 'That adds or takes away. Sam packs a part of the leftover: that is times.' },
  't.w-other': { html: 'Use the two fractions of the story and the sign for “of”.', say: 'Use the two fractions of the story and the sign for of.' },
  't.size': { html: `Is Sam's lunch more or less than the ${fr(2, 5)} of a pan that was left?`, say: "Is Sam's lunch more or less than the two fifths of a pan that was left?" },
  't.s-ok': { html: `Right: ${fr(3, 4)} is less than 1, so Sam packs less than all of the leftover: ${fr(6, 20)} is less than ${fr(8, 20)}.`, say: 'Right: three fourths is less than one, so Sam packs less than all of the leftover. Six twentieths is less than eight twentieths.' },
  't.s-no': { html: `Look at the pan: the packed cells are only part of the leftover. ${fr(3, 4)} is less than 1, so the product is less than ${fr(2, 5)}.`, say: 'Look at the pan: the packed cells are only part of the leftover. Three fourths is less than one, so the product is less than two fifths.' },
  't.simple': { html: `${fr(6, 20)} = ${s(fr(3, 10))}: the same amount in simplest form.`, say: 'Six twentieths is three tenths: the same amount in simplest form.' },
  't.cb-right': { html: `At the start you picked ${fr(6, 12)}, and you were right. Now you can show why.`, say: 'At the start you picked six twelfths, and you were right. Now you can show why.' },
  't.cb-part': { html: `At the start you picked ${fr(2, 3)}: that names the frosted part, not the whole pan. Maya eats ${s(fr(6, 12))} of the pan.`, say: 'At the start you picked two thirds: that names the frosted part, not the whole pan. Maya eats six twelfths of the pan.' },
  't.cb-add': { html: `At the start you picked 1&#8202;${fr(5, 12)}: that adds the fractions. Maya eats ${s(fr(6, 12))} of the pan, less than the frosted part.`, say: 'At the start you picked one and five twelfths: that adds the fractions. Maya eats six twelfths of the pan, less than the frosted part.' },
  // 4. Prove it
  'p.intro': { html: `Riley says: “Multiplying always makes a number bigger, so ${fr(2, 3)} × ${fr(3, 4)} is more than ${fr(3, 4)}.”`, say: 'Riley says: multiplying always makes a number bigger, so two thirds times three fourths is more than three fourths.' },
  'p.test': { html: "Let's test it. Build the argument and see where it leads.", say: "Let's test it. Build the argument and see where it leads." },
  'p.prove': { html: 'Now prove it. Fill each “because” with the reason that makes the line true.', say: 'Now prove it. Fill each because with the reason that makes the line true.' },
  'p.c1': { html: `${fr(2, 3)} × ${fr(3, 4)} means ${b(fr(2, 3))} OF the frosted ${a(fr(3, 4))},`, say: 'Two thirds times three fourths means two thirds of the frosted three fourths,' },
  'p.c2': { html: `and 2 of 3 equal rows is <b>less than all 3 rows</b>,`, say: 'and two of three equal rows is less than all three rows,' },
  'p.c3': { html: `so ${fr(2, 3)} × ${fr(3, 4)} = ${s(fr(6, 12))} is less than ${a(`${fr(3, 4)} = ${fr(9, 12)}`)}.`, say: 'so two thirds times three fourths, six twelfths, is less than three fourths, nine twelfths.' },
  'p.x-bigger': { html: "That is Riley's idea, the one being tested. Multiplying by a number less than 1 makes it smaller.", say: "That is Riley's idea, the one being tested. Multiplying by a number less than one makes it smaller." },
  'p.x-examples': { html: 'One example is not a reason: a reason must say why it works for every number.', say: 'One example is not a reason: a reason must say why it works for every number.' },
  'p.x-shrink': { html: `Careful: ${fr(5, 4)} × ${fr(3, 4)} is MORE than ${fr(3, 4)}. It depends on the factor being less than 1.`, say: 'Careful: five fourths times three fourths is more than three fourths. It depends on the factor being less than one.' },
  'p.x-other': { html: 'True, but it is the reason for a different line.', say: 'True, but it is the reason for a different line.' },
  'p.done': { html: "That's a proof: three claims, each with its reason, and the picture backs every one. Multiplying by a fraction less than 1 makes a number smaller.", say: "That's a proof: three claims, each with its reason, and the picture backs every one. Multiplying by a fraction less than one makes a number smaller." },
};
export const SCRIPT: Record<string, string> = Object.fromEntries(Object.entries(LINES).map(([k, v]) => [k, v.html]));
